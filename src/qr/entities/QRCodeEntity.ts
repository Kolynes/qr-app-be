import { BaseEntity, Entity, ObjectIdColumn } from "typeorm";

@Entity()
export default class QRCodeEntity extends BaseEntity {
  @ObjectIdColumn()
  id!: number;
}