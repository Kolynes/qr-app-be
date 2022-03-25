import { Request } from "express";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { IAuthService } from "../../auth/types";
import { ObjectIDForm } from "../../common/forms";
import { EServices } from "../../types";
import { Controller, Delete, Put } from "../../utils/controller";
import { useForm, useParamsForm } from "../../utils/form";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { ItemEntity } from "../entities/ItemEntity";
import { FolderForm } from "../forms";

@Controller([AuthMiddleware])
export default class FoldersController {
  @service(EServices.auth)
  private authService!: IAuthService;

  @Put("/:id/add", [useParamsForm(ObjectIDForm), useForm(FolderForm)])
  async addItems(request: Request, idForm: ObjectIDForm, folderForm: FolderForm): Promise<Responder> {
    const owner = await this.authService.getOwnerId(request);
    const { id } = idForm.cleanedData;
    const { items } = folderForm.cleanedData;
    const folder = await ItemEntity.findOne({
      where: { _id: id, owner}
    });
    if(!folder) return jsonResponse(
      404, 
      undefined, 
      new JsonResponseError("Folder not found")
    );
    for(let _id of items) {
      let item = await ItemEntity.findOne({
        where: { owner, _id }
      });
      if(!item) return jsonResponse(
        404,
        undefined,
        new JsonResponseError("Item not found", { item: _id })
      );
      else if(item.folder !== folder.id.toString()) {
        item.folder = folder.id.toString();
        item.save();
      }
    }
    return jsonResponse(200)
  }

  @Put("/:id/remove", [useParamsForm(ObjectIDForm), useForm(FolderForm)])
  async removeItems(request: Request, idForm: ObjectIDForm, folderForm: FolderForm): Promise<Responder> {
    const owner = await this.authService.getOwnerId(request);
    const { id } = idForm.cleanedData;
    const { items } = folderForm.cleanedData;
    const folder = await ItemEntity.findOne({
      where: { _id: id, owner}
    });
    if(!folder) return jsonResponse(
      404, 
      undefined, 
      new JsonResponseError("Folder not found")
    );
    for(let _id of items) {
      let item = await ItemEntity.findOne({
        where: { owner, _id }
      });
      if(!item) return jsonResponse(
        404,
        undefined,
        new JsonResponseError("Item not found", { item: _id })
      );
      else if(item.folder == folder.id.toString()) {
        item.folder = undefined;
        item.save();
      }
    }
    return jsonResponse(200)
  }
}