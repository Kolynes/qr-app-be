import { UserEntity } from "../entities/UserEntity";

export default class UserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createDate: Date;
  updateDate?: Date;
  deleteDate?: Date;
  
  constructor(user: UserEntity) {
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
    this.id = user.id;
    this.createDate = user.createDate;
    this.updateDate = user.updateDate;
    this.deleteDate = user.deleteDate;
  }
}