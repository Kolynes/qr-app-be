// import { Request } from "express";
// import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
// import { IAuthService } from "../../auth/types";
// import { EServices } from "../../types";
// import { Controller, Delete, Get, Patch, Post } from "../../utils/controller";
// import { Responder } from "../../utils/responses";
// import { service } from "../../utils/services/ServiceProvider";
// import { IQRService } from "../types";

// @Controller([AuthMiddleware])
// export default class InventoryController {
//   @service(EServices.auth)
//   private authService!: IAuthService;

//   @service(EServices.qrcode)
//   private qrCodeService!: IQRService;

//   @Post()
//   async createProduct(request: Request): Promise<Responder> {
    
//   } 

//   @Get()
//   async getProducts(request: Request): Promise<Responder> {
    
//   }

//   @Get()
//   async getProduct(request: Request): Promise<Responder> {
    
//   }

//   @Patch()
//   async updateProduct(request: Request): Promise<Responder> {
    
//   }

//   @Delete()
//   async deleteProduct(request: Request): Promise<Responder> {
    
//   }
// }