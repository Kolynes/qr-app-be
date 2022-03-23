import { EServices } from "../../types";
import Service, { serviceClass } from "../../utils/services/Service";
import { EQRCodeType, IQRService } from "../types";
import qrcode from "qrcode";

@serviceClass(EServices.qrcode)
class QRService extends Service implements IQRService {
  async createQRCode(id: string, ownerId: string, type: EQRCodeType): Promise<string> {
    return await qrcode.toDataURL(JSON.stringify({ id, ownerId, type }))
  }
}