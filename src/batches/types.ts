import { ObjectId } from "mongodb";
import { IItem } from "../inventory/types";

export interface IBatch {
  organization: ObjectId;
  items: ObjectId[];
  _id: ObjectId;
}

export interface IBatchView {
  organization: ObjectId;
  items: IItem[];
  id: ObjectId;
}
