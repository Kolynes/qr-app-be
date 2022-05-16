import { ValidationError } from ".";

export function emailRule(email: string) {
  if (email && !/^[a-zA-Z0-9\-_]{3,}@[a-zA-Z0-9\-_]{3,}(\.[a-zA-Z0-9]{2,}){1,}$/.test(email.trim()))
    throw new ValidationError("invalid email");
  else if (!email.trim()) throw new ValidationError("this field is required");
}

export function requiredRule(value?: string) {
  if (!value || !(value.trim())) throw new ValidationError("this field is required");
}

export function notNullRule(value: any) {
  if(!value) throw new ValidationError("this field is required"); 
}

export function requiredLengthRule(value: string, requiredMinLength: number = - Infinity, requiredMaxLength: number = Infinity) {
  if (value) {
    if (value.length < requiredMinLength)
      throw new ValidationError(`this field should be ${requiredMinLength} or more characters long`);
    else if (value.length > requiredMaxLength)
      throw new ValidationError(`this field should be no more than ${requiredMaxLength} characters long`);
  }
  else throw new ValidationError("this field is required");
}

export function rangeRule(value: number, min: number = -Infinity, max: number = Infinity) {
  if (value) {
    if (value < min)
      throw new ValidationError(`this field should be no less than ${min}`);
    else if (value > max)
      throw new ValidationError(`this field should be no more than ${max}`);
  }
  else throw new ValidationError("this field is required");
}

export function existsInRule<T>(value: T, array: T[]) {
  const index = array.findIndex(e => e == value);
  if(index == -1) throw new ValidationError("this field is invalid");
}

export function isArrayRule(value: any) {
  if(value !instanceof Array) throw new ValidationError("a list is required");
}