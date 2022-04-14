import { ObjectID } from "typeorm";
import { ItemEntity } from "../../inventory/entities/ItemEntity";
import { BatchEntity } from "../entities/BatchEntity";

export default class BatchDto {
  id: ObjectID;
  organization: string;
  items!: ItemEntity[];

  constructor(batch: BatchEntity) {
    this.id = batch.id;
    this.organization = batch.organization;
  }

  async setItems(items: string[]) {
    this.items = await Promise.all(
      items.map(
        async item => (await ItemEntity.findOne(item))!
      )
    );
  }
} 