import { ObjectId } from "mongodb";
import { 
  BaseEntity, 
  Column, 
  CreateDateColumn, 
  DeleteDateColumn, 
  Entity, 
  ObjectID, 
  ObjectIdColumn, 
  UpdateDateColumn 
} from "typeorm";
import { IIndexable } from "../../types";

@Entity()
export class ItemEntity extends BaseEntity {
  
  @ObjectIdColumn()
  id!: ObjectID;

  @Column()
  owner!: string;

  @Column()
  folder!: string;

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
  minLevel?: string;

  @Column()
  waterContent?: string;

  @Column()
  ingredientsByWeight?: IIndexable<number>;

  @Column()
  parent?: string;

  @Column()
  inventoryUsed?: string[];

  @UpdateDateColumn()
  updateDate?: Date;

  @CreateDateColumn()
  createDate!: Date;

  @DeleteDateColumn()
  deleteDate?: Date;
  
}