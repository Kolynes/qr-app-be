import { MongoClient, Collection, Db } from "mongodb";
import { EServices, IIndexable } from "../../types";
import Service, { serviceClass } from "../../utils/services/Service";
import { IDBService } from "../types";

@serviceClass(EServices.database)
class DBService extends Service implements IDBService {
  connection!: MongoClient;
  collections: IIndexable<Collection> = {};
  private _db!: Db;
  
  get db() {
    return this._db; 
  }
  
  async connect(): Promise<MongoClient> {
    if(!this.connection) {
      this.connection = await new MongoClient(process.env.TYPEORM_URL!, { useUnifiedTopology: true }).connect();
      this._db = this.connection.db();
      const collections = await this._db.collections();
      for(let collection of collections) this.collections[collection.collectionName] = collection;
    }
    return this.connection;
  }

  async disconnect() {
    await this.connection.close()
  }
}
