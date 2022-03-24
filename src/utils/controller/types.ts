import { Application, Request } from "express";
import { Responder } from "../responses";

export type RouteHandler = (request: Request, ...args: any[]) => Promise<Responder>;
export type RouteHandlerDecorator = (wrapped: RouteHandler) => RouteHandler;

export class RouteConfig {
  constructor(
    readonly method: EHttpMethods,
    readonly path: string,
    readonly func: RouteHandler
  ) { }
}

export enum EHttpMethods {
  get = "get",
  post = "post",
  put = "put",
  delete = "delete",
  connect = "connect",
  options = "options",
  trace = "trace",
  patch = "patch"
}

export interface IController {
  new(app: Application, controllerPath: string): {}
}