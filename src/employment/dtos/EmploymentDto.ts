import { UserEntity } from "../../auth/entities/UserEntity";
import UserDto from "../../auth/dtos/UserDto";
import { EmploymentEntity } from "../entities/EmploymentEntity";
import { ObjectID } from "typeorm";

export default class EmploymentDto {
  employee: UserDto;
  employer: UserDto;
  createDate: Date;
  updateDate?: Date;
  deleteDate?: Date;
  id: ObjectID;

  constructor(employee: UserEntity, employer: UserEntity, employment: EmploymentEntity) {
    this.employee = new UserDto(employee);
    this.employer = new UserDto(employer);
    this.createDate = employment.createDate;
    this.updateDate = employment.updateDate;
    this.deleteDate = employment.deleteDate;
    this.id = employment.id;
  }
}