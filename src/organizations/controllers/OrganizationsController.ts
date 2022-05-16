import { Request } from "express";
import { Collection, ObjectId } from "mongodb";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { IAuthService, IUser, IUserView } from "../../auth/types";
import { ObjectIDForm, PageForm } from "../../common/forms";
import Helpers from "../../common/helpers";
import { collection, view } from "../../database";
import { EDirectoryType, IDirectoryLike } from "../../inventory/types";
import { EEmailTemplate, IMailService } from "../../mail/types";
import { ECollections, EServices, EViews } from "../../types";
import CodeGenerator from "../../utils/code-generator";
import { Controller, Delete, Get, Post, Put } from "../../utils/controller";
import { useForm, useParamsForm, useQueryForm } from "../../utils/form";
import { paginate } from "../../utils/pagination";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { OrganizationAddMembersForm, OrganizationCreateForm, OrganizationMembersForm } from "../forms";
import { IMembership, INewMember, IOrganization, IOrganizationView } from "../types";

const helpers = new Helpers();
@Controller([AuthMiddleware])
export default class OrganizationController {

  @service(EServices.mail)
  private mailService!: IMailService;

  @collection(ECollections.organization)
  private Organization!: Collection<IOrganization>;

  @collection(ECollections.membership)
  private Membership!: Collection<IMembership>;

  @collection(ECollections.inventory)
  private Inventory!: Collection<IDirectoryLike>;

  @collection(ECollections.user)
  private User!: Collection<IUser>;

  @service(EServices.auth)
  private authService!: IAuthService;

  @view(EViews.organization)
  private OrganizationView!: Collection<IOrganizationView>;

  @view(EViews.user)
  private UserView!: Collection<IUserView>;

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
    const organization = {
      name,
      owner: user._id,
      createDate: new Date(),
    } as IOrganization;
    await this.Organization.insertOne(organization);
    await this.Membership.insertOne({ 
      createDate: new Date(), 
      organization: organization._id!, 
      user: user._id! 
    });
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

  @Get("", [useQueryForm(PageForm)])
  async getOrganizations(request: Request, form: PageForm): Promise<Responder> {
    const { page, size } = form.cleanedData;
    const user = await this.authService.getUser(request) as IUser;
    const memberships = await this.Membership.find({ user: user._id }).toArray();
    // const rule = {
    //   $lookup: {
    //     from: ECollections.membership,
    //     as: "members",
    //     let: { user: "$user", deleteDate: "$deleteDate" },
    //     pipeline: [
    //       { 
    //         $match: {
    //           $expr: {
    //             $and: [
    //               { $eq: ["$$user", user._id] },
    //               { $eq: ["$$deleteDate", undefined] },
    //             ] 
    //           }
    //         }
    //       },
    //     ]
    //   },
    // };
    const organizations = this.OrganizationView.find({ id: { $in: memberships.map(m => m.organization) } });
    return jsonResponse({
      status: 200,
      ...await paginate<IOrganizationView>(organizations, page || 1, size || 20)
    });
  }

  @Get("/:id/members", [useParamsForm(ObjectIDForm), useQueryForm(PageForm)])
  async getMembers(request: Request, idForm: ObjectIDForm, pageForm: PageForm): Promise<Responder> {
    const { id } = idForm.cleanedData;
    const { page, size } = pageForm.cleanedData;
    const result = await helpers.getValidOrganizationByMembershipOrResponse(id, request);
    if(result instanceof Function) return result;
    const query = {
      $lookup: {
        from: ECollections.membership,
        as: "organizations",
        let: { organization: "$organization", user: "$user", deleteDate: "$deleteDate" },
        pipeline: [
          { 
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$$organization", id] },
                  { $eq: ["$id", "$$user"] },
                  { $eq: ["$$deleteDate", undefined] },
                ] 
              }
            }
          },
        ]
      }
    };
    const members = this.UserView.aggregate([
      query,
      { $unset: "organizations" }
    ])
    const count = async () => {
      const count = await this.UserView.aggregate([
        query,
        { $count: "count" }
      ]).toArray()
      return (count[0] as unknown as { count: number }).count;
    }
    members.count = count;

    return jsonResponse({
      status: 200,
      ...await paginate<IUserView>(members, page || 1, size || 20)
    });
  }

  @Put("/:id/add", [useParamsForm(ObjectIDForm), useForm(OrganizationAddMembersForm)])
  async addMembers(request: Request, idForm: ObjectIDForm, membersForm: OrganizationAddMembersForm): Promise<Responder> {
    const { id } = idForm.cleanedData;
    const result = await helpers.getValidOrganizationByOwnershipOrResponse(id, request);
    if (result instanceof Function) return result;
    const { newMembers } = membersForm.cleanedData;
    const memberIds = [];
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
      memberIds.push(memberUser._id);
      this.mailService.sendMail(
        EEmailTemplate.memberWelcomeNote,
        { organizationName: result.name, firstName: memberUser.firstName },
        memberUser.email
      ).catch(console.error);
    }
    await this.Membership.insertMany(
      memberIds.map(memberId => ({ user: memberId!, organization: id, createDate: new Date }))
    );
    return jsonResponse({ status: 200 });
  }

  @Put("/:id/remove", [useParamsForm(ObjectIDForm), useForm(OrganizationMembersForm)])
  async removeMembers(request: Request, idForm: ObjectIDForm, membersForm: OrganizationMembersForm) {
    const user = await this.authService.getUser(request) as IUser;
    const { id } = idForm.cleanedData;
    const result = await helpers.getValidOrganizationByOwnershipOrResponse(id, request);
    if (result instanceof Function) return result;
    const { members } = membersForm.cleanedData;
    for (let id of members) {
      if (id == user._id) return jsonResponse({
        status: 400,
        error: new JsonResponseError(
          "Invalid parameters",
          { members: ["the owner of an organization cannot be deleted"] }
        )
      });
    }
    await this.Membership.updateOne(
      { user: { $in: members }, organization: id },
      { $set: { deleteDate: new Date() } }
    );
    return jsonResponse({ status: 200 });
  }
}