import { ObjectId } from "mongodb";
import { IDates } from "../common/models";
import { IDirectoryLike } from "../inventory/types";

export interface IOrganization extends IDates {
  name: string,
  owner: ObjectId,
  rootFolder: ObjectId,
  _id?: ObjectId
}

export interface IOrganizationView extends IDates {
  name: string,
  owner: ObjectId,
  rootFolder: ObjectId,
  id?: ObjectId
}

export interface IMembership extends IDates {
  user: ObjectId,
  organization: ObjectId
}

export interface INewMember {
  email: string,
  firstName?: string,
  lastName?: string
}