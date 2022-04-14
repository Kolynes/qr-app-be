import { Request } from "express";
import { IAuthService } from "../../auth/types";
import { ObjectIDForm } from "../../common/forms";
import { EServices } from "../../types";
import { Controller, Delete, Get } from "../../utils/controller";
import { useParamsForm } from "../../utils/form";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { BatchEntity } from "../entities/BatchEntity";

@Controller()
export default class BatchesController {
  @service(EServices.auth)
  private authService!: IAuthService;

  @Get("/:id", [useParamsForm(ObjectIDForm)])
  async getBatch(request: Request, form: ObjectIDForm): Promise<Responder> {
    const { id } = form.cleanedData;
    const batch = (await BatchEntity.findOne(id)) as BatchEntity;
    if (!batch) return jsonResponse({
      status: 404,
      error: new JsonResponseError("batch not found")
    });
    const isMember = await this.authService.isMember(batch.organization, request);
    if (!isMember) return jsonResponse({
      status: 403,
      error: new JsonResponseError("You are not authorized to carry out this action")
    })
    return jsonResponse({
      status: 200,
      data: await batch.toDto()
    })
  }

  @Delete("/:id", [useParamsForm(ObjectIDForm)])
  async deleteBatch(request: Request, form: ObjectIDForm): Promise<Responder> {
    const { id } = form.cleanedData;
    const batch = (await BatchEntity.findOne(id)) as BatchEntity;
    if (!batch) return jsonResponse({
      status: 404,
      error: new JsonResponseError("batch not found")
    });
    const isMember = await this.authService.isMember(batch.organization, request);
    if (!isMember) return jsonResponse({
      status: 403,
      error: new JsonResponseError("You are not authorized to carry out this action")
    })
    await batch.softRemove();
    return jsonResponse({ status: 200 })
  }
}