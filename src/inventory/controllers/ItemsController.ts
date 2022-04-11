import { Request } from "express";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { IAuthService } from "../../auth/types";
import { ObjectIDForm } from "../../common/forms";
import { EServices } from "../../types";
import { Controller, Delete, Get, Patch } from "../../utils/controller";
import { useForm, useParamsForm } from "../../utils/form";
import { paginate } from "../../utils/pagination";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { ItemEntity } from "../entities/ItemEntity";
import { ItemUpdateForm } from "../forms";
import { IQRService } from "../types";

@Controller([AuthMiddleware])
export default class ItemsController {
  @service(EServices.auth)
  private authService!: IAuthService;

  @service(EServices.qrcode)
  private qrCodeService!: IQRService;

  @Get()
  async getItems(request: Request): Promise<Responder> {
    const owner = await this.authService.getOwnerId(request);
    const query = request.query.query;
    const page = Math.abs(parseInt(request.query.page as string)) || 1;
    const size = parseInt(request.query.size as string) || 100;
    const items = await ItemEntity.find({
      where: {
        $and: [
          { geneticName: query && new RegExp(query as string) || undefined },
          { owner },
          { deleteDate: undefined },
        ],
      }
    })

    const [data, numberOfPages, nextPage, previousPage] = paginate(items, page, size);
    for(let d of data) d.qrCode = await this.qrCodeService.createQRCode(d.id, d.owner, d.type);
    return jsonResponse({
      status: 200,
      data,
      numberOfPages,
      nextPage,
      previousPage
    });
  }

  @Get("/:id", [useParamsForm(ObjectIDForm)])
  async getItem(request: Request, form: ObjectIDForm): Promise<Responder> {
    const { id } = form.cleanedData;
    const owner = await this.authService.getOwnerId(request);
    const item = await ItemEntity.findOne({
      where: {
        $and: [
          { _id: id },
          { owner },
          { deleteDate: undefined },
        ]
      }
    });
    if(!item) return jsonResponse({
      status: 404, 
      error: new JsonResponseError("Item not found")
    });
    var qrCode = await this.qrCodeService.createQRCode(id, owner!, item.type)
    return jsonResponse({
      status: 200,
      data: { item, qrCode }
    });
  }

  @Delete("/:id", [useParamsForm(ObjectIDForm)])
  async deleteItem(request: Request, form: ObjectIDForm): Promise<Responder> {
    const { id } = form.cleanedData;
    const owner = await this.authService.getOwnerId(request);
    const item = await ItemEntity.findOne({
      where: {
        $and: [
          { _id: id },
          { owner },
          { deleteDate: undefined },
        ]
      }
    });
    if(!item) return jsonResponse({
      status: 404,
      error: new JsonResponseError("Item not found.")
    });
    await item.softRemove();
    return jsonResponse({ status: 200 });
  }

  @Patch("/:id", [useParamsForm(ObjectIDForm), useForm(ItemUpdateForm)])
  async updateItem(request: Request, idForm: ObjectIDForm, itemUpdateForm: ItemUpdateForm): Promise<Responder> {
    const owner = await this.authService.getOwnerId(request);
    const { id } = idForm.cleanedData;
    const item = await ItemEntity.findOne({
      where: {
        $and: [
          { _id: id },
          { owner },
          { deleteDate: undefined },
        ]
      }
    });
    if(!item) return jsonResponse({
      status: 404,
      error: new JsonResponseError("item not found.")
    });
    Object.assign(item, itemUpdateForm.cleanedData);
    await item.save();
    return jsonResponse({
      status: 200,
      data: item
    });
  }

}