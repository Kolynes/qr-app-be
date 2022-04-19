export interface IIndexable<T = any> {
  [key: string]: T;
}




export enum EServices {
  auth = "auth",
  qrcode = "qrcode",
  mail = "mail",
  batches = "batches",
  database = "database"
}
















export enum ECollections {
  user = "user",
  verification = "verification",
  batch = "batch",
  inventory = "inventory",
  organization = "organization"
}

export enum EViews {
  user = "user"
}

export type Type<T = any> = { new(...args: any[]): T };