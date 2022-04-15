import { MessagesSendResult } from "mailgun.js/interfaces/Messages";
import { IIndexable } from "../types";
import Service from "../utils/services/Service";

export enum EEmailTemplate {
  passwordRecoveryCode = "passwordRecoveryCode",
  signUpNote = "signUpNote",
  memberWelcomeNote = "memberWelcomeNote",
  newUserMemberWelcomeNote = "newUserMemberWelcomeNote"
}

export interface IMailService extends Service {
  sendMail(template: EEmailTemplate, context: IIndexable, recipient: string): Promise<MessagesSendResult>;
}