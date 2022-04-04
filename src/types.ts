export interface IIndexable<T = any> {
  [key: string]: T;
}

export enum EServices {
  auth = "auth",
  qrcode = "qrcode",
  mail = "mail"
}

export type Type<T = any> = { new(...args: any[]): T };