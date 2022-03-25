import { ObjectId } from "mongodb";
import Form, { rule, ValidationError } from "../utils/form";
import { existsInRule, rangeRule, requiredLengthRule } from "../utils/form/rules";
import { QRCodeTypes } from "./constants";
import { EQRCodeType } from "./types";

export class ItemForm extends Form {
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

export class FolderForm extends Form {
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