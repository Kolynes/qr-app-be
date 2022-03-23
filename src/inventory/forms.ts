import Form, { rule } from "../utils/form";
import { requiredRule } from "../utils/form/rules";

export class ProductForm extends Form {
  @rule("geneticName")
  checkGeneticName(geneticName: string) {
    requiredRule(geneticName);
    this.cleanedData.geneticName = geneticName.trim();
  }
}

export class ProductUpdateForm extends ProductForm {

}

export class FolderForm extends Form {
  @rule("name")
  checkName(name: string) {
    requiredRule(name);
    this.cleanedData.name = name.trim();
  }
}