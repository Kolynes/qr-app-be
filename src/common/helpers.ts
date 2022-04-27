import { Request } from "express";
import { Collection, ObjectId } from "mongodb";
import { IAuthService } from "../auth/types";
import { view } from "../database";
import { IDirectoryLikeView } from "../inventory/types";
import { IOrganizationView } from "../organizations/types";
import { EServices, EViews } from "../types";
import { jsonResponse, JsonResponseError, Responder } from "../utils/responses";
import { service } from "../utils/services/ServiceProvider";

export default class Helpers {

  @service(EServices.auth)
  private authService!: IAuthService;

  @view(EViews.organization)
  private OrganizationView!: Collection<IOrganizationView>;

  @view(EViews.inventory)
  private InventoryView!: Collection<IDirectoryLikeView>;
  
  async getValidDirectoryOrErrorResponse(id: ObjectId, request: Request): Promise<IDirectoryLikeView | Responder> {
    const directory = await this.InventoryView.findOne({ id: id }) as IDirectoryLikeView;
    if (!directory) return jsonResponse({
      status: 404,
      error: new JsonResponseError("Directory not found")
    });
    const isMember = await this.authService.isMember(directory.organization, request);
    if (!isMember) return jsonResponse({
      status: 403,
      error: new JsonResponseError("You are not authorized to carry out this action")
    });
    return directory;
  }
  
  async getValidOrganizationOrResponse(id: ObjectId, request: Request): Promise<IOrganizationView | Responder> {
    const organization = await this.OrganizationView.findOne({ id });
    if (!organization) return jsonResponse({
      status: 404,
      error: new JsonResponseError("Organization not found")
    });
    const user = await this.authService.getUser(request);
    if (!user || !user._id!.equals(organization.owner)) return jsonResponse({
      status: 403,
      error: new JsonResponseError("You are not authorized to carry out this action")
    });
    return organization;
  }
}