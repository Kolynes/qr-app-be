import { Entity, Column, BaseEntity, ObjectIdColumn, UpdateDateColumn, CreateDateColumn, DeleteDateColumn, ObjectID } from "typeorm";
import bcrypt from "bcrypt";
import UserDto from "../dtos/UserDto";
import { EUserType } from "../types";
import { ObjectId } from "mongodb";

@Entity()
export class UserEntity extends BaseEntity {

  @ObjectIdColumn()
  id!: ObjectID;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  userType!: EUserType;

  @Column()
  employer!: string;

  @Column()
  password!: string;

  @UpdateDateColumn()
  updateDate?: Date;

  @CreateDateColumn()
  createDate!: Date;

  @DeleteDateColumn()
  deleteDate?: Date;

  async setPassword(newPassword: string) {
    let salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(newPassword, salt);
  }

  async checkPassword(candidate: string): Promise<boolean> {
    const result = await bcrypt.compare(candidate, this.password)
    return result;
  }

  async toDto(): Promise<UserDto> {
    return new UserDto(this);
  }
}
