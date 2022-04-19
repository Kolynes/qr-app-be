import { IDBService } from "../database/types";
import { ECollections, EServices } from "../types";
import ServiceProvider from "../utils/services/ServiceProvider";
import { IUser, IVerification } from "./types";

const dbService = ServiceProvider.getInstance().getService<IDBService>(EServices.database);

dbService.saveCollection<IUser>(ECollections.user);
dbService.saveCollection<IVerification>(ECollections.verification);