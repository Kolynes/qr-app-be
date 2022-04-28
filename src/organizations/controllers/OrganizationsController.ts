import { Request } from "express";
import { Collection, ObjectId } from "mongodb";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { IAuthService, IUser } from "../../auth/types";
import { ObjectIDForm } from "../../common/forms";
import Helpers from "../../common/helpers";
import { collection, view } from "../../database";
import { EDirectoryType, IDirectoryLike, IDirectoryLikeView } from "../../inventory/types";
import { EEmailTemplate, IMailService } from "../../mail/types";
import { ECollections, EServices, EViews } from "../../types";
import CodeGenerator from "../../utils/code-generator";
import { Controller, Delete, Get, Post, Put } from "../../utils/controller";
import { useForm, useParamsForm } from "../../utils/form";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { OrganizationAddMembersForm, OrganizationCreateForm, OrganizationMembersForm } from "../forms";
import { INewMember, IOrganization, IOrganizationView } from "../types";

const helpers = new Helpers();
@Controller([AuthMiddleware])
export default class OrganizationController {

  @service(EServices.mail)
  private mailService!: IMailService;

  @collection(ECollections.organization)
  private Organization!: Collection<IOrganization>;

  @collection(ECollections.inventory)
  private Inventory!: Collection<IDirectoryLike>;

  @collection(ECollections.user)
  private User!: Collection<IUser>;

  @service(EServices.auth)
  private authService!: IAuthService;

  @view(EViews.organization)
  private OrganizationView!: Collection<IOrganizationView>;


  @Post("", [useForm(OrganizationCreateForm)])
  async createOrganization(request: Request, form: OrganizationCreateForm): Promise<Responder> {
    const user = await this.authService.getUser(request) as IUser;
    const { name } = form.cleanedData;
    const result = await this.Organization.count({
      owner: user._id,
      name
    });
    if (result > 0) return jsonResponse({
      status: 400,
      error: new JsonResponseError(
        "Invalid parameters",
        { name: ["This organization already exists"] }
      )
    });
    const organization = form.cleanedData as IOrganization;
    organization.owner = user._id!;
    organization.members = [user._id!]
    organization.createDate = new Date()
    await this.Organization.insertOne(organization);
    const rootFolder = await this.Inventory.insertOne({
      organization: organization._id!,
      directoryType: EDirectoryType.folder,
      createDate: new Date(),
    });
    await this.Organization.updateOne(
      { _id: organization._id },
      { $set: { rootFolder: rootFolder.insertedId, updateDate: new Date() } }
    );
    return jsonResponse({
      status: 201,
      data: await this.OrganizationView.findOne({ id: organization._id })
    });
  }

  @Delete("/:id", [useParamsForm(ObjectIDForm)])
  async deleteOrganization(request: Request, form: ObjectIDForm): Promise<Responder> {
    const { id } = form.cleanedData;
    const result = await helpers.getValidOrganizationByOwnershipOrResponse(id, request);
    if (result instanceof Function) return result;
    await this.Organization.updateOne(
      { _id: result.id },
      { $set: { deleteDate: new Date() } }
    );
    return jsonResponse({ status: 200 });
  }

  @Get("/:id", [useParamsForm(ObjectIDForm)])
  async getOrganization(request: Request, form: ObjectIDForm): Promise<Responder> {
    const { id } = form.cleanedData;
    const result = await helpers.getValidOrganizationByMembershipOrResponse(id, request);
    if (result instanceof Function) return result;
    return jsonResponse({
      status: 200,
      data: result
    });
  }

  @Get()
  async getOrganizations(request: Request): Promise<Responder> {
    const user = await this.authService.getUser(request) as IUser;
    const organizations = await this.OrganizationView.find({
      members: {
        $elemMatch: { id: user._id! }
      }
    }).toArray();
    return jsonResponse({
      status: 200,
      data: organizations
    });
  }

  @Put("/:id/add", [useParamsForm(ObjectIDForm), useForm(OrganizationAddMembersForm)])
  async addMembers(request: Request, idForm: ObjectIDForm, membersForm: OrganizationAddMembersForm): Promise<Responder> {
    const { id } = idForm.cleanedData;
    const result = await helpers.getValidOrganizationByOwnershipOrResponse(id, request);
    if (result instanceof Function) return result;
    const { newMembers } = membersForm.cleanedData;
    const set = new Set(result.members.map(member => member.id));
    for (let newMember of newMembers as INewMember[]) {
      let memberUser = await this.User.findOne({ email: newMember.email }) as IUser;
      if (!memberUser) {
        const password = CodeGenerator.generateCode(8);
        await this.authService.setPassword(
          newMember as IUser,
          password
        );
        (newMember as IUser).createDate = new Date()
        await this.User.insertOne(newMember as IUser);
        memberUser = newMember as IUser;
        this.mailService.sendMail(
          EEmailTemplate.newUserMemberWelcomeNote,
          { password, ...newMember },
          newMember.email
        ).catch(console.error);
      }
      if (set.has(memberUser._id!)) continue;
      set.add(memberUser._id!);
      this.mailService.sendMail(
        EEmailTemplate.memberWelcomeNote,
        { organizationName: result.name, firstName: memberUser.firstName },
        memberUser.email
      ).catch(console.error);
    }
    const members = [];
    for (let id of set) members.push(id);
    await this.Organization.updateOne(
      { _id: result.id }, 
      { $set: { members, updateDate: new Date() } }
    );
    return jsonResponse({
      status: 200,
      data: await this.OrganizationView.findOne({ id: result.id })
    });
  }

  @Put("/:id/remove", [useParamsForm(ObjectIDForm), useForm(OrganizationMembersForm)])
  async removeMembers(request: Request, idForm: ObjectIDForm, membersForm: OrganizationMembersForm) {
    const user = await this.authService.getUser(request) as IUser;
    const { id } = idForm.cleanedData;
    const result = await helpers.getValidOrganizationByOwnershipOrResponse(id, request);
    if (result instanceof Function) return result;
    const { members } = membersForm.cleanedData;
    const removeSet = new Set(members as ObjectId[]);
    const currentSet = new Set(result.members.map(member => member.id));
    result.members = [];
    for (let id of removeSet) {
      if (id == user._id) return jsonResponse({
        status: 400,
        error: new JsonResponseError(
          "Invalid parameters",
          { members: ["the owner of an organization cannot be deleted"] }
        )
      });
      currentSet.delete(id);
    }
    const updatedMembers = [];
    for (let id of currentSet) updatedMembers.push(id);
    await this.Organization.updateOne(
      { _id: result.id }, 
      { $set: { members: updatedMembers, updateDate: new Date() } }
    );
    return jsonResponse({
      status: 200,
      data: await this.OrganizationView.findOne({ id: result.id })
    });
  }
}