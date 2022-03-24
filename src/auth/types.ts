import { Request } from "express-serve-static-core";
import { JwtPayload } from "jsonwebtoken";
import { BaseEntity } from "typeorm";
import { IIndexable } from "../types";
import Service from "../utils/services/Service";

export interface IAuthService extends Service {
  generateToken(data: IIndexable): Promise<string>;
  generateTokenHeader(data: IIndexable): Promise<IIndexable>;
  verifyToken(token: string): Promise<JwtPayload | undefined>;
  getUser<T extends BaseEntity>(request: Request, EntityType: any): Promise<T | undefined>;
  extractToken(request: Request): string | undefined;
}

export enum EUserType {
  employer = "employer",
  single = "single",
  employee = "employee" 
}