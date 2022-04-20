import { ECollections, EServices, EViews } from "../types";
import ServiceProvider from "../utils/services/ServiceProvider";
import { IDBService } from "./types";

export function collection(name: ECollections | EViews): PropertyDecorator {
  return (
    target: any, 
    propertyKey: string | symbol,
  ) => {
    const dbService = ServiceProvider.getInstance().getService<IDBService>(EServices.database);
    Object.defineProperty(target, propertyKey, { get: () => dbService.collections[name] });
  }
}

export function view(name: EViews): PropertyDecorator {
  return (
    target: any, 
    propertyKey: string | symbol,
  ) => {
    const dbService = ServiceProvider.getInstance().getService<IDBService>(EServices.database);
    Object.defineProperty(target, propertyKey, { get: () => dbService.collections[name] });
  }
}