import { Request } from "express";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { Controller, Delete, Get, Post } from "../../utils/controller";
import { Responder } from "../../utils/responses";

// @Controller([AuthMiddleware])
// export default class QRController {

//   @Post()
//   createQRCode(request: Request): Promise<Responder> {
    
//   }

//   @Get()
//   getHistory(request: Request): Promise<Responder> {

//   }

//   @Delete()
//   deleteRecord(request: Request): Promise<Responder> {

//   }
// }