import { ObjectId } from "mongodb";
import { IDirectoryLikeView, IItem } from "../inventory/types";

export interface IBatch {
  organization: ObjectId;
  _id: ObjectId;
}

export interface IBatchView {
  organization: ObjectId;
  items: IDirectoryLikeView[];
  id: ObjectId;
}
