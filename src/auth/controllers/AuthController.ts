import { Request } from "express";
import { EServices } from "../../types";
import { Controller, Post } from "../../utils/controller";
import { useForm } from "../../utils/form";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { UserEntity } from "../entities/UserEntity";
import { LoginForm, SignupForm } from "../forms";
import { EUserType, IAuthService } from "../types";

@Controller()
export default class AuthController {
  @service(EServices.auth)
  private authService!: IAuthService;

  @Post("/login", [useForm(LoginForm)])
  async login(request: Request, form: LoginForm): Promise<Responder> {
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
    if (! await user.checkPassword(form.cleanedData.password))
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

  @Post("/signup", [useForm(SignupForm)])
  async signUp(request: Request, form: SignupForm): Promise<Responder> {
    try {
      const user = UserEntity.create(form.cleanedData);
      user.userType = EUserType.single;
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