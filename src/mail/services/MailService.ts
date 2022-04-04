import { EServices, IIndexable } from "../../types";
import Service, { serviceClass } from "../../utils/services/Service";
import { EEmailTemplate, IMailService } from "../types";

@serviceClass(EServices.mail)
class MailService extends Service implements IMailService {
  sendMail(template: EEmailTemplate, context: IIndexable<any>, recipient: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}