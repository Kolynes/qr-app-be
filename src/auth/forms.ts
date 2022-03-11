import Form, { rule } from "../utils/form";
import { emailRule, requiredRule } from "../utils/form/rules";

export class LoginForm extends Form {
  @rule("email")
  checkEmail(email: string) {
    requiredRule(email)
    emailRule(email.trim());
    this.cleanedData.email = email.trim()
  }

  @rule("password")
  checkPassword(password: string) {
    requiredRule(password);
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
    this.cleanedData.email = email.trim()
  }

  @rule("password")
  checkPassword(password: string) {
    requiredRule(password);
  }
}