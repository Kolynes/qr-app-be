import { BaseEntity, Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";

class Member {
  @Column()
  id!: string;
}
@Entity()
export class OrganizationEntity extends BaseEntity {
  @ObjectIdColumn()
  id!: ObjectID;

  @Column()
  name!: string;

  @Column()
  owner!: string;

  @Column(type => Member)
  members!: Member[];
}