import { IDBService } from "../database/types";
import { ECollections, EServices } from "../types";
import ServiceProvider from "../utils/services/ServiceProvider";
import { IBatch } from "./types";

const dbService = ServiceProvider.getInstance().getService<IDBService>(EServices.database);

dbService.saveCollection<IBatch>(ECollections.batch);