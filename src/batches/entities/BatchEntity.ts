import { BaseEntity, Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";

@Entity()
export class BatchEntity extends BaseEntity {
  @ObjectIdColumn()
  id!: ObjectID;

  @Column()
  numberOfItems!: number;
}