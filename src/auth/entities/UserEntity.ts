import { Entity, Column, BaseEntity, ObjectIdColumn } from "typeorm";
import bcrypt from "bcrypt";
import { IIndexable } from "../../types";
import UserDto from "../dtos/UserDto";

@Entity()
export class UserEntity extends BaseEntity {

  @ObjectIdColumn()
  id!: number;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  async setPassword(newPassword: string) {
    let salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(newPassword, salt);
    console.log(this.password);
  }

  async checkPassword(candidate: string): Promise<boolean> {
    return await bcrypt.compare(candidate, this.password)
  }

  set(data: IIndexable) {
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.email = data.email;
  }

  toDto() {
    return new UserDto(this);
  }
}
