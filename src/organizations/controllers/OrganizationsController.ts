import { Request } from "express";
import { UserEntity } from "../../auth/entities/UserEntity";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { IAuthService } from "../../auth/types";
import { ObjectIDForm } from "../../common/forms";
import { EEmailTemplate, IMailService } from "../../mail/types";
import { EServices } from "../../types";
import CodeGenerator from "../../utils/code-generator";
import { Controller, Delete, Get, Post, Put } from "../../utils/controller";
import { useForm, useParamsForm } from "../../utils/form";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import OrganizationDto from "../dtos/OrganizationDto";
import { OrganizationEntity } from "../entities/OrganizationEntity";
import { OrganizationAddMembersForm, OrganizationCreateForm, OrganizationMembersForm } from "../forms";
import { INewMember } from "../types";

@Controller([AuthMiddleware])
export default class OrganizationController {
  @service(EServices.auth)
  private authService!: IAuthService;

  @service(EServices.mail)
  private mailService!: IMailService;

  @Post("", [useForm(OrganizationCreateForm)])
  async createOrganization(request: Request, form: OrganizationCreateForm): Promise<Responder> {
    const user = (await this.authService.getUser(request))!;
    const { name } = form.cleanedData;
    const result = await OrganizationEntity.count({
      owner: user.id.toString(), 
      name 
    });
    if(result > 0) return jsonResponse({
      status: 400,
      error: new JsonResponseError(
        "Invalid parameters",
        { name: ["This organization already exists"] }
      )
    });
    const organization = OrganizationEntity.create(form.cleanedData);
    organization.owner = user.id.toString();
    organization.members = [{ id: user.id.toString() }]
    await organization.save();
    return jsonResponse({ 
      status: 201,
      data: await OrganizationDto.create(organization)
    });
  }

  @Delete("/:id", [useParamsForm(ObjectIDForm)])
  async deleteOrganization(request: Request, form: ObjectIDForm): Promise<Responder> { 
    const user = (await this.authService.getUser(request))!;
    const { id } = form.cleanedData;
    const organization = await OrganizationEntity.findOne(id) as OrganizationEntity;
    if(!organization) return jsonResponse({
      status: 404,
      error: new JsonResponseError("Organization not found")
    });
    const owner = await this.authService.getOwnerFromOrganization(id);
    if(user.id.toString() != owner) return jsonResponse({
      status: 403,
      error: new JsonResponseError("You are not authorized to carry out this operation.")
    });
    await organization.softRemove();
    return jsonResponse({ status: 200 });
  }

  @Get("/:id", [useParamsForm(ObjectIDForm)])
  async getOrganization(request: Request, form: ObjectIDForm): Promise<Responder> {
    const organization = await OrganizationEntity.findOne(form.cleanedData.id) as OrganizationEntity;
    if(!organization) return jsonResponse({
      status: 404,
      error: new JsonResponseError("Organization not found")
    });
    const isMember = await this.authService.isMember(organization.id.toString(), request);
    if(!isMember) return jsonResponse({
      status: 403,
      error: new JsonResponseError("You are not authorized to carry out this operation.")
    });
    return jsonResponse({
      status: 200,
      data: await OrganizationDto.create(organization)
    });
  }

  @Get()
  async getOrganizations(request: Request): Promise<Responder> {
    const user = (await this.authService.getUser(request))!;
    const organizations = await OrganizationEntity.find({
      where: {
        members: { id: user.id.toString() }
      },
      withDeleted: false
    });
    return jsonResponse({
      status: 200,
      data: await Promise.all(
        organizations.map(
          async organization => await OrganizationDto.create(organization)
        )
      )
    });
  }

  @Put("/:id/add", [useParamsForm(ObjectIDForm), useForm(OrganizationAddMembersForm)])
  async addMembers(request: Request, idForm: ObjectIDForm, membersForm: OrganizationAddMembersForm): Promise<Responder> {
    const user = (await this.authService.getUser(request))!;
    const organization = await OrganizationEntity.findOne(idForm.cleanedData.id) as OrganizationEntity;
    if(!organization) return jsonResponse({
      status: 404,
      error: new JsonResponseError("Organization not found")
    });
    const owner = await this.authService.getOwnerFromOrganization(organization.id.toString());
    if(user.id.toString() != owner) return jsonResponse({
      status: 403,
      error: new JsonResponseError("You are not authorized to carry out this operation.")
    });
    const { newMembers } = membersForm.cleanedData;
    const set = new Set(organization.members.map(member => member.id));
    for(let newMember of newMembers as INewMember[]) {
      let memberUserEntity = await UserEntity.findOne({ email: newMember.email });
      if(!memberUserEntity) {
        memberUserEntity = UserEntity.create(newMember);
        const password = CodeGenerator.generateCode(8);
        await memberUserEntity.setPassword(password);
        await memberUserEntity.save();
        this.mailService.sendMail(
          EEmailTemplate.newUserMemberWelcomeNote,
          { password, ...newMember }, 
          newMember.email
        ).catch(console.error);
      }
      if(set.has(memberUserEntity.id.toString())) continue;
      set.add(memberUserEntity.id.toString());
      this.mailService.sendMail(
        EEmailTemplate.memberWelcomeNote,
        { organizationName: organization.name, firstName: memberUserEntity.firstName },
        memberUserEntity.email
      ).catch(console.error);
    }
    organization.members = [];
    for(let id of set) organization.members.push({ id });
    await organization.save();
    return jsonResponse({ 
      status: 200,
      data: await OrganizationDto.create(organization)
    });
  }

  @Put("/:id/remove", [useParamsForm(ObjectIDForm), useForm(OrganizationMembersForm)])
  async removeMembers(request: Request, idForm: ObjectIDForm, membersForm: OrganizationMembersForm) {
    const user = (await this.authService.getUser(request))!;
    const organization = await OrganizationEntity.findOne(idForm.cleanedData.id) as OrganizationEntity;
    if(!organization) return jsonResponse({
      status: 404,
      error: new JsonResponseError("Organization not found")
    });
    const owner = await this.authService.getOwnerFromOrganization(organization.id.toString());
    if(user.id.toString() != owner) return jsonResponse({
      status: 403,
      error: new JsonResponseError("You are not authorized to carry out this operation.")
    });
    const { members } = membersForm.cleanedData;
    const removeSet = new Set(members as string[]);
    const currentSet = new Set(organization.members.map(member => member.id));
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
    for(let id of currentSet) organization.members.push({ id });
    await organization.save();
    return jsonResponse({ 
      status: 200,
      data: await OrganizationDto.create(organization)
    });
  }
}