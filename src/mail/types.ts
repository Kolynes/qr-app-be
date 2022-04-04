import { IIndexable } from "../types";
import Service from "../utils/services/Service";


export enum EEmailTemplate {
  passwordRecoveryCode
}

export interface IMailService extends Service {
  sendMail(template: EEmailTemplate, context: IIndexable, recipient: string): Promise<boolean>;
}