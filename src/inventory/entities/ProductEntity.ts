import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, ObjectID, ObjectIdColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class ItemEntity extends BaseEntity {
  
  @ObjectIdColumn()
  id!: ObjectID;

  @Column()
  name!: string;

  @Column()
  quantity!: number;

  @UpdateDateColumn()
  updateDate?: Date;

  @CreateDateColumn()
  createDate!: Date;

  @DeleteDateColumn()
  deleteDate?: Date;
  
}