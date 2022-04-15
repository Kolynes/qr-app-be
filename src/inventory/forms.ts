import { ObjectId } from "mongodb";
import { OrganizationIdForm } from "../common/forms";
import Form, { rule, ValidationError } from "../utils/form";
import { rangeRule, requiredLengthRule, requiredRule } from "../utils/form/rules";

export class DirectoryLikeForm extends OrganizationIdForm {
  @rule("folder")
  checkFolderId(folder?: string): void {
    if(folder) {
      requiredLengthRule(folder, 24, 24);
      try {
        this.cleanedData.folder = ObjectId(folder);
      } catch (e) {
        throw new ValidationError((e as Object).toString());
      }
    }
  }
}

export class FolderCreateForm extends DirectoryLikeForm {
  @rule("name")
  checkName(name: string) {
    requiredRule(name);
  }
}

export class ItemCreateForm extends DirectoryLikeForm {
  @rule("numberOfItems")
  checkNumberOfItems(numberOfItems: number) {
    rangeRule(numberOfItems, 1);
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