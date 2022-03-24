import Form, { rule } from "../utils/form";
import { rangeRule, requiredRule } from "../utils/form/rules";

export class ItemForm extends Form {
  @rule("numberOfItems")
  checkNumberOfItems(numberOfItems: number) {
    rangeRule(numberOfItems, 1);
    this.cleanedData.numberOfItems = numberOfItems; 
  }
}

export class FolderForm extends Form {
  @rule("name")
  checkName(name: string) {
    requiredRule(name);
    this.cleanedData.name = name.trim();
  }
}