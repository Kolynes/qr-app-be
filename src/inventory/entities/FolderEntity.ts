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

@Entity()
export class FolderEntity extends BaseEntity {
  
  @ObjectIdColumn()
  id!: ObjectID;

  @Column()
  name!: string;

  @Column(() => ObjectId)
  owner!: ObjectID;

  @UpdateDateColumn()
  updateDate?: Date;

  @CreateDateColumn()
  createDate!: Date;

  @DeleteDateColumn()
  deleteDate?: Date;

}