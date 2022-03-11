export interface IIndexable<T = any> {
  [key: string]: T;
}

export enum EServices {
  auth = "auth",
}

export type Type = { new(...args: any[]): any };