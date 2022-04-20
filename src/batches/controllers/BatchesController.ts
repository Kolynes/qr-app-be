import { Request } from "express";
import { Collection } from "mongodb";
import { IAuthService } from "../../auth/types";
import { ObjectIDForm } from "../../common/forms";
import { collection, view } from "../../database";
import { IDBService } from "../../database/types";
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

  @service(EServices.database)
  private dbService!: IDBService;

  @view(EViews.batch)
  private BatchView!: Collection<IBatchView>;

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
    const batch = await this.Batch.findOne({ _id: id }) as IBatch;
    if (!batch) return jsonResponse({
      status: 404,
      error: new JsonResponseError("batch not found")
    });
    const isMember = await this.authService.isMember(batch.organization, request);
    if (!isMember) return jsonResponse({
      status: 403,
      error: new JsonResponseError("You are not authorized to carry out this action")
    })
    await this.dbService.collections.inventory.updateMany(
      { _id: { $in: batch.items.map(item => item.id) }}, 
      { deleteDate: new Date().toISOString() }
    );
    await this.Batch.updateOne(
      { _id: batch._id }, 
      { $set: { deleteDate: new Date().toISOString() } }
    );
    return jsonResponse({ status: 200 })
  }
}