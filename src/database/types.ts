import { Collection, Db, MongoClient } from "mongodb";
import { IIndexable } from "../types";
import Service from "../utils/services/Service";

export interface IDBService extends Service {
  readonly db: Db;
  readonly connection: MongoClient;
  readonly collections: IIndexable<Collection>;
  connect(): Promise<MongoClient>;
  disconnect(): Promise<void>;
}