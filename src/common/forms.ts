import { ObjectId } from "mongodb";
import Form, { rule, ValidationError } from "../utils/form";
import { requiredLengthRule } from "../utils/form/rules";

export class ObjectIDForm extends Form {
  @rule("id")
  checkObjectID(id: string) {
    requiredLengthRule(id, 24, 24);
    try {
      this.cleanedData.id = new ObjectId(id);
    } catch (e) {
      throw new ValidationError((e as Object).toString());
    }
  }
}

export class ObjectIDsForm extends Form {
  @rule("ids")
  checkItems(ids: string[]) {
    const idObjects = [];
    for(let id of ids) {
      requiredLengthRule(id, 24, 24);
      try {
        idObjects.push(new ObjectId(id));
      } catch(e) {
        throw new ValidationError((e as Object).toString());
      }
    }
    this.cleanedData.ids = idObjects;
  }
}

export class OrganizationIdForm extends Form {
  @rule("organization")
  checkOrganizationId(organization: string) {
    requiredLengthRule(organization, 24, 24);
    try {
      this.cleanedData.organization = new ObjectId(organization);
    } catch (e) {
      throw new ValidationError((e as Object).toString());
    }
  }
}

export class PageForm extends Form {
  @rule("page")
  checkPage(page: string) {
    if(!page) return;
    if(isNaN(parseInt(page))) throw new ValidationError("invalid page number")
    this.cleanedData.page = parseInt(page)
  }

  @rule("size")
  checkSize(size: string) {
    if(!size) return;
    if(isNaN(parseInt(size))) throw new ValidationError("invalid size")
    this.cleanedData.size = parseInt(size)
  }
}