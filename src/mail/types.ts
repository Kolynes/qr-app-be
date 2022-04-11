import { MessagesSendResult } from "mailgun.js/interfaces/Messages";
import { IIndexable } from "../types";
import Service from "../utils/services/Service";

export enum EEmailTemplate {
  passwordRecoveryCode = "./templates/passwordRecoveryCode.html",
  signUpNote = "./templates/signUpNote.html",
  employeeWelcomeNote = "./templates/employeeWelcomeNote.html"
}

export interface IMailService extends Service {
  sendMail(template: EEmailTemplate, context: IIndexable, sender: string, recipient: string): Promise<MessagesSendResult>;
}