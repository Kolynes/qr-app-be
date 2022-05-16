import { mix } from "class-mixins";
import { ObjectId } from "mongodb";
import { ObjectIDsForm, OrganizationIdForm } from "../common/forms";
import { IIndexable } from "../types";
import Form, { rule, ValidationError } from "../utils/form";
import { notNullRule, rangeRule, requiredLengthRule, requiredRule } from "../utils/form/rules";

export interface DirectoryLikeForm extends OrganizationIdForm {}
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

export class FolderUpdateForm extends Form {
  whitelist: string[] = [
    "name",
    "color",
  ];
}

export interface DirectorySearchForm extends DirectoryLikeForm {}
@mix(DirectoryLikeForm)
export class DirectorySearchForm extends Form {}

export interface ItemsUpdateForm extends ObjectIDsForm {}
@mix(ObjectIDsForm)
export class ItemsUpdateForm extends Form {
  @rule("item")
  checkItem(item: IIndexable) {
    notNullRule(item);
  }

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