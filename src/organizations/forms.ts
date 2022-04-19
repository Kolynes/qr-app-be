import { mix } from "class-mixins";
import { ObjectId } from "mongodb";
import Form, { rule, ValidationError } from "../utils/form";
import { emailRule, notNullRule, requiredLengthRule } from "../utils/form/rules";
import { INewMember } from "./types";

export class OrganizationMembersForm extends Form {
  @rule("members")
  checkMembers(members: string[]) {
    notNullRule(members);
    const ids = [];
    if(members.length > 0) {
      for(let member of members) {
        requiredLengthRule(member, 24, 24);
        try {
          ids.push(new ObjectId(member));
        } catch(e) {
          throw new ValidationError((e as Object).toString());
        }
      }
      this.cleanedData.members = ids;
    }
  }
}

export class OrganizationAddMembersForm extends Form {
  @rule("newMembers")
  checkNewMembers(newMembers: INewMember[]) {
    notNullRule(newMembers);
    for(let newMember of newMembers) {
      emailRule(newMember.email);
      newMember.email = newMember.email.trim().toLowerCase();
      newMember.firstName = newMember.firstName && newMember.firstName.trim();
      newMember.lastName = newMember.lastName && newMember.lastName.trim();
    }
  }
}

@mix(OrganizationMembersForm)
export class OrganizationCreateForm extends Form {
  @rule("name")
  checkName(name: string) {
    requiredLengthRule(name, 3);
    this.cleanedData.name = name.trim();
  }
}