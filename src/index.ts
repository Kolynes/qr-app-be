import "reflect-metadata";
require("dotenv").config()
import "./services";
import "./collections";
import "./views";

import express from "express";
import { registerController } from "./utils/controller";
import bodyParser from "body-parser";

import AuthController from "./auth/controllers/AuthController";
import OrganizationsController from "./organizations/controllers/OrganizationsController";
import InventoryController from "./inventory/controllers/inventoryController";
import BatchesController from "./batches/controllers/BatchesController";
import ServiceProvider from "./utils/services/ServiceProvider";
import { IDBService } from "./database/types";
import { EServices } from "./types";

(async function() {
  const dbService = ServiceProvider.getInstance().getService<IDBService>(EServices.database);
  try {
    await dbService.connect();
  } catch(e) {}
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  registerController(AuthController, app, "/auth");
  registerController(OrganizationsController, app, "/organizations");
  registerController(InventoryController, app, "/inventory");
  registerController(BatchesController, app, "/batches");

  app.listen(process.env.PORT || 3000, () => {
    console.log(`listening on ${process.env.PORT || 3000}`)
  })
})();