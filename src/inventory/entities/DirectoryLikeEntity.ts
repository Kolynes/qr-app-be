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
import { EDirectoryType, Item } from "../types";

@Entity()
export class DirectoryLikeEntity extends BaseEntity {
  @ObjectIdColumn()
  id!: ObjectID;

  @Column()
  organization!: string;

  @Column()
  directoryType!: EDirectoryType;

  @Column(type => Item)
  item?: Item;

  @Column()
  batch?: string;

  @Column()
  name?: string;

  @Column()
  color?: string;

  @Column()
  folder?: string;

  @UpdateDateColumn()
  updateDate?: Date;

  @CreateDateColumn()
  createDate!: Date;

  @DeleteDateColumn()
  deleteDate?: Date;
}