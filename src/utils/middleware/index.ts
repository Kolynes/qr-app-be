import { Application, NextFunction, Request, Response, Router } from "express";

export default abstract class Middleware {
  abstract handle(request: Request, response: Response, next: NextFunction): void;

  constructor(app: Application | Router) {
    app.use(this.handle.bind(this))
  }
}