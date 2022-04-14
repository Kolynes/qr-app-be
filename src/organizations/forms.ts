import { ObjectId } from "mongodb";
import Form, { rule, ValidationError } from "../utils/form";
import { requiredLengthRule } from "../utils/form/rules";

export class OrganizationMembersForm extends Form {
  @rule("members")
  checkMembers(members: string[]) {
    if(members && members.length > 0) {
      for(let member of members) {
        requiredLengthRule(member, 24, 24);
        try {
          ObjectId(member);
        } catch(e) {
          throw new ValidationError((e as Object).toString());
        }
      }
    }
  }
}

export class OrganizationCreateForm extends OrganizationMembersForm {
  @rule("name")
  checkName(name: string) {
    requiredLengthRule(name, 3);
    this.cleanedData.name = name.trim();
  }
}