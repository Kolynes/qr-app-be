import { NextFunction, Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { EServices } from "../../types";
import Middleware from "../../utils/middleware";
import { service } from "../../utils/services/ServiceProvider";
import { UserEntity } from "../entities/UserEntity";
import { IAuthService } from "../types";

export default class AuthMiddleware extends Middleware {
  @service(EServices.auth)
  private authService!: IAuthService;

  async handle(request: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, response: Response<any, Record<string, any>>, next: NextFunction) {
    const user = await this.authService.getUser(request);
    if(user === undefined) response.sendStatus(401);
    else next();
  }
}
