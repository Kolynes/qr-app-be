import { Request } from "express";
import { EEmailTemplate, IMailService } from "../../mail/types";
import { ECollections, EServices, EViews } from "../../types";
import CodeGenerator from "../../utils/code-generator";
import { Controller, Post } from "../../utils/controller";
import { useForm } from "../../utils/form";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { LoginForm, RecoverAccountForm, ResetPasswordForm, SignupForm } from "../forms";
import { IAuthService, IUser, IVerification } from "../types";
import { Collection } from "mongodb";
import { collection, view } from "../../database";

@Controller()
export default class AuthController {
  @service(EServices.auth)
  private authService!: IAuthService;

  @service(EServices.mail)
  private mailService!: IMailService;

  @collection(ECollections.user)
  private User!: Collection<IUser>;

  @view(EViews.user)
  private UserView!: Collection<IUser>;

  @collection(ECollections.verification)
  private Verification!: Collection<IVerification>;

  @Post("/login", [useForm(LoginForm)])
  async login(request: Request, form: LoginForm): Promise<Responder> {
    const user = await this.User.findOne({
      email: form.cleanedData.email,
      deleteDate: undefined
    }) as IUser;
    if (!user)
      return jsonResponse({
        status: 404,
        error: new JsonResponseError("User not found")
      });
    if (!await this.authService.checkPassword(user, form.cleanedData.password))
      return jsonResponse({
        status: 400,
        error: new JsonResponseError("Invalid credentials")
      });
    return jsonResponse({
      status: 200,
      data: await this.UserView.findOne({ id: user._id}!),
      headers: await this.authService.generateTokenHeader({ id: user._id })
    });
  }

  @Post("/signup", [useForm(SignupForm)])
  async signUp(request: Request, form: SignupForm): Promise<Responder> {
    try {
      const user = form.cleanedData as IUser;
      await this.authService.setPassword(user, form.cleanedData.password);
      await this.User.insertOne(user);
      this.mailService.sendMail(
        EEmailTemplate.signUpNote, 
        user, 
        user.email
      );
      return jsonResponse({
        status: 201,
        data: await this.UserView.findOne({ id: user._id }),
        headers: await this.authService.generateTokenHeader({ id: user._id })
      });
    } catch (e) {
      if ((e as any).toString().includes("dup key"))
        return jsonResponse({
          status: 400,
          error: new JsonResponseError("Failed to create user", { email: ["Email already in use"] })
        });
      return jsonResponse({
        status: 400,
        error: new JsonResponseError("Failed to create user")
      });
    }
  }

  @Post("/recover_account", [useForm(RecoverAccountForm)])
  async recoverAccountForm(request: Request, form: RecoverAccountForm): Promise<Responder> {
    const { email } = form.cleanedData;
    const user = await this.User.findOne({ email });
    if(!user) return jsonResponse({
      status: 404, 
      error: new JsonResponseError("This email does not belong to any account.")
    });
    let verification = await this.Verification.findOne({ userId: user._id }) as IVerification;
    if(!verification){
      verification = {
        userId: user._id, 
        code: CodeGenerator.generateCode(6).toUpperCase()
      } as IVerification;
      await this.Verification.insertOne(verification);
    } 
    this.mailService.sendMail(
      EEmailTemplate.passwordRecoveryCode, 
      { code: verification.code }, 
      email
    );
    return jsonResponse({status: 201});
  }

  @Post("/reset_password", [useForm(ResetPasswordForm)])
  async resetPassword(request: Request, form: ResetPasswordForm): Promise<Responder> {
    const { code, email, newPassword } = form.cleanedData;
    const user = await this.User.findOne({ email }) as IUser;
    if(!user) return jsonResponse({
      status: 404, 
      error: new JsonResponseError("This email does not belong to any account.")
    });
    const verification = await this.Verification.findOne({ code, userId: user._id });
    if(!verification) return jsonResponse({
      status: 404, 
      error: new JsonResponseError("This code is invalid.")
    });
    await this.authService.setPassword(user, newPassword);
    await this.User.updateOne({ _id: user._id }, user);
    await this.Verification.deleteOne(verification._id!);
    return jsonResponse({
      status: 200,
      headers: await this.authService.generateTokenHeader({ id: user._id })
    });
  }
} 