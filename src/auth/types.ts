import { Request } from "express-serve-static-core";
import { JwtPayload } from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { IDates } from "../common/models";
import { IIndexable } from "../types";
import Service from "../utils/services/Service";

export interface IAuthService extends Service {
  generateToken(data: IIndexable): Promise<string>;
  generateTokenHeader(data: IIndexable): Promise<IIndexable>;
  verifyToken(token: string): Promise<JwtPayload | undefined>;
  getUser(request: Request): Promise<IUser | null>;
  extractToken(request: Request): string | undefined;
  getOwnerFromOrganization(organizationId: ObjectId): Promise<ObjectId | undefined>;
  isMember(organizationId: ObjectId, request: Request): Promise<boolean>;
  checkPassword(user: IUser, candidate: string): Promise<boolean>;
  setPassword(user: IUser, newPassword: string): Promise<void>;
}

export interface IUser extends IDates {
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  _id?: ObjectId
}

export interface IVerification extends IDates {
  userId: ObjectId,
  code: string,
  _id?: ObjectId
}

export interface IUserView extends IDates {
  firstName: string,
  lastName: string,
  email: string,
  id: ObjectId
}