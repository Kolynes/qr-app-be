import { IIndexable } from "../../types";


export function rule(item: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor) => {
    Object.defineProperty(target, `Rule${propertyKey as String}`, { value: { item, function: target[propertyKey]} })
  }
}

export class ValidationError extends Error {
  constructor(
    readonly error: string
  ) {
    super(error);
  }
}

export default abstract class Form {

  errors: IIndexable<string[]> = {};
  private rules: IIndexable<Function[]> = {};
  readonly cleanedData: IIndexable<any> = {};

  constructor(
    private readonly data: IIndexable<any>
  ) {
    Object.assign(this.cleanedData, data);
    let descriptors = Object.getOwnPropertyDescriptors(this.constructor.prototype);
    for (var prop in descriptors) {
      if (prop.startsWith("Rule")) {
        if(this.rules[descriptors[prop].value.item] === undefined)
          this.rules[descriptors[prop].value.item] = [];
          this.rules[descriptors[prop].value.item].push(descriptors[prop].value.function.bind(this))
      }
    }
  }

  validate(): boolean {
    let result = true;
    for(let item in this.rules)
      for(let rule in this.rules[item]) {
        let ruleResult = false;
        try {
          this.rules[item][rule](this.data[item]);
          ruleResult = true;
        } catch(e) {
          if(!(e as ValidationError).error)
            throw e;
          else if(this.errors[item] === undefined)
            this.errors[item] = [];
          this.errors[item].push((e as ValidationError).error);
        }
        result = result && ruleResult === true
      }
    return result;
  }
}