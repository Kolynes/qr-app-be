import { Application, Request, Response, Router } from "express";
import { Type } from "../../types";
import { RouteHandler, EHttpMethods, IController, RouteConfig } from "./types";

export function Route(path: string = "", method: EHttpMethods): MethodDecorator {
  return (target: any, property: string | symbol, descriptor: any) => {
    return {
      ...descriptor,
      value: new RouteConfig(
        method,
        path,
        target[property] as RouteHandler
      )
    }
  }
}

export function Get(path?: string): MethodDecorator {
  return Route(path, EHttpMethods.get);
}

export function Post(path?: string): MethodDecorator {
  return Route(path, EHttpMethods.post);
}

export function Put(path?: string): MethodDecorator {
  return Route(path, EHttpMethods.put);
}

export function Delete(path?: string): MethodDecorator {
  return Route(path, EHttpMethods.delete);
}

export function Connect(path?: string): MethodDecorator {
  return Route(path, EHttpMethods.connect);
}

export function Options(path?: string): MethodDecorator {
  return Route(path, EHttpMethods.options);
}

export function Trace(path?: string): MethodDecorator {
  return Route(path, EHttpMethods.trace);
}

export function Patch(path?: string): MethodDecorator {
  return Route(path, EHttpMethods.patch);
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
              const responder = await func.bind(this)(req);
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
