import Service from "../utils/services/Service";
import { BatchEntity } from "./entities/BatchEntity";

export interface IBatchesService extends Service {
  createBatch(numberOfItems: number): Promise<BatchEntity>;
}