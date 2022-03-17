import { EServices } from "../../types";
import Service, { serviceClass } from "../../utils/services/Service";
import { IQRService } from "../types";

@serviceClass(EServices.qrcode)
class QRService extends Service implements IQRService {

  createQRCode(data: any): Promise<string> {
    throw new Error("Method not implemented.");
  }
  
}