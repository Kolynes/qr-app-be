import { ObjectId } from "mongodb";
import { ObjectID } from "typeorm";
import { DirectoryLikeEntity } from "../../inventory/entities/DirectoryLikeEntity";
import { BatchEntity } from "../entities/BatchEntity";

export default class BatchDto {
  items!: DirectoryLikeEntity[];

  private constructor(batch: BatchEntity) {
    Object.assign(this, batch);
  }

  static async create(batch: BatchEntity): Promise<BatchDto> {
    const dto = new BatchDto(batch);
    dto.items = await DirectoryLikeEntity.find({
      where: {
        _id: { $in: batch.items.map(item => ObjectId(item.id)) }
      }
    })
    return dto;
  }
} 