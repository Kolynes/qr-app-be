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
import { EDirectoryType } from "../types";

@Entity()
export class DirectoryLikeEntity extends BaseEntity {
  @ObjectIdColumn()
  id!: ObjectID;

  @Column()
  organization!: string;

  @Column()
  directoryType!: EDirectoryType;

  @Column()
  item?: string;

  @Column()
  name?: string;

  @Column()
  parent?: string;

  @UpdateDateColumn()
  updateDate?: Date;

  @CreateDateColumn()
  createDate!: Date;

  @DeleteDateColumn()
  deleteDate?: Date;
}