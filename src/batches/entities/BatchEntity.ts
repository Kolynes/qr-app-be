import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, ObjectID, ObjectIdColumn, UpdateDateColumn } from "typeorm";
import BatchDto from "../dtos/BatchDto";

class Item {
  @Column()
  id!: string;
}

@Entity()
export class BatchEntity extends BaseEntity {
  @ObjectIdColumn()
  id!: ObjectID;

  @Column()
  organization!: string;

  @Column(type => Item)
  items!: Item[];

  @UpdateDateColumn()
  updateDate?: Date;

  @CreateDateColumn()
  createDate!: Date;

  @DeleteDateColumn()
  deleteDate?: Date;

  async toDto(): Promise<BatchDto> {
    const dto = new BatchDto(this);
    await dto.setItems(this.items.map(item => item.id));
    return dto;
  }
}