import { ObjectId } from "mongodb";
import { IItem } from "../inventory/types";

export interface IBatch {
  organization: ObjectId;
  items: { id : ObjectId }[];
  _id: ObjectId;
}

export interface IBatchView {
  organization: ObjectId;
  items: IItem[];
  _id: ObjectId;
}
