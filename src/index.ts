require("dotenv").config()
import "reflect-metadata";
import "./services";
import app from "./app";
import ServiceProvider from "./utils/services/ServiceProvider";
import { IDBService } from "./database/types";
import { EServices } from "./types";

const dbService = ServiceProvider.getInstance().getService<IDBService>(EServices.database);
try {
  dbService.connect().then(async () => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`listening on ${process.env.PORT || 3000}`)
    })
  });
} catch (e) {
  console.log(e)
}