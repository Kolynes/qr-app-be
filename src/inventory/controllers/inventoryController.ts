import { Request } from "express";
import { ObjectId } from "mongodb";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { IAuthService } from "../../auth/types";
import { IBatch } from "../../batches/types";
import { ObjectIDForm } from "../../common/forms";
import { IDBService } from "../../database/types";
import { EServices } from "../../types";
import { Controller, Delete, Get, Patch, Post, Put } from "../../utils/controller";
import { useForm, useParamsForm } from "../../utils/form";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { FolderCreateForm, FolderUpdateForm, ItemCreateForm, ItemUpdateForm } from "../forms";
import { EDirectoryType, IDirectoryLike, IDirectoryLikeView, IQRService } from "../types";

@Controller([AuthMiddleware])
export default class InventoryController {
  @service(EServices.qrcode)
  private qrCodeService!: IQRService;

  @service(EServices.auth)
  private authService!: IAuthService;

  @service(EServices.database)
  private dbService!: IDBService;

  async getValidDirectoryOrErrorResponse(id: ObjectId, request: Request): Promise<IDirectoryLikeView | Responder> {
    const directory = await this.dbService.views.inventory.findOne({ _id: id }) as IDirectoryLikeView;
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

  @Post("/items", [useForm(ItemCreateForm)])
  async createItems(request: Request, form: ItemCreateForm): Promise<Responder> {
    const { numberOfItems, folder, organization } = form.cleanedData;
    const batch = { organization } as IBatch;
    const items = [];
    for (let i = 0; i < numberOfItems; i++) items.push({
      folder,
      directoryType: EDirectoryType.item,
      batch: batch._id,
      organization
    } as IDirectoryLike);
    const inventoryInsertResult = await this.dbService.collections.inventory.insertMany(items);
    let insertedItems = [];
    for (let i in inventoryInsertResult.insertedIds) {
      insertedItems.push({ id: inventoryInsertResult.insertedIds[i] });
      items[i]._id = inventoryInsertResult.insertedIds[i];
    }
    batch.items = insertedItems;
    const batchInsertResult = await this.dbService.collections.batch.insertOne(batch);
    batch._id = batchInsertResult.insertedId;
    return jsonResponse({
      status: 201,
      data: {
        batch: batch._id,
        items: await Promise.all(items.map(async item => ({
          qrCode: await this.qrCodeService.createQRCode(item._id!, organization),
          ...item
        })))
      }
    });
  }

  @Post("/folders", [useForm(FolderCreateForm)])
  async createFolder(request: Request, form: FolderCreateForm): Promise<Responder> {
    const { name, folder, organization, color } = form.cleanedData;
    const newFolder = {
      name,
      folder,
      organization,
      color,
      directoryType: EDirectoryType.folder
    } as IDirectoryLike;
    const result = await this.dbService.collections.inventory.insertOne(newFolder);
    newFolder._id = result.insertedId;
    return jsonResponse({
      status: 201,
      data: {
        qrCode: await this.qrCodeService.createQRCode(newFolder._id!, organization),
        ...newFolder
      }
    });
  }

  @Get("/:id", [useParamsForm(ObjectIDForm)])
  async getDirectory(request: Request, form: ObjectIDForm): Promise<Responder> {
    const { id } = form.cleanedData;
    const result = await this.getValidDirectoryOrErrorResponse(id, request);
    if (result instanceof Function) return result;
    else return jsonResponse({
      status: 200,
      data: await this.dbService.views.inventory.findOne(result)
    });
  }

  @Get("/root/:id", [useParamsForm(ObjectIDForm)])
  async getRootDirectory(request: Request, form: ObjectIDForm): Promise<Responder> {
    const { id } = form.cleanedData;
    const isMember = await this.authService.isMember(id, request);
    if (!isMember) return jsonResponse({
      status: 403,
      error: new JsonResponseError("You are not authorized to carry out this action")
    });
    return jsonResponse({
      status: 200,
      data: await this.dbService.views.inventory.find({
        organization: id,
        deleteDate: undefined
      }).toArray() as IDirectoryLikeView[]
    });
  }

  @Delete("/:id", [useParamsForm(ObjectIDForm)])
  async deleteDirectory(request: Request, form: ObjectIDForm): Promise<Responder> {
    const { id } = form.cleanedData;
    const result = await this.getValidDirectoryOrErrorResponse(id, request);
    if (result instanceof Function) return result;
    await this.dbService.collections.inventory.updateOne(
      { _id: result._id }, 
      { deleteDate: new Date().toISOString()}
    );
    return jsonResponse({ status: 200 });
  }

  @Patch("/folders/:id", [useParamsForm(ObjectIDForm), useForm(FolderUpdateForm)])
  async updateFolder(request: Request, idForm: ObjectIDForm, folderUpdateForm: FolderUpdateForm): Promise<Responder> {
    const { id } = idForm.cleanedData;
    const result = await this.getValidDirectoryOrErrorResponse(id, request);
    if (result instanceof Function) return result;
    if(result.directoryType != EDirectoryType.item) return jsonResponse({
      status: 400,
      error: new JsonResponseError("This is not a folder")
    })
    await this.dbService.collections.inventory.updateOne({ _id: result._id }, folderUpdateForm.cleanedData);
    return jsonResponse({
      status: 200,
      data: {
        ...result,
        ...folderUpdateForm.cleanedData
      }
    });
  }

  @Patch("/items/:id", [useParamsForm(ObjectIDForm), useForm(ItemUpdateForm)])
  async updateItem(request: Request, idForm: ObjectIDForm, itemUpdateForm: ItemUpdateForm): Promise<Responder> {
    const { id } = idForm.cleanedData;
    const result = await this.getValidDirectoryOrErrorResponse(id, request);
    if (result instanceof Function) return result;
    if(result.directoryType != EDirectoryType.item) return jsonResponse({
      status: 400,
      error: new JsonResponseError("This is not an item")
    })
    await this.dbService.collections.inventory.updateOne(
      { _id: result._id }, 
      { 
        item: {
          ...result.item,
          ...itemUpdateForm.cleanedData
        } 
      }
    );
    return jsonResponse({
      status: 200,
      data: await this.dbService.views.inventory.findOne({ _id: result._id })
    });
  }


  // @Put("/folders/:id/add", [useParamsForm(ObjectIDForm), useForm(FolderItemsForm)])
  // async addToDirectory(request: Request, idForm: ObjectIDForm, folderItemsForm: FolderItemsForm): Promise<Responder> {
  //   const { id } = idForm.cleanedData;
  //   const { items } = folderItemsForm.cleanedData;
  //   const folder = await IDirectoryLike.findOne({
  //     where: { _id: id, directoryType: EDirectoryType.folder }
  //   });
  //   if (!folder) return jsonResponse({
  //     status: 404,
  //     error: new JsonResponseError("Folder not found")
  //   });
  //   for (let _id of items) {
  //     let item = await IDirectoryLike.findOne({
  //       where: { _id }
  //     });
  //     if (!item) return jsonResponse({
  //       status: 404,
  //       error: new JsonResponseError("Item not found", { item: _id })
  //     });
  //     else if (item.parent !== folder.id.toString()) {
  //       item.parent = folder.id.toString();
  //       item.save();
  //     }
  //   }
  //   return jsonResponse({ status: 200 });
  // }

  // @Put("/folders/:id/remove", [useParamsForm(ObjectIDForm), useForm(FolderCreateForm)])
  // async removeFromDirectory(request: Request, idForm: ObjectIDForm, folderForm: FolderCreateForm): Promise<Responder> {
  //   const { id } = idForm.cleanedData;
  //   const { items } = folderForm.cleanedData;
  //   const folder = await IDirectoryLike.findOne({
  //     where: { _id: id }
  //   });
  //   if (!folder) return jsonResponse({
  //     status: 404,
  //     error: new JsonResponseError("Folder not found")
  //   });
  //   for (let _id of items) {
  //     let item = await IDirectoryLike.findOne({
  //       where: { _id }
  //     });
  //     if (!item) return jsonResponse({
  //       status: 404,
  //       error: new JsonResponseError("Item not found", { item: _id })
  //     });
  //     else if (item.parent == folder.id.toString()) {
  //       item.parent = undefined;
  //       item.save();
  //     }
  //   }
  //   return jsonResponse({ status: 200 });
  // }
}