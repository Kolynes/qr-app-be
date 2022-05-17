import { Request } from "express";
import { Collection } from "mongodb";
import { IAuthService } from "../../auth/types";
import { ObjectIDForm } from "../../common/forms";
import { collection, view } from "../../database";
import { IDirectoryLike } from "../../inventory/types";
import { ECollections, EServices, EViews } from "../../types";
import { Controller, Delete, Get } from "../../utils/controller";
import { useParamsForm } from "../../utils/form";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { IBatch, IBatchView } from "../types";

@Controller()
export default class BatchesController {
  @service(EServices.auth)
  private authService!: IAuthService;

  @view(EViews.batch)
  private BatchView!: Collection<IBatchView>;

  @collection(ECollections.inventory)
  private Inventory!: Collection<IDirectoryLike>;

  @collection(ECollections.batch)
  private Batch!: Collection<IBatch>;

  @Get("/:id", [useParamsForm(ObjectIDForm)])
  async getBatch(request: Request, form: ObjectIDForm): Promise<Responder> {
    const { id } = form.cleanedData;
    const batch = await this.BatchView.findOne({ id });
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
      data: batch
    })
  }

  @Delete("/:id", [useParamsForm(ObjectIDForm)])
  async deleteBatch(request: Request, form: ObjectIDForm): Promise<Responder> {
    const { id } = form.cleanedData;
    const batch = await this.BatchView.findOne({ id });
    if (!batch) return jsonResponse({
      status: 404,
      error: new JsonResponseError("batch not found")
    });
    const isMember = await this.authService.isMember(batch.organization, request);
    if (!isMember) return jsonResponse({
      status: 403,
      error: new JsonResponseError("You are not authorized to carry out this action")
    })
    await this.Inventory.updateMany(
      { batch: batch.id }, 
      { $set: { deleteDate: new Date() } }
    );
    await this.Batch.updateOne(
      { _id: batch.id }, 
      { $set: { deleteDate: new Date() } }
    );
    return jsonResponse({ status: 200 })
  }
}