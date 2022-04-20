import { ECollections, EServices, IIndexable } from "../../types";
import Service, { serviceClass } from "../../utils/services/Service";
import { IAuthService, IUser } from "../types";
import jwt, { JwtPayload } from "jsonwebtoken";
import { readFileSync } from "fs";
import { Request } from "express";
import bcrypt from "bcrypt";
import { Collection, ObjectId } from "mongodb";
import { collection } from "../../database";
import { IOrganization } from "../../organizations/types";

@serviceClass(EServices.auth)
class AuthService extends Service implements IAuthService {
  @collection(ECollections.user)
  private User!: Collection<IUser>;

  @collection(ECollections.organization)
  private Organization!: Collection<IOrganization>;

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

  async getUser(request: Request,): Promise<IUser | null> {
    const token = this.extractToken(request);
    if(!token) return null;
    const data = await this.verifyToken(token);
    if(!data) return null;
    return await this.User.findOne({ _id: new ObjectId(data.id) }) as IUser;
  }

  extractToken(request: Request): string | undefined {
    const authorization = request.headers.authorization;
    if(!authorization) return undefined;
    const [prefix, token] = authorization.split(" ");
    if(!(prefix.toLowerCase() == "bearer" && token)) return undefined;
    return token;
  }

  async getOwnerFromOrganization(organizationId: ObjectId): Promise<ObjectId | undefined> {
    const organization = await this.Organization.findOne(organizationId);
    if(!organization) return undefined;
    return organization.owner;
  }

  async isMember(organizationId: ObjectId, request: Request): Promise<boolean> {
    const organization = await this.Organization.findOne(organizationId);
    if(!organization) return false;
    const user = await this.getUser(request);
    if(!user) return false;
    if(organization.members.includes(user._id!)) return false;
    return true;
  }

  async setPassword(user: IUser, newPassword: string) {
    let salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
  }

  async checkPassword(user: IUser, candidate: string): Promise<boolean> {
    const result = await bcrypt.compare(candidate, user.password)
    return result;
  }
}