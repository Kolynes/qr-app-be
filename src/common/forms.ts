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