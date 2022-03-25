import { Request } from "express";
import { UserEntity } from "../../auth/entities/UserEntity";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { EUserType, IAuthService } from "../../auth/types";
import { EServices } from "../../types";
import { Controller, Post } from "../../utils/controller";
import { useForm } from "../../utils/form";
import { Responder, jsonResponse } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { ItemEntity } from "../entities/ItemEntity";
import { ItemForm } from "../forms";
import { IQRService } from "../types";

@Controller([AuthMiddleware])
export default class QRController {
  @service(EServices.qrcode)
  private qrCodeService!: IQRService;

  @service(EServices.auth)
  private authService!: IAuthService;

  @Post("", [useForm(ItemForm)])
  async createQrCodes(request: Request, form: ItemForm): Promise<Responder> {
    const owner = await this.authService.getOwnerId(request);
    const { numberOfItems, type, totalWeight } = form.cleanedData;
    const qrCodes = [] as string[];

    for(let i = 0; i < numberOfItems; i++) {
      const item = ItemEntity.create({ owner, type, totalWeight });
      await item.save();
      qrCodes.push(
        await this.qrCodeService.createQRCode(
          item.id.toString(), 
          item.owner, 
          type
        )
      );
    }
    
    return jsonResponse(
      201,
      qrCodes
    );
  }
}