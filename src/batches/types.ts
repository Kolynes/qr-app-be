import Service from "../utils/services/Service";
import { BatchEntity } from "./entities/BatchEntity";

export interface IBatchesService extends Service {
  createBatch(items: string[]): Promise<BatchEntity>;
}