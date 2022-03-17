import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, ObjectIdColumn, UpdateDateColumn } from "typeorm";
import EmploymentDto from "../dtos/EmploymentDto";
import { UserEntity } from "../../auth/entities/UserEntity";

@Entity()
export class EmploymentEntity extends BaseEntity {
  
  @ObjectIdColumn()
  id!: string;

  @Column()
  employerId!: string;

  @Column()
  employeeId!: string;

  @UpdateDateColumn()
  updateDate?: Date;

  @CreateDateColumn()
  createDate!: Date;

  @DeleteDateColumn()
  deleteDate?: Date;

  async toDto(): Promise<EmploymentDto> {
    const employee = await UserEntity.findOneOrFail({ id: this.employeeId });
    const employer = await UserEntity.findOneOrFail({ id: this.employerId });
    return new EmploymentDto(employee, employer, this);
  }
}