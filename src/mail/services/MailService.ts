import { EServices, IIndexable } from "../../types";
import Service, { serviceClass } from "../../utils/services/Service";
import { EEmailTemplate, IMailService } from "../types";
import Mailgun from "mailgun.js";
import FormData from "form-data";
import { MessagesSendResult } from "mailgun.js/interfaces/Messages";
import fs from "fs";
import Mustache from "mustache";

@serviceClass(EServices.mail)
class MailService extends Service implements IMailService {
  private client = new Mailgun(FormData).client({
    username: process.env.MAILGUN_USERNAME!,
    key: process.env.MAILGUN_API_KEY!
  });

  async sendMail(template: EEmailTemplate, context: IIndexable<any>, recipient: string): Promise<MessagesSendResult> {
    const templateText = fs.readFileSync(`${__dirname}/../../../${template}`);
    return await this.client.messages.create(
      process.env.DOMAIN_NAME!,
      {
        from: process.env.MAILGUN_SENDER!,
        to: recipient,
        html: Mustache.render(
          templateText.toString(),
          context
        )
      }
    );
  }
}