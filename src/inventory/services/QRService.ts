import { EServices } from "../../types";
import Service, { serviceClass } from "../../utils/services/Service";
import { IQRService } from "../types";
import qrcode from "qrcode";
import { ObjectId } from "mongodb";

@serviceClass(EServices.qrcode)
class QRService extends Service implements IQRService {
  async createQRCode(id: ObjectId, organization: ObjectId): Promise<string> {
    return await qrcode.toDataURL(JSON.stringify({ id, organization }))
  }
}