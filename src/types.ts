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
  organization = "organization",
  membership = "membership"
}


export enum EViews {
  user = "userView",
  batch = "batchView",
  inventory = "inventoryView",
  organization = "organizationView",
}

export type Type<T = any> = { new(...args: any[]): T };