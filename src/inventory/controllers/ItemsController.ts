import { Request } from "express";
import { ObjectId } from "mongodb";
import { UserEntity } from "../../auth/entities/UserEntity";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { IAuthService } from "../../auth/types";
import { EServices } from "../../types";
import { Controller, Delete, Get, Patch, Post, Put } from "../../utils/controller";
import { useForm } from "../../utils/form";
import { paginate } from "../../utils/pagination";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { ItemEntity } from "../entities/ItemEntity";
import { ItemForm } from "../forms";
import { EQRCodeType, IQRService } from "../types";

@Controller([AuthMiddleware])
export default class ItemsController {
  @service(EServices.auth)
  private authService!: IAuthService;

  @service(EServices.qrcode)
  private qrCodeService!: IQRService;

  @Post("", [useForm(ItemForm)])
  async createItems(request: Request, form: ItemForm): Promise<Responder> {
    const number = form.cleanedData.numberOfItems;
    const user = (await this.authService.getUser<UserEntity>(request, UserEntity))!;
    const qrCodes = [] as string[];
    for(let i = 0; i < number; i++) {
      const item = new ItemEntity;
      item.owner = user.id.toString();
      await item.save();
      qrCodes.push(
        await this.qrCodeService.createQRCode(
          item.id.toString(), 
          item.owner.toString(), 
          EQRCodeType.item
        )
      );
    }
    return jsonResponse(
      201,
      qrCodes
    );
  }

  @Get()
  async getItems(request: Request): Promise<Responder> {
    const user = (await this.authService.getUser<UserEntity>(request, UserEntity))!;
    const query = request.query.query;
    const page = Math.abs(parseInt(request.query.page as string)) || 1;
    const size = parseInt(request.query.size as string) || 100;
    const items = await ItemEntity.find({
      where: {
        $and: [
          { geneticName: query && new RegExp(query as string) || undefined },
          { owner: user.id },
          { deleteDate: undefined },
        ],
      }
    })

    const [data, numberOfPages, nextPage, previousPage] = paginate(items, page, size);
    return jsonResponse(
      200,
      data,
      undefined,
      numberOfPages,
      nextPage,
      previousPage
    );
  }

  @Get("/:id")
  async getItem(request: Request): Promise<Responder> {
    const user = (await this.authService.getUser<UserEntity>(request, UserEntity))!;
    const item = await ItemEntity.findOne({
      where: {
        $and: [
          { _id: ObjectId(request.params.id) },
          { owner: user.id.toString() },
          { deleteDate: undefined },
        ]
      }
    });
    if(!item) return jsonResponse(
      404, 
      undefined, 
      new JsonResponseError("Item not found")
    );
    return jsonResponse(
      200,
      item
    );
  }

  // @Patch("/:id")
  // async updateItem(request: Request): Promise<Responder> {
  //   const user = await this.authService.getUser<UserEntity>(request, UserEntity);
  //   const product = await QREntity.findOne({
  //     where: {
  //       $and: [
  //         { _id: ObjectId(request.params.id) },
  //         { userId: user!.id.toString() },
  //         { deleteDate: undefined },
  //       ]
  //     }
  //   });
  //   if(!product) return jsonResponse(
  //     404,
  //     undefined,
  //     new JsonResponseError("Product not found.")
  //   );
  //   const form = new ProductUpdateForm({ ...product, ...request.body });
  //   if(!form.validate()) return jsonResponse(
  //     400,
  //     undefined,
  //     new JsonResponseError("Invalid parameters", form.errors)
  //   );
  //   Object.assign(product, form.cleanedData);
  //   await product.save();
  //   return jsonResponse(
  //     200,
  //     product
  //   );
  // }

  // @Delete("/:id")
  // async deleteItem(request: Request): Promise<Responder> {
  //   const user = await this.authService.getUser<UserEntity>(request, UserEntity);
  //   const product = await QREntity.findOne({
  //     where: {
  //       $and: [
  //         { _id: ObjectId(request.params.id) },
  //         { userId: user!.id.toString() },
  //         { deleteDate: undefined },
  //       ]
  //     }
  //   });
  //   if(!product) return jsonResponse(
  //     404,
  //     undefined,
  //     new JsonResponseError("Product not found.")
  //   );
  //   await product.softRemove();
  //   return jsonResponse(200)
  // }

}