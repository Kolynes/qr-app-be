import { Request } from "express";
import { EEmailTemplate, IMailService } from "../../mail/types";
import { EServices } from "../../types";
import CodeGenerator from "../../utils/code-generator";
import { Controller, Post } from "../../utils/controller";
import { useForm } from "../../utils/form";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { UserEntity } from "../entities/UserEntity";
import { VerificationEntity } from "../entities/VerificationEntity";
import { LoginForm, RecoverAccountForm, ResetPasswordForm, SignupForm } from "../forms";
import { EUserType, IAuthService } from "../types";

@Controller()
export default class AuthController {
  @service(EServices.auth)
  private authService!: IAuthService;

  @service(EServices.mail)
  private mailService!: IMailService;

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

  @Post("/recover_account", [useForm(RecoverAccountForm)])
  async recoverAccountForm(request: Request, form: RecoverAccountForm): Promise<Responder> {
    const { email } = form.cleanedData;
    const user = await UserEntity.findOne({ email });
    if(!user) return jsonResponse(
      404, 
      undefined, 
      new JsonResponseError("This email does not belong to any account.")
    );
    let verificationEntity = await VerificationEntity.findOne({ userId: user.id.toString() });
    if(!verificationEntity) verificationEntity = VerificationEntity.create({ 
      userId: user.id.toString(), 
      code: CodeGenerator.generateCode(6) 
    });
    await verificationEntity.save();
    this.mailService.sendMail(EEmailTemplate.passwordRecoveryCode, { code: verificationEntity.code }, email);
    return jsonResponse(201);
  }

  @Post("/reset_password", [useForm(ResetPasswordForm)])
  async resetPassword(request: Request, form: ResetPasswordForm): Promise<Responder> {
    const { code, email, newPassword } = form.cleanedData;
    const user = await UserEntity.findOne({ email });
    if(!user) return jsonResponse(
      404, 
      undefined, 
      new JsonResponseError("This email does not belong to any account.")
    );
    const verificationEntity = await VerificationEntity.findOne({ code, userId: user.id.toString() });
    if(!verificationEntity) return jsonResponse(
      404, 
      undefined, 
      new JsonResponseError("This code is invalid.")
    );
    user.setPassword(newPassword);
    await user.save();
    await VerificationEntity.delete(verificationEntity);
    return jsonResponse(
      200,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      await this.authService.generateTokenHeader({ id: user.id })
    );
  }
} 