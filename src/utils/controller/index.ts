import { Application, Request, Response, Router } from "express";
import { Type } from "../../types";
import { RouteHandler, EHttpMethods, IController, RouteConfig, RouteHandlerDecorator } from "./types";

export function Route(path: string = "", method: EHttpMethods, decorators?: RouteHandlerDecorator[]): MethodDecorator {
  return (target: any, property: string | symbol, descriptor: any) => {
    let handler = target[property].bind(target);
    if(decorators)
      for(let d = decorators.length - 1; d >= 0; d--)
        handler = decorators[d](handler);
    return {
      ...descriptor,
      value: new RouteConfig(
        method,
        path,
        handler as RouteHandler
      )
    }
  }
}

export function Get(path?: string, decorators?: RouteHandlerDecorator[]): MethodDecorator {
  return Route(path, EHttpMethods.get, decorators);
}

export function Post(path?: string, decorators?: RouteHandlerDecorator[]): MethodDecorator {
  return Route(path, EHttpMethods.post, decorators);
}

export function Put(path?: string, decorators?: RouteHandlerDecorator[]): MethodDecorator {
  return Route(path, EHttpMethods.put, decorators);
}

export function Delete(path?: string, decorators?: RouteHandlerDecorator[]): MethodDecorator {
  return Route(path, EHttpMethods.delete, decorators);
}

export function Connect(path?: string, decorators?: RouteHandlerDecorator[]): MethodDecorator {
  return Route(path, EHttpMethods.connect, decorators);
}

export function Options(path?: string, decorators?: RouteHandlerDecorator[]): MethodDecorator {
  return Route(path, EHttpMethods.options, decorators);
}

export function Trace(path?: string, decorators?: RouteHandlerDecorator[]): MethodDecorator {
  return Route(path, EHttpMethods.trace, decorators);
}

export function Patch(path?: string, decorators?: RouteHandlerDecorator[]): MethodDecorator {
  return Route(path, EHttpMethods.patch, decorators);
}

export function Controller(middleware: Type[] = []) {
  return <T extends Type>(target: T): T => {
     class NewFunction extends target {
      constructor(...args: any[]) {
        const app = args[0], controllerPath = args[1];
        super(...args.slice(2));
        for(let prop in target.prototype) {
          Object.defineProperty(this, prop, { value: target.prototype[prop] })
        }
        let descriptors = Object.getOwnPropertyDescriptors(this);
        const router = Router();
        for (let m of middleware) new m(router);
        for (let d in descriptors) {
          if (!(descriptors[d].value instanceof RouteConfig)) continue;
          let descriptorValue = (descriptors[d].value as RouteConfig);
          const method = descriptorValue.method;
          const func = descriptorValue.func;
          const path = descriptorValue.path;
          router[method](
            path,
            async (req: Request, res: Response) => {
              const responder = await func(req);
              responder(res);
            }
          );
        }
        app.use(controllerPath, router);
      }
    };
    return NewFunction as T;
  }
}


export function registerController(Controller: Function, app: Application, path: string) {
  new (Controller as IController)(app, path);
}
