import Service from "../utils/services/Service";

export enum EQRCodeType {
  grain = "grain",
  allInOne = "all in one",
  genetic = "genetic",
  substrate = "substrate"
}

export interface IQRService extends Service {
  createQRCode(id: string, ownerId: string, type: EQRCodeType): Promise<string>;
}

export enum EDirectoryType {
  folder = "folder",
  item = "item"
}