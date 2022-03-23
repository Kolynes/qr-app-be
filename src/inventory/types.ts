import Service from "../utils/services/Service";

export enum EQRCodeType {
  folder = "folder",
  product = "product",
}

export interface IQRService extends Service {
  createQRCode(id: string, ownerId: string, type: EQRCodeType): Promise<string>;
}