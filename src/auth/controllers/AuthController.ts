import { Request } from "express";
import { EServices } from "../../types";
import { Controller, Post } from "../../utils/controller";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { UserEntity } from "../entities/UserEntity";
import { LoginForm, SignupForm } from "../forms";
import { IAuthService } from "../types";

@Controller()
export default class AuthController {
  @service(EServices.auth)
  private authService!: IAuthService;

  @Post("/login")
  async login(request: Request): Promise<Responder> {
    const form = new LoginForm(request.body);
    if (!form.validate()) return jsonResponse(400, form.errors);
    const user = await UserEntity.findOne({
      email: form.cleanedData.email,
      deleteDate: undefined
    });
    if (!user)
      return jsonResponse(
        404,
        undefined,
        new JsonResponseError("User not found")
      );
    if (!user.checkPassword(form.cleanedData.password))
      return jsonResponse(
        400,
        undefined,
        new JsonResponseError("Invalid credentials")
      );
    return jsonResponse(
      200,
      await user.toDto(),
      undefined,
      undefined,
      undefined,
      undefined,
      await this.authService.generateTokenHeader({ id: user.id })
    );
  }

  @Post("/signup")
  async signUp(request: Request): Promise<Responder> {
    try {
      const form = new SignupForm(request.body);
      if (!form.validate()) return jsonResponse(400, form.errors);
      const user = UserEntity.create(form.cleanedData);
      await user.setPassword(form.cleanedData.password);
      await user.save();
      return jsonResponse(
        201,
        await user.toDto(),
        undefined,
        undefined,
        undefined,
        undefined,
        await this.authService.generateTokenHeader({ id: user.id })
      );
    } catch (e) {
      if ((e as any).writeErrors && (e as any).writeErrors[0].err.errmsg.includes("dup key"))
        return jsonResponse(
          400,
          undefined,
          new JsonResponseError("Failed to create user", { email: ["Email already in use"] })
        );
      return jsonResponse(
        400,
        undefined,
        new JsonResponseError("Failed to create user")
      );
    }
  }
} 