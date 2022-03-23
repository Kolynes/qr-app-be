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
import { ProductEntity } from "../entities/ProductEntity";
import { ProductForm, ProductUpdateForm } from "../forms";
import { EQRCodeType, IQRService } from "../types";

@Controller([AuthMiddleware])
export default class ProductController {
  @service(EServices.auth)
  private authService!: IAuthService;

  @service(EServices.qrcode)
  private qrCodeService!: IQRService;

  @Post()
  async createProduct(request: Request): Promise<Responder> {
    const user = await this.authService.getUser<UserEntity>(request, UserEntity);
    const form = new ProductForm(request.body);
    if(!form.validate())
      return jsonResponse(
        400, 
        undefined, 
        new JsonResponseError("Invalid parameters", form.errors)
      );
    const product = ProductEntity.create({ ...form.cleanedData, userId: user!.id.toString() });
    await product.save();
    const qrCode = await this.qrCodeService.createQRCode(product.id.toString(), user!.id.toString(), EQRCodeType.product);
    return jsonResponse(
      201,
      { product, qrCode }
    );
  } 

  @Get()
  async getProducts(request: Request): Promise<Responder> {
    const user = await this.authService.getUser<UserEntity>(request, UserEntity);
    const query = request.query.query || "";
    const page = Math.abs(parseInt(request.query.page as string)) || 1;
    const size = parseInt(request.query.size as string) || 100;
    const products = await ProductEntity.find({
      where: {
        $and: [
          { geneticName: new RegExp(query as string) },
          { userId: user!.id.toString() },
          { deleteDate: undefined },
        ],
      }
    })

    const [data, numberOfPages, nextPage, previousPage] = paginate(await Promise.all(products), page, size);

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
  async getProduct(request: Request): Promise<Responder> {
    const user = await this.authService.getUser<UserEntity>(request, UserEntity);
    const product = await ProductEntity.findOne({
      where: {
        $and: [
          { _id: ObjectId(request.params.id) },
          { userId: user!.id.toString() },
          { deleteDate: undefined },
        ]
      }
    });
    if(!product) return jsonResponse(
      404, 
      undefined, 
      new JsonResponseError("Product not found")
    );
    return jsonResponse(
      200,
      product
    );
  }

  @Patch("/:id")
  async updateProduct(request: Request): Promise<Responder> {
    const user = await this.authService.getUser<UserEntity>(request, UserEntity);
    const product = await ProductEntity.findOne({
      where: {
        $and: [
          { _id: ObjectId(request.params.id) },
          { userId: user!.id.toString() },
          { deleteDate: undefined },
        ]
      }
    });
    if(!product) return jsonResponse(
      404,
      undefined,
      new JsonResponseError("Product not found.")
    );
    const form = new ProductUpdateForm({ ...product, ...request.body });
    if(!form.validate()) return jsonResponse(
      400,
      undefined,
      new JsonResponseError("Invalid parameters", form.errors)
    );
    Object.assign(product, form.cleanedData);
    await product.save();
    return jsonResponse(
      200,
      product
    );
  }

  @Delete("/:id")
  async deleteProduct(request: Request): Promise<Responder> {
    const user = await this.authService.getUser<UserEntity>(request, UserEntity);
    const product = await ProductEntity.findOne({
      where: {
        $and: [
          { _id: ObjectId(request.params.id) },
          { userId: user!.id.toString() },
          { deleteDate: undefined },
        ]
      }
    });
    if(!product) return jsonResponse(
      404,
      undefined,
      new JsonResponseError("Product not found.")
    );
    await product.softRemove();
    return jsonResponse(200)
  }
}