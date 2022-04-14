import { Request } from "express";
import { UserEntity } from "../../auth/entities/UserEntity";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { IAuthService } from "../../auth/types";
import { ObjectIDForm } from "../../common/forms";
import { EServices } from "../../types";
import { Controller, Delete, Get, Post, Put } from "../../utils/controller";
import { useForm, useParamsForm } from "../../utils/form";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import OrganizationDto from "../dtos/OrganizationDto";
import { OrganizationEntity } from "../entities/OrganizationEntity";
import { OrganizationCreateForm, OrganizationMembersForm } from "../forms";

@Controller([AuthMiddleware])
export default class OrganizationController {
  @service(EServices.auth)
  private authService!: IAuthService;

  @Post("", [useForm(OrganizationCreateForm)])
  async createOrganization(request: Request, form: OrganizationCreateForm): Promise<Responder> {
    const user = (await this.authService.getUser(request))!;
    const { name } = form.cleanedData;
    const result = await OrganizationEntity.count({
      where: { 
        owner: user.id.toString(), 
        name 
      }
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
    await organization.save();
    return jsonResponse({ status: 201 });
  }

  @Delete("/:id", [useParamsForm(ObjectIDForm)])
  async deleteOrganization(request: Request, form: ObjectIDForm): Promise<Responder> { 
    const user = (await this.authService.getUser(request))!;
    const { id } = form.cleanedData;
    const organization = await OrganizationEntity.findOne({
      where: {
        _id: id
      }
    });
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
    const { id } = form.cleanedData;
    const organization = await OrganizationEntity.findOne({
      where: { _id: id }
    });
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
      data: OrganizationDto.create(organization)
    });
  }

  // @Put("/:id/add", [useParamsForm(ObjectIDForm), useForm(OrganizationMembersForm)])
  // async addMembers(request: Request, idForm: ObjectIDForm, membersForm: OrganizationMembersForm): Promise<Responder> {

  // }

  // async removeMembers() {

  // }

}