import { Request } from "express";
import { Collection, ObjectId } from "mongodb";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { IAuthService, IUser } from "../../auth/types";
import { ObjectIDForm } from "../../common/forms";
import { collection, view } from "../../database";
import { EDirectoryType, IDirectoryLike } from "../../inventory/types";
import { EEmailTemplate, IMailService } from "../../mail/types";
import { ECollections, EServices, EViews } from "../../types";
import CodeGenerator from "../../utils/code-generator";
import { Controller, Delete, Get, Post, Put } from "../../utils/controller";
import { useForm, useParamsForm } from "../../utils/form";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { OrganizationAddMembersForm, OrganizationCreateForm, OrganizationMembersForm } from "../forms";
import { INewMember, IOrganization, IOrganizationView } from "../types";

@Controller([AuthMiddleware])
export default class OrganizationController {
  @service(EServices.auth)
  private authService!: IAuthService;

  @service(EServices.mail)
  private mailService!: IMailService;

  @collection(ECollections.organization)
  private Organization!: Collection<IOrganization>;

  @view(EViews.organization)
  private OrganizationView!: Collection<IOrganizationView>;

  @collection(ECollections.inventory)
  private Inventory!: Collection<IDirectoryLike>;

  @collection(ECollections.user)
  private User!: Collection<IUser>;

  @Post("", [useForm(OrganizationCreateForm)])
  async createOrganization(request: Request, form: OrganizationCreateForm): Promise<Responder> {
    const user = await this.authService.getUser(request) as IUser;
    const { name } = form.cleanedData;
    const result = await this.Organization.count({
      owner: user._id, 
      name 
    });
    if(result > 0) return jsonResponse({
      status: 400,
      error: new JsonResponseError(
        "Invalid parameters",
        { name: ["This organization already exists"] }
      )
    });
    const organization = form.cleanedData as IOrganization;
    organization.owner = user._id!;
    organization.members = [user._id!]
    const rootFolder = await this.Inventory.insertOne({
      organization: organization._id!,
      directoryType: EDirectoryType.folder,
      createDate: new Date(),
    });
    organization.rootFolder = rootFolder.insertedId;
    await this.Organization.insertOne(organization);
    return jsonResponse({ 
      status: 201,
      data: await this.OrganizationView.findOne({ id: organization._id })
    });
  }

  @Delete("/:id", [useParamsForm(ObjectIDForm)])
  async deleteOrganization(request: Request, form: ObjectIDForm): Promise<Responder> { 
    const user = await this.authService.getUser(request) as IUser;
    const { id } = form.cleanedData;
    const organization = await this.Organization.findOne({ _id: id }) as IOrganization;
    if(!organization) return jsonResponse({
      status: 404,
      error: new JsonResponseError("Organization not found")
    });
    const owner = await this.authService.getOwnerFromOrganization(id);
    console.log(user._id, owner);
    if(!user._id!.equals(owner!)) return jsonResponse({
      status: 403,
      error: new JsonResponseError("You are not authorized to carry out this operation.")
    });
    await this.Organization.updateOne(
      { _id: organization._id}, 
      { $set: { deleteDate: new Date() } }
    );
    return jsonResponse({ status: 200 });
  }

  @Get("/:id", [useParamsForm(ObjectIDForm)])
  async getOrganization(request: Request, form: ObjectIDForm): Promise<Responder> {
    const organization = await this.OrganizationView.findOne(form.cleanedData) as IOrganizationView;
    if(!organization) return jsonResponse({
      status: 404,
      error: new JsonResponseError("Organization not found")
    });
    const isMember = await this.authService.isMember(organization.id!, request);
    if(!isMember) return jsonResponse({
      status: 403,
      error: new JsonResponseError("You are not authorized to carry out this operation.")
    });
    ;
    return jsonResponse({
      status: 200,
      data: organization
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
    const user = await this.authService.getUser(request) as IUser;
    const organization = await this.Organization.findOne(idForm.cleanedData) as IOrganization;
    if(!organization) return jsonResponse({
      status: 404,
      error: new JsonResponseError("Organization not found")
    });
    const owner = await this.authService.getOwnerFromOrganization(organization._id!);
    if(user._id != owner) return jsonResponse({
      status: 403,
      error: new JsonResponseError("You are not authorized to carry out this operation.")
    });
    const { newMembers } = membersForm.cleanedData;
    const set = new Set(organization.members);
    for(let newMember of newMembers as INewMember[]) {
      let memberUser = await this.User.findOne({ email: newMember.email }) as IUser;
      if(!memberUser) {
        const password = CodeGenerator.generateCode(8);
        await this.authService.setPassword(
          newMember as IUser, 
          password
        );
        await this.User.insertOne(newMember as IUser);
        memberUser = newMember as IUser;
        this.mailService.sendMail(
          EEmailTemplate.newUserMemberWelcomeNote,
          { password, ...newMember }, 
          newMember.email
        ).catch(console.error);
      }
      if(set.has(memberUser._id!)) continue;
      set.add(memberUser._id!);
      this.mailService.sendMail(
        EEmailTemplate.memberWelcomeNote,
        { organizationName: organization.name, firstName: memberUser.firstName },
        memberUser.email
      ).catch(console.error);
    }
    organization.members = [];
    for(let id of set) organization.members.push(id);
    await this.Organization.updateOne({ _id: organization._id }, organization);
    return jsonResponse({ 
      status: 200,
      data: await this.OrganizationView.findOne({ id: organization._id })
    });
  }

  @Put("/:id/remove", [useParamsForm(ObjectIDForm), useForm(OrganizationMembersForm)])
  async removeMembers(request: Request, idForm: ObjectIDForm, membersForm: OrganizationMembersForm) {
    const user = await this.authService.getUser(request) as IUser;
    const organization = await this.Organization.findOne({ _id: idForm.cleanedData.id }) as IOrganization;
    if(!organization) return jsonResponse({
      status: 404,
      error: new JsonResponseError("Organization not found")
    });
    const owner = await this.authService.getOwnerFromOrganization(organization._id!);
    if(user._id != owner) return jsonResponse({
      status: 403,
      error: new JsonResponseError("You are not authorized to carry out this operation.")
    });
    const { members } = membersForm.cleanedData;
    const removeSet = new Set(members as ObjectId[]);
    const currentSet = new Set(organization.members);
    organization.members = [];
    for(let id of removeSet) {
      if(id == owner) return jsonResponse({
        status: 400,
        error: new JsonResponseError(
          "Invalid parameters",
          { members: ["the owner of an organization cannot be deleted"] }
        )
      });
      currentSet.delete(id);
    }
    for(let id of currentSet) organization.members.push(id);
    await this.Organization.updateOne({ _id: organization._id }, organization);
    return jsonResponse({ 
      status: 200,
      data: await this.OrganizationView.findOne({ id: organization._id })
    });
  }
}