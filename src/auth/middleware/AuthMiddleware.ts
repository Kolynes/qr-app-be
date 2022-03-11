import { NextFunction, Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { EServices } from "../../types";
import Middleware from "../../utils/middleware";
import { service } from "../../utils/services/ServiceProvider";
import { IAuthService } from "../types";

export default class AuthMiddleware extends Middleware {
  @service(EServices.auth)
  private authService!: IAuthService;

  handle(request: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, response: Response<any, Record<string, any>>, next: NextFunction): void {
    if(!request.headers.authorization) response.sendStatus(401);
    else {
      const [prefix, token] = request.headers.authorization!.split(" ")
      if(!(prefix.toLowerCase() == "bearer" && token)) response.sendStatus(401);
      else {
        const valid = this.authService.verifyToken(token);
        if(!valid) response.sendStatus(401);
        else next();
      }
    }
  }
}
