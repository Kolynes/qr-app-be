import { Request } from "express";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { IAuthService } from "../../auth/types";
import { BatchEntity } from "../../batches/entities/BatchEntity";
import { ObjectIDForm } from "../../common/forms";
import { EServices } from "../../types";
import { Controller, Get, Post } from "../../utils/controller";
import { useForm, useParamsForm } from "../../utils/form";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import DirectoryLikeDto from "../dtos/DirectoryLikeDto";
import { DirectoryLikeEntity } from "../entities/DirectoryLikeEntity";
import { FolderCreateForm, ItemCreateForm } from "../forms";
import { EDirectoryType, IQRService } from "../types";

@Controller([AuthMiddleware])
export default class InventoryController {
  @service(EServices.qrcode)
  private qrCodeService!: IQRService;

  @service(EServices.auth)
  private authService!: IAuthService;
  
  @Post("/items", [useForm(ItemCreateForm)])
  async createItems(request: Request, form: ItemCreateForm): Promise<Responder> {
    const { numberOfItems, folder, organization } = form.cleanedData;
    const batch = await BatchEntity.create({ organization }).save();
    const items = [];
    for(let i = 0; i < numberOfItems; i++) {
      let item = DirectoryLikeEntity.create({ 
        folder, 
        directoryType: EDirectoryType.item, 
        batch: batch.id.toString(), 
        organization 
      });
      await item.save();
      items.push(item);
      if(!batch.items) batch.items = [];
      batch.items.push({ id: item.id.toString() });
    }
    await batch.save();
    return jsonResponse({
      status: 201,
      data: {
        batch: batch.id.toString(),
        items: await Promise.all(items.map(async item => ({
          qrCode: await this.qrCodeService.createQRCode(item.id.toString(), organization),
          ...item
        })))
      }
    });
  }

  @Post("/folders", [useForm(FolderCreateForm)])
  async createFolder(request: Request, form: FolderCreateForm): Promise<Responder> {
    const { name, folder, organization, color } = form.cleanedData;
    const newFolder = await DirectoryLikeEntity.create({ 
      name, 
      folder, 
      organization, 
      color
    }).save();
    return jsonResponse({
      status: 201, 
      data: {
        qrCode: await this.qrCodeService.createQRCode(newFolder.id.toString(), organization),
        ...newFolder
      }
    });
  }

  @Get("/:id", [useParamsForm(ObjectIDForm)])
  async getDirectory(request: Request, form: ObjectIDForm): Promise<Responder> {
    const { id } = form.cleanedData;
    const directory = await DirectoryLikeEntity.findOne(id) as DirectoryLikeEntity;
    if(!directory) return jsonResponse({
      status: 404,
      error: new JsonResponseError("Directory not found")
    });
    const isMember = await this.authService.isMember(directory.organization, request);
    if(isMember) return jsonResponse({
      status: 403,
      error: new JsonResponseError("You are not authorized to carry out this action")
    });

    return jsonResponse({
      status: 200,
      data: await DirectoryLikeDto.create(directory)
    });
  }

  // @Put("/:id/add", [useParamsForm(ObjectIDForm), useForm(FolderItemsForm)])
  // async addToDirectory(request: Request, idForm: ObjectIDForm, folderItemsForm: FolderItemsForm): Promise<Responder> {
  //   const { id } = idForm.cleanedData;
  //   const { items } = folderItemsForm.cleanedData;
  //   const folder = await DirectoryLikeEntity.findOne({
  //     where: { _id: id, directoryType: EDirectoryType.folder }
  //   });
  //   if (!folder) return jsonResponse({
  //     status: 404,
  //     error: new JsonResponseError("Folder not found")
  //   });
  //   for (let _id of items) {
  //     let item = await DirectoryLikeEntity.findOne({
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

  // @Put("/:id/remove", [useParamsForm(ObjectIDForm), useForm(FolderCreateForm)])
  // async removeFromDirectory(request: Request, idForm: ObjectIDForm, folderForm: FolderCreateForm): Promise<Responder> {
  //   const { id } = idForm.cleanedData;
  //   const { items } = folderForm.cleanedData;
  //   const folder = await DirectoryLikeEntity.findOne({
  //     where: { _id: id }
  //   });
  //   if (!folder) return jsonResponse({
  //     status: 404,
  //     error: new JsonResponseError("Folder not found")
  //   });
  //   for (let _id of items) {
  //     let item = await DirectoryLikeEntity.findOne({
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