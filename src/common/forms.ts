import { ObjectId } from "mongodb";
import Form, { rule, ValidationError } from "../utils/form";
import { requiredLengthRule } from "../utils/form/rules";

export class ObjectIDForm extends Form {
  @rule("id")
  checkObjectID(id: string) {
    requiredLengthRule(id, 24, 24);
    try {
      this.cleanedData.id = ObjectId(id);
    } catch (e) {
      throw new ValidationError((e as Object).toString());
    }
  }
}

export class OrganizationIdForm extends Form {
  @rule("organization")
  checkOrganizationId(organization: string) {
    requiredLengthRule(organization, 24, 24);
    try {
      this.cleanedData.organization = ObjectId(organization);
    } catch (e) {
      throw new ValidationError((e as Object).toString());
    }
  }
}