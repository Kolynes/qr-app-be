import { EServices, IIndexable } from "../../types";
import Service, { serviceClass } from "../../utils/services/Service";
import { IAuthService } from "../types";
import jwt, { JwtPayload } from "jsonwebtoken";
import { readFileSync } from "fs";
import { Request } from "express";
import { UserEntity } from "../entities/UserEntity";
import { OrganizationEntity } from "../../organizations/entities/OrganizationEntity";

@serviceClass(EServices.auth)
class AuthService extends Service implements IAuthService {
  
  private getkey(): [string | Buffer, jwt.Algorithm] {
    if(process.env.PRIVATE_KEY && process.env.KEY_ALGORITHM) 
      return [
        readFileSync(process.env.PRIVATE_KEY!), 
        process.env.KEY_ALGORITHM as jwt.Algorithm
      ];
    else if(process.env.SECRET_KEY) 
      return [
        process.env.SECRET_KEY, 
        process.env.KEY_ALGORITHM as jwt.Algorithm
      ];
    else throw "no secret key or private key found";
  }

  async generateToken(data: IIndexable): Promise<string> {
    const [key, algorithm] = this.getkey();
    return jwt.sign(
      data,
      key,
      { algorithm: algorithm || "HS256" }
    );
  }

  async generateTokenHeader(data: IIndexable): Promise<IIndexable> {
    const token = await this.generateToken(data);
    return { authorization: `Bearer ${token}` };
  }

  async verifyToken(token: string): Promise<JwtPayload | undefined> {
    const [key, algorithm] = this.getkey();
    try {
      const data = jwt.verify(token, key, { algorithms: [algorithm] });
      return data as JwtPayload;
    } catch(e) {
      return undefined;
    }
  }

  async getUser(request: Request,): Promise<UserEntity | undefined> {
    const token = this.extractToken(request);
    if(!token) return undefined;
    const data = await this.verifyToken(token);
    if(!data) return undefined;
    return (await UserEntity.findOne(data.id));
  }

  extractToken(request: Request): string | undefined {
    const authorization = request.headers.authorization;
    if(!authorization) return undefined;
    const [prefix, token] = authorization.split(" ");
    if(!(prefix.toLowerCase() == "bearer" && token)) return undefined;
    return token;
  }

  async getOwnerFromOrganization(organizationId: string): Promise<string | undefined> {
    const organization = await OrganizationEntity.findOne(organizationId);
    if(!organization) return undefined;
    return organization.owner;
  }

  async isMember(organizationId: string, request: Request): Promise<boolean> {
    const organization = await OrganizationEntity.findOne(organizationId);
    if(!organization) return false;
    const user = await this.getUser(request);
    if(!user) return false;
    if(organization.members.includes({ id: user.id.toString() })) return false;
    return true;
  }
}