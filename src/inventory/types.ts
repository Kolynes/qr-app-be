import { Column } from "typeorm";
import Service from "../utils/services/Service";

export enum EQRCodeType {
  grain = "grain",
  allInOne = "all in one",
  genetic = "genetic",
  substrate = "substrate"
}

export interface IQRService extends Service {
  createQRCode(id: string, ownerId: string): Promise<string>;
}

export enum EDirectoryType {
  folder = "folder",
  item = "item"
}

export class Item {

  @Column()
  type!: EQRCodeType;

  @Column()
  totalWeight!: number;

  @Column()
  geneticName!: string;
  
  @Column()
  history?: string;
  
  @Column()
  tags?: string[];
  
  @Column()
  cooked?: number;
  
  @Column()
  unitOfMeasure?: string;
  
  @Column()
  sterilizationDevice?: string;
  
  @Column()
  comments?: string;
  
  @Column()
  ingredientsByWeight?: string;
  
  @Column()
  parent?: string;
  
}