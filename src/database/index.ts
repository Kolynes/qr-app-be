import { ECollections, EServices } from "../types";
import ServiceProvider from "../utils/services/ServiceProvider";
import { IDBService } from "./types";

export function collection(name: ECollections): PropertyDecorator {
  return (
    target: any, 
    propertyKey: string | symbol,
  ) => {
    const dbService = ServiceProvider.getInstance().getService<IDBService>(EServices.database);
    Object.defineProperty(target, propertyKey, { get: () => dbService.collections[name] });
  }
}