import { JwtPayload } from "jsonwebtoken";
import { IIndexable } from "../types";
import Service from "../utils/services/Service";

export interface IAuthService extends Service {
  generateToken(data: IIndexable): Promise<string>;
  generateTokenHeader(data: IIndexable): Promise<IIndexable>;
  verifyToken(token: string): Promise<JwtPayload | undefined>;
}