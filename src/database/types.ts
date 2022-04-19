import { Collection, CollectionCreateOptions, Db, MongoClient } from "mongodb";
import { ECollections, EViews, IIndexable } from "../types";
import Service from "../utils/services/Service";

export interface IDBService extends Service {
  readonly db: Db;
  readonly collections: IIndexable<Collection>;
  readonly views: IIndexable<Collection>;
  connect(): Promise<MongoClient>;
  saveCollection<T>(name: ECollections, options?: CollectionCreateOptions): void;
  saveView<T>(name: EViews, options?: CollectionCreateOptions): void;
}