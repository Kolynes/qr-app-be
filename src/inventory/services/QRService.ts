import { EServices } from "../../types";
import Service, { serviceClass } from "../../utils/services/Service";
import { IQRService } from "../types";
import qrcode from "qrcode";

@serviceClass(EServices.qrcode)
class QRService extends Service implements IQRService {
  async createQRCode(id: string, organization: string): Promise<string> {
    return await qrcode.toDataURL(JSON.stringify({ id, organization }))
  }
}