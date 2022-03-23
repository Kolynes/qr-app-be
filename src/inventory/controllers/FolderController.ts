import { Request } from "express";
import { ObjectId } from "mongodb";
import { UserEntity } from "../../auth/entities/UserEntity";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { IAuthService } from "../../auth/types";
import { EServices } from "../../types";
import { Controller, Delete, Get, Patch, Post } from "../../utils/controller";
import { paginate } from "../../utils/pagination";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { FolderEntity } from "../entities/FolderEntity";
import { FolderForm } from "../forms";
import { EQRCodeType, IQRService } from "../types";

@Controller([AuthMiddleware])
export default class FolderController {
  @service(EServices.auth)
  private authService!: IAuthService;

  @service(EServices.qrcode)
  private qrCodeService!: IQRService;

  @Post()
  async createFolder(request: Request): Promise<Responder> {
    const user = await this.authService.getUser<UserEntity>(request, UserEntity);
    const form = new FolderForm(request.body);
    if(!form.validate())
      return jsonResponse(
        400, 
        undefined, 
        new JsonResponseError("Invalid parameters", form.errors)
      );
    const folder = FolderEntity.create({ ...form.cleanedData, userId: user!.id.toString() });
    await folder.save();
    const qrCode = await this.qrCodeService.createQRCode(folder.id.toString(), user!.id.toString(), EQRCodeType.folder);
    return jsonResponse(
      201,
      { folder, qrCode }
    );
  }

  @Get()
  async getFolders(request: Request): Promise<Responder> {
    const user = await this.authService.getUser<UserEntity>(request, UserEntity);
    const query = request.query.query || "";
    const page = Math.abs(parseInt(request.query.page as string)) || 1;
    const size = parseInt(request.query.size as string) || 100;
    const folders = await FolderEntity.find({
      where: {
        $and: [
          { name: new RegExp(query as string) },
          { userId: user!.id.toString() },
          { deleteDate: undefined },
        ],
      }
    })

    const [data, numberOfPages, nextPage, previousPage] = paginate(await Promise.all(folders), page, size);

    return jsonResponse(
      200,
      data,
      undefined,
      numberOfPages,
      nextPage,
      previousPage
    );
  }

  @Get()
  async getFolder(request: Request): Promise<Responder> {
    const user = await this.authService.getUser<UserEntity>(request, UserEntity);
    const folder = await FolderEntity.findOne({
      where: {
        $and: [
          { _id: ObjectId(request.params.id) },
          { userId: user!.id.toString() },
          { deleteDate: undefined },
        ]
      }
    });
    if(!folder) return jsonResponse(
      404, 
      undefined, 
      new JsonResponseError("Folder not found")
    );
    return jsonResponse(
      200,
      folder
    );
  }

  // @Patch()
  // async changeFolderName(request: Request): Promise<Responder> {
    
  // }

  // @Patch()
  // async removeProducts(request: Request): Promise<Responder> {

  // }

  // @Patch()
  // async moveProducts(request: Request): Promise<Responder> {

  // }

  // @Patch()
  // async addProducts(request: Request): Promise<Responder> {

  // }

  // @Delete()
  // async deleteFolder(request: Request): Promise<Responder> {
    
  // }
}