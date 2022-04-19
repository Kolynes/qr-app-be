import { ObjectId } from "mongodb";
import Service from "../utils/services/Service";

export enum EQRCodeType {
  grain = "grain",
  allInOne = "all in one",
  genetic = "genetic",
  substrate = "substrate"
}

export interface IQRService extends Service {
  createQRCode(id: ObjectId, ownerId: ObjectId): Promise<string>;
}

export enum EDirectoryType {
  folder = "folder",
  item = "item"
}

export interface IItem {
  type: EQRCodeType;
  totalWeight: number;
  geneticName: string;
  history?: string;
  tags?: string[];
  cooked?: number;
  unitOfMeasure?: string;
  sterilizationDevice?: string;
  comments?: string;
  ingredientsByWeight?: string;
  parent?: string;
}

export interface IDirectoryLike {
  _id?: ObjectId
  organization: ObjectId,
  directoryType: EDirectoryType,
  item?: IItem,
  batch?: ObjectId,
  name?: string,
  color?: string,
  items?: ObjectId[]
}

export interface IDirectoryLikeView {
  organization: ObjectId,
  directoryType: EDirectoryType,
  item?: IItem,
  batch?: ObjectId,
  name?: string,
  color?: string,
  items?: IDirectoryLike[],
  _id?: ObjectId
}