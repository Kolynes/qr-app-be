import { EServices } from "../../types";
import Service, { serviceClass } from "../../utils/services/Service";
import { BatchEntity } from "../entities/BatchEntity";
import { IBatchesService } from "../types";

@serviceClass(EServices.batches)
class BatchesService extends Service implements IBatchesService {
  async createBatch(items: string[]): Promise<BatchEntity> {
    const batch = BatchEntity.create({ items: items.map(item => ({ id: item })) });
    await batch.save();
    return batch;
  }
  
}