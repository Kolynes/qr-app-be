import { Request } from "express";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { ObjectIDForm } from "../../common/forms";
import { EServices } from "../../types";
import { Controller, Post, Put } from "../../utils/controller";
import { useForm, useParamsForm } from "../../utils/form";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { DirectoryLikeEntity } from "../entities/DirectoryLikeEntity";
import { ItemEntity } from "../entities/ItemEntity";
import { FolderItemsForm, FolderForm, ItemForm } from "../forms";
import { EDirectoryType, IQRService } from "../types";

@Controller([AuthMiddleware])
export default class InventoryController {
  @service(EServices.qrcode)
  private qrCodeService!: IQRService;
  
  @Post("", [useForm(ItemForm)])
  async createItems(request: Request, form: ItemForm): Promise<Responder> {
    const { numberOfItems, type, totalWeight, organization } = form.cleanedData;
    const qrCodes = [] as string[];

    for(let i = 0; i < numberOfItems; i++) {
      const item = ItemEntity.create({ organization, type, totalWeight });
      await item.save();
      qrCodes.push(
        await this.qrCodeService.createQRCode(
          item.id.toString(), 
          item.organization, 
          type
        )
      );
    }
    
    return jsonResponse({
      status: 201,
      data: qrCodes
    });
  }

  @Post("", [useForm(FolderForm)])
  async createFolder(request: Request, form: FolderForm): Promise<Responder> {
    const { name, parent, organization } = form.cleanedData;
    const folder = DirectoryLikeEntity.create({ name, parent, organization });
    await folder.save();
    return jsonResponse({
      status: 201, 
      data: folder
    });
  }

  @Put("/:id/add", [useParamsForm(ObjectIDForm), useForm(FolderItemsForm)])
  async addToDirectory(request: Request, idForm: ObjectIDForm, folderItemsForm: FolderItemsForm): Promise<Responder> {
    const { id } = idForm.cleanedData;
    const { items } = folderItemsForm.cleanedData;
    const folder = await DirectoryLikeEntity.findOne({
      where: { _id: id, directoryType: EDirectoryType.folder }
    });
    if (!folder) return jsonResponse({
      status: 404,
      error: new JsonResponseError("Folder not found")
    });
    for (let _id of items) {
      let item = await DirectoryLikeEntity.findOne({
        where: { _id }
      });
      if (!item) return jsonResponse({
        status: 404,
        error: new JsonResponseError("Item not found", { item: _id })
      });
      else if (item.parent !== folder.id.toString()) {
        item.parent = folder.id.toString();
        item.save();
      }
    }
    return jsonResponse({ status: 200 });
  }

  @Put("/:id/remove", [useParamsForm(ObjectIDForm), useForm(FolderForm)])
  async removeFromDirectory(request: Request, idForm: ObjectIDForm, folderForm: FolderForm): Promise<Responder> {
    const { id } = idForm.cleanedData;
    const { items } = folderForm.cleanedData;
    const folder = await DirectoryLikeEntity.findOne({
      where: { _id: id }
    });
    if (!folder) return jsonResponse({
      status: 404,
      error: new JsonResponseError("Folder not found")
    });
    for (let _id of items) {
      let item = await DirectoryLikeEntity.findOne({
        where: { _id }
      });
      if (!item) return jsonResponse({
        status: 404,
        error: new JsonResponseError("Item not found", { item: _id })
      });
      else if (item.parent == folder.id.toString()) {
        item.parent = undefined;
        item.save();
      }
    }
    return jsonResponse({ status: 200 });
  }
}