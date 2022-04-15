import { ObjectID } from "typeorm";
import { DirectoryLikeEntity } from "../../inventory/entities/DirectoryLikeEntity";
import { BatchEntity } from "../entities/BatchEntity";

export default class BatchDto {
  id: ObjectID;
  organization: string;
  items!: DirectoryLikeEntity[];

  private constructor(batch: BatchEntity) {
    this.id = batch.id;
    this.organization = batch.organization;
  }

  static async create(batch: BatchEntity): Promise<BatchDto> {
    const dto = new BatchDto(batch);
    dto.items = await Promise.all(
      batch.items.map(
        async item => (await DirectoryLikeEntity.findOne(item.id))!
      )
    );
    return dto;
  }
} 