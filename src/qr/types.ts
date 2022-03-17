import Service from "../utils/services/Service";

export interface IQRService extends Service {
  createQRCode(data: any): Promise<string>;
}