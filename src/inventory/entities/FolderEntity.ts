import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, ObjectID, ObjectIdColumn, UpdateDateColumn } from "typeorm";
import FolderDto from "../dtos/FolderDto";
import { ItemEntity } from "./ItemEntity";

@Entity()
export class FolderEntity extends BaseEntity {

  @ObjectIdColumn()
  id!: ObjectID;

  @Column()
  name!: string;

  @Column()
  owner!: string;

  @UpdateDateColumn()
  updateDate?: Date;

  @CreateDateColumn()
  createDate!: Date;

  @DeleteDateColumn()
  deleteDate?: Date;

  async toDto(): Promise<FolderDto> {
    const items = await ItemEntity.find({
      where: { 
        folder: this.id.toString(), 
        deleteDate: undefined 
      }
    });
    return new FolderDto(this, items);
  }
}