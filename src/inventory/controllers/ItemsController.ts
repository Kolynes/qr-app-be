import { Request } from "express";
import { ObjectId } from "mongodb";
import { UserEntity } from "../../auth/entities/UserEntity";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { EUserType, IAuthService } from "../../auth/types";
import { ObjectIDForm } from "../../common/forms";
import { EServices } from "../../types";
import { Controller, Delete, Get } from "../../utils/controller";
import { useParamsForm } from "../../utils/form";
import { paginate } from "../../utils/pagination";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { ItemEntity } from "../entities/ItemEntity";
import { EQRCodeType } from "../types";

@Controller([AuthMiddleware])
export default class ItemsController {
  @service(EServices.auth)
  private authService!: IAuthService;

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
    return jsonResponse(
      200,
      data,
      undefined,
      numberOfPages,
      nextPage,
      previousPage
    );
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
    if(!item) return jsonResponse(
      404,
      undefined,
      new JsonResponseError("Item not found.")
    );
    await item.softRemove();
    return jsonResponse(200);
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

}