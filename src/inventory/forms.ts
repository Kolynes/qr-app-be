import { ObjectId } from "mongodb";
import { OrganizationIdForm } from "../common/forms";
import Form, { rule, ValidationError } from "../utils/form";
import { existsInRule, rangeRule, requiredLengthRule, requiredRule } from "../utils/form/rules";
import { QRCodeTypes } from "./constants";
import { EQRCodeType } from "./types";

export class ItemForm extends OrganizationIdForm {
  @rule("numberOfItems")
  checkNumberOfItems(numberOfItems: number) {
    rangeRule(numberOfItems, 1);
  }

  @rule("type")
  checkType(type: EQRCodeType) {
    existsInRule(type, QRCodeTypes);
  }

  @rule("totalWeight")
  checkWeight(totalWeight?: number) {
    if(totalWeight) rangeRule(totalWeight, 0);
  }
}

export class ItemUpdateForm extends Form {
  blacklist: string[] = [
    "id",
    "organization",
    "type",
    "updateDate",
    "createDate",
    "deleteDate",
  ];
}

export class FolderItemsForm extends Form {
  @rule("items")
  checkItems(items: string[]) {
    const ids = [];
    for(let item of items) {
      requiredLengthRule(item, 24, 24);
      try {
        ids.push(ObjectId(item));
      } catch(e) {
        throw new ValidationError((e as Object).toString());
      }
    }
    this.cleanedData.items = ids;
  }
}

export class FolderForm extends OrganizationIdForm {
  @rule("name")
  checkName(name: string) {
    requiredRule(name);
  }
}