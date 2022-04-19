import { MongoClient, Collection, Db, CollectionCreateOptions } from "mongodb";
import { ECollections, EServices, EViews, IIndexable } from "../../types";
import Service, { serviceClass } from "../../utils/services/Service";
import { IDBService } from "../types";

@serviceClass(EServices.database)
class DBService extends Service implements IDBService {
  collections: IIndexable<Collection<any>> = {};
  views: IIndexable<Collection<any>> = {};
  private connection!: MongoClient;
  private _db!: Db;
  private _collections: IIndexable<() => Promise<Collection>> = {};
  private _views: IIndexable<() => Promise<Collection>> = {};
  
  get db() {
    return this._db; 
  }
  
  async connect(): Promise<MongoClient> {
    if(!this.connection) {
      this.connection = new MongoClient(process.env.TYPEORM_URL!);
      await this.connection.connect();
      this._db = this.connection.db();
      this._db.createCollection("");
      for(let collection in this._collections) 
        this.collections[collection] = await this._collections[collection]();
      for(let view in this.views)
        this.views[view] = await this._views[view]();
    }
    return this.connection;
  }
  
  saveCollection<T>(name: ECollections, options?: CollectionCreateOptions): void {
    this._collections[name] = async () => {
      try {
        return await this._db.createCollection<T>(name, options)
      } catch(e) {
        return this._db.collection<T>(name);
      }
    };
  }
  
  saveView<T>(name: EViews, options?: CollectionCreateOptions): void {
    this._views[name] = async () => {
      try {
        return await this._db.createCollection<T>(name, options)
      } catch(e) {
        return this._db.collection<T>(name);
      }
    };
  }
}
