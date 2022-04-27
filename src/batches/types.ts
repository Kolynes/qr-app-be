import { ObjectId } from "mongodb";
import { IDates } from "../common/models";
import { IDirectoryLikeView, IItem } from "../inventory/types";

export interface IBatch extends IDates {
  organization: ObjectId;
  _id: ObjectId;
}

export interface IBatchView extends IDates {
  organization: ObjectId;
  items: IDirectoryLikeView[];
  id: ObjectId;
}
