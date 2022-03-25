import { Request } from "express-serve-static-core";
import { JwtPayload } from "jsonwebtoken";
import { BaseEntity, ObjectID } from "typeorm";
import { IIndexable } from "../types";
import Service from "../utils/services/Service";
import { UserEntity } from "./entities/UserEntity";

export interface IAuthService extends Service {
  generateToken(data: IIndexable): Promise<string>;
  generateTokenHeader(data: IIndexable): Promise<IIndexable>;
  verifyToken(token: string): Promise<JwtPayload | undefined>;
  getUser(request: Request): Promise<UserEntity | undefined>;
  getOwnerId(request: Request): Promise<string | undefined>;
  extractToken(request: Request): string | undefined;
}

export enum EUserType {
  employer = "employer",
  single = "single",
  employee = "employee" 
}