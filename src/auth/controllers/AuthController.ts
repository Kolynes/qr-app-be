import { Request } from "express";
import { EServices, IIndexable } from "../../types";
import { Controller, Post } from "../../utils/controller";
import { jsonResponse } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { UserEntity } from "../entities/UserEntity";
import { LoginForm, SignupForm } from "../forms";
import { IAuthService } from "../types";

@Controller()
export default class AuthController {
  @service(EServices.auth)
  private authService!: IAuthService;

  @Post("/login")
  async login(request: Request) {
    const form = new LoginForm(request.body);
    if(!form.validate()) return jsonResponse(400, form.errors);
    const user = await UserEntity.findOne({ email: form.cleanedData.email });
    if(!user) return jsonResponse(400, { error: "User not found" });
    if(!user.checkPassword(form.cleanedData.password)) return jsonResponse(400, { error: "Incorret credentials" });
    return jsonResponse(
      200, 
      user.toDto(), 
      await this.authService.generateTokenHeader({ id: user.id })
    );
  }

  @Post("/signup")
  async signUp(request: Request) {
    try {
      const form = new SignupForm(request.body);
      if(!form.validate()) return jsonResponse(400, form.errors);
      const user = new UserEntity();
      user.set(form.cleanedData);
      await user.setPassword(form.cleanedData.password);
      await user.save();
      return jsonResponse(
        201, 
        user.toDto(), 
        await this.authService.generateTokenHeader({ id: user.id })
      );
    } catch(e) {
      let error: IIndexable = {
        summary: "Failed to create user"
      };
      if((e as any).writeErrors && (e as any).writeErrors[0].err.errmsg.includes("dup key"))
        error = {
          ...error,
          email: ["Already is used"]
        }
      return jsonResponse(400, error);
    }
  }
} 