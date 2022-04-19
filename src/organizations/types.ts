import { ObjectId } from "mongodb";
import { IUserView } from "../auth/types";
import { IDates } from "../common/models";

export interface IOrganization extends IDates {
  name: string,
  owner: ObjectId,
  members: ObjectId[],
  _id?: ObjectId
}

export interface IOrganizationView extends IDates {
  name: string,
  owner: ObjectId,
  members: IUserView[],
  _id?: ObjectId
}

export interface INewMember {
  email: string,
  firstName?: string,
  lastName?: string
}