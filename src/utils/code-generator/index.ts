export default abstract class CodeGenerator {
  static choice<T>(options: T[]): T {
    let index = Math.round(Math.random() * (options.length - 1))
    return options[index];
  }

  static range(length: number): number[] {
    const array = [];
    for (let i = 0; i < length; i++)
      array.push(i);
    return array;
  }

  static generateCode(length: number): string {
    let code = "";
    for(let i = 0; i < length; i++) 
      code += this.choice([
        String.fromCharCode(this.choice(this.range(26)) + 0x41),
        String.fromCharCode(this.choice(this.range(26)) + 0x61),
        String.fromCharCode(this.choice(this.range(10)) + 0x30),
      ])
    return code;
  }

  static generateNumericCode(length: number): string {
    let code = "";
    for(let i = 0; i < length; i++) 
      code += String.fromCharCode(this.choice(this.range(10)) + 0x30);
    return code;
  }
}