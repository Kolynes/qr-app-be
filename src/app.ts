import express from "express";
import { registerController } from "./utils/controller";
import bodyParser from "body-parser";

import AuthController from "./auth/controllers/AuthController";
import OrganizationsController from "./organizations/controllers/OrganizationsController";
import InventoryController from "./inventory/controllers/inventoryController";
import BatchesController from "./batches/controllers/BatchesController";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

registerController(AuthController, app, "/auth");
registerController(OrganizationsController, app, "/organizations");
registerController(InventoryController, app, "/inventory");
registerController(BatchesController, app, "/batches");

export default app;
