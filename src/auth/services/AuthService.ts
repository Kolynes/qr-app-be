import { EServices, IIndexable } from "../../types";
import Service, { serviceClass } from "../../utils/services/Service";
import { IAuthService } from "../types";
import jwt, { JwtPayload } from "jsonwebtoken";
import { readFileSync } from "fs";

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
}