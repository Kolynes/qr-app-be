import Service from "../utils/services/Service";

export enum EQRCodeType {
  folder = "folder",
  item = "item",
}

export interface IQRService extends Service {
  createQRCode(id: string, ownerId: string, type: EQRCodeType): Promise<string>;
}