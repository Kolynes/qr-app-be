import { Request } from "express";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { IAuthService } from "../../auth/types";
import { ObjectIDForm } from "../../common/forms";
import { EServices } from "../../types";
import { Controller, Delete, Get, Post, Put } from "../../utils/controller";
import { useForm, useParamsForm } from "../../utils/form";
import { paginate } from "../../utils/pagination";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { FolderEntity } from "../entities/FolderEntity";
import { ItemEntity } from "../entities/ItemEntity";
import { FolderItemsForm, FolderForm } from "../forms";

@Controller([AuthMiddleware])
export default class FoldersController {
  @service(EServices.auth)
  private authService!: IAuthService;

  @Post("", [useForm(FolderForm)])
  async createFolder(request: Request, form: FolderForm): Promise<Responder> {
    const owner = await this.authService.getOwnerId(request);
    const { name } = form.cleanedData;
    const folder = FolderEntity.create({ name, owner });
    await folder.save();
    return jsonResponse({
      status: 201, 
      data: await folder.toDto()
    });
  }

  @Get()
  async getFolders(request: Request): Promise<Responder> {
    const owner = await this.authService.getOwnerId(request);
    const query = request.query.query;
    const page = Math.abs(parseInt(request.query.page as string)) || 1;
    const size = parseInt(request.query.size as string) || 100;
    const folders = await FolderEntity.find({
      where: {
        $and: [
          { name: new RegExp(query as string || ".*") },
          { owner },
          { deleteDate: undefined },
        ],
      }
    })

    const [data, numberOfPages, nextPage, previousPage] = paginate(folders, page, size);
    return jsonResponse({
      status: 200,
      data,
      numberOfPages,
      nextPage,
      previousPage
    });
  }

  @Get("/:id", [useParamsForm(ObjectIDForm)])
  async getFolder(request: Request, idForm: ObjectIDForm): Promise<Responder> {
    const owner = await this.authService.getOwnerId(request);
    const { id } = idForm.cleanedData;
    const folder = await FolderEntity.findOne({
      where: { _id: id, owner }
    });
    if (!folder) return jsonResponse({
      status: 404,
      error: new JsonResponseError("Folder not found")
    });
    return jsonResponse({
      status: 200,
      data: await folder.toDto()
    });
  }

  @Put("/:id/add", [useParamsForm(ObjectIDForm), useForm(FolderItemsForm)])
  async addItems(request: Request, idForm: ObjectIDForm, folderItemsForm: FolderItemsForm): Promise<Responder> {
    const owner = await this.authService.getOwnerId(request);
    const { id } = idForm.cleanedData;
    const { items } = folderItemsForm.cleanedData;
    const folder = await FolderEntity.findOne({
      where: { _id: id, owner }
    });
    if (!folder) return jsonResponse({
      status: 404,
      error: new JsonResponseError("Folder not found")
    });
    for (let _id of items) {
      let item = await ItemEntity.findOne({
        where: { owner, _id }
      });
      if (!item) return jsonResponse({
        status: 404,
        error: new JsonResponseError("Item not found", { item: _id })
      });
      else if (item.folder !== folder.id.toString()) {
        item.folder = folder.id.toString();
        item.save();
      }
    }
    return jsonResponse({ status: 200 });
  }

  @Put("/:id/remove", [useParamsForm(ObjectIDForm), useForm(FolderForm)])
  async removeItems(request: Request, idForm: ObjectIDForm, folderForm: FolderForm): Promise<Responder> {
    const owner = await this.authService.getOwnerId(request);
    const { id } = idForm.cleanedData;
    const { items } = folderForm.cleanedData;
    const folder = await FolderEntity.findOne({
      where: { _id: id, owner }
    });
    if (!folder) return jsonResponse({
      status: 404,
      error: new JsonResponseError("Folder not found")
    });
    for (let _id of items) {
      let item = await ItemEntity.findOne({
        where: { owner, _id }
      });
      if (!item) return jsonResponse({
        status: 404,
        error: new JsonResponseError("Item not found", { item: _id })
      });
      else if (item.folder == folder.id.toString()) {
        item.folder = undefined;
        item.save();
      }
    }
    return jsonResponse({ status: 200 });
  }
}