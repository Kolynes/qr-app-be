import { ObjectID } from "typeorm";
import { UserEntity } from "../entities/UserEntity";
import { EUserType } from "../types";

export default class UserDto {
  id: ObjectID;
  firstName: string;
  lastName: string;
  email: string;
  userType: EUserType;
  createDate: Date;
  updateDate?: Date;
  deleteDate?: Date;
  
  constructor(user: UserEntity) {
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
    this.id = user.id;
    this.userType = user.userType;
    this.createDate = user.createDate;
    this.updateDate = user.updateDate;
    this.deleteDate = user.deleteDate;
  }
}