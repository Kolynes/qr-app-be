import { BaseEntity, Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";

@Entity()
export class VerificationEntity extends BaseEntity {
  @ObjectIdColumn()
  id!: ObjectID;

  @Column({ unique: true })
  userId!: string;

  @Column()
  code!: string;
}