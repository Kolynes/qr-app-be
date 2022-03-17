export interface IIndexable<T = any> {
  [key: string]: T;
}


export enum EServices {
  auth = "auth",
  qrcode = "qrcode"
}

export type Type<T = any> = { new(...args: any[]): T };