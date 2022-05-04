import { IDBService } from "../src/database/types";
import { EServices } from "../src/types";
import ServiceProvider from "../src/utils/services/ServiceProvider";

jest.setTimeout(150000)

beforeAll(async () => {
  const dbService = ServiceProvider.getInstance().getService<IDBService>(EServices.database);
  await dbService.connect();
});

afterAll(async () => {
  const dbService = ServiceProvider.getInstance().getService<IDBService>(EServices.database);
  await dbService.db.dropDatabase();
  return await dbService.disconnect();
});