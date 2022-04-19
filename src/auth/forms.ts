import { mix } from "class-mixins";
import Form, { rule, ValidationError } from "../utils/form";
import { emailRule, requiredLengthRule, requiredRule } from "../utils/form/rules";

export class LoginForm extends Form {
  @rule("email")
  checkEmail(email: string) {
    requiredRule(email)
    emailRule(email.trim());
    this.cleanedData.email = email.trim().toLowerCase();
  }

  @rule("password")
  checkPassword(password: string) {
    requiredLengthRule(password, 5);
  }
}

export class SignupForm extends Form {
  @rule("firstName")
  checkFirstName(firstName: string) {
    requiredRule(firstName);
    this.cleanedData.firstName = firstName.trim();
  }

  @rule("lastName")
  checkLastName(lastName: string) {
    requiredRule(lastName);
    this.cleanedData.lastName = lastName.trim();
  }

  @rule("email")
  checkEmail(email: string) {
    requiredRule(email)
    emailRule(email.trim());
    this.cleanedData.email = email.trim().toLowerCase();
  }

  @rule("password")
  checkPassword(password: string) {
    requiredRule(password);
    this.cleanedData.password = password.trim();
  }
}

export class RecoverAccountForm extends Form {
  @rule("email")
  checkEmail(email: string) {
    emailRule(email);
    this.cleanedData.email = email.trim().toLowerCase();
  }
}

@mix(RecoverAccountForm)
export class ResetPasswordForm extends Form {
  @rule("code")
  checkCode(code: string) {
    requiredLengthRule(code, 6, 6);
    this.cleanedData.code = code.trim();
  }

  @rule("newPassword")
  checkNewPassword(newPassword: string) {
    requiredLengthRule(newPassword, 5);
    this.cleanedData.newPassword = newPassword.trim();
  }

  @rule("confirmPassword")
  checkConfirmPassword(confirmPassword: string) {
    requiredLengthRule(confirmPassword, 5);
    if(confirmPassword.trim() != this.cleanedData.newPassword) 
      throw new ValidationError("The passwords do not match")
    this.cleanedData.confirmPassword = confirmPassword.trim();
  }
}

