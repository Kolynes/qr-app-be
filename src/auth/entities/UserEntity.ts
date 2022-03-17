import { Entity, Column, BaseEntity, ObjectIdColumn, UpdateDateColumn, CreateDateColumn, DeleteDateColumn } from "typeorm";
import bcrypt from "bcrypt";
import UserDto from "../dtos/UserDto";

@Entity()
export class UserEntity extends BaseEntity {

  @ObjectIdColumn()
  id!: string;

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
    return await bcrypt.compare(candidate, this.password)
  }

  async toDto(): Promise<UserDto> {
    return new UserDto(this);
  }
}
