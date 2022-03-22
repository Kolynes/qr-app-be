import { Entity, Column, BaseEntity, ObjectIdColumn, UpdateDateColumn, CreateDateColumn, DeleteDateColumn, ObjectID } from "typeorm";
import bcrypt from "bcrypt";
import UserDto from "../dtos/UserDto";

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
    console.log(this.password);
  }

  async checkPassword(candidate: string): Promise<boolean> {
    console.log(candidate)
    const result = await bcrypt.compare(candidate, this.password)
    console.log(result)
    return result;
  }

  async toDto(): Promise<UserDto> {
    return new UserDto(this);
  }
}
