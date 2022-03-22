// import { Request } from "express";
// import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
// import { IAuthService } from "../../auth/types";
// import { EServices } from "../../types";
// import { Controller, Delete, Get, Patch, Post } from "../../utils/controller";
// import { Responder } from "../../utils/responses";
// import { service } from "../../utils/services/ServiceProvider";
// import { IQRService } from "../types";

// @Controller([AuthMiddleware])
// export default class FolderyController {
//   @service(EServices.auth)
//   private authService!: IAuthService;

//   @service(EServices.qrcode)
//   private qrCodeService!: IQRService;

//   @Post()
//   async createFolder(request: Request): Promise<Responder> {
    
//   }

//   @Get()
//   async getFolders(request: Request): Promise<Responder> {
    
//   }

//   @Get()
//   async getFolder(request: Request): Promise<Responder> {
    
//   }

//   @Patch()
//   async updateFolder(request: Request): Promise<Responder> {
    
//   }

//   @Delete()
//   async deleteFolder(request: Request): Promise<Responder> {
    
//   }
// }