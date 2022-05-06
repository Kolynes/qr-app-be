import { mix } from "class-mixins";
import { ObjectId } from "mongodb";
import { OrganizationIdForm } from "../common/forms";
import Form, { rule, ValidationError } from "../utils/form";
import { rangeRule, requiredLengthRule, requiredRule } from "../utils/form/rules";

@mix(OrganizationIdForm)
export class DirectoryLikeForm extends Form {
  @rule("folder")
  checkFolderId(folder?: string): void {
    if(folder) {
      requiredLengthRule(folder, 24, 24);
      try {
        this.cleanedData.folder = new ObjectId(folder);
      } catch (e) {
        throw new ValidationError((e as Object).toString());
      }
    }
  }
}

export interface FolderCreateForm extends OrganizationIdForm, DirectoryLikeForm {}
@mix(OrganizationIdForm, DirectoryLikeForm)
export class FolderCreateForm extends Form {
  @rule("name")
  checkName(name: string) {
    requiredRule(name);
  }

}

export interface ItemCreateForm extends OrganizationIdForm, DirectoryLikeForm {}
@mix(OrganizationIdForm, DirectoryLikeForm)
export class ItemCreateForm extends Form {
  @rule("numberOfItems")
  checkNumberOfItems(numberOfItems: number) {
    rangeRule(numberOfItems, 1);
  }
}

export class ItemsUpdateForm extends Form {
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

export class FolderUpdateForm extends Form {
  whitelist: string[] = [
    "name",
    "color",
  ];
}

export class FolderItemsForm extends Form {
  @rule("items")
  checkItems(items: string[]) {
    const ids = [];
    for(let item of items) {
      requiredLengthRule(item, 24, 24);
      try {
        ids.push(new ObjectId(item));
      } catch(e) {
        throw new ValidationError((e as Object).toString());
      }
    }
    this.cleanedData.items = ids;
  }
}

@mix(DirectoryLikeForm)
export class DirectorySearchForm extends Form {

}