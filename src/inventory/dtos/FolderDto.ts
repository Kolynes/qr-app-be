import { ObjectID } from "typeorm";
import { FolderEntity } from "../entities/FolderEntity";
import { ItemEntity } from "../entities/ItemEntity";

export default class FolderDto {
  id: ObjectID;
  name: string;
  owner: string;
  createDate: Date;
  updateDate?: Date;
  deleteDate?: Date;
  items: ItemEntity[];

  constructor(folder: FolderEntity, items: ItemEntity[]) {
    this.id = folder.id;
    this.name = folder.name;
    this.owner = folder.owner;
    this.createDate = folder.createDate;
    this.updateDate = folder.updateDate;
    this.deleteDate = folder.deleteDate;
    this.items = items;
  }
}