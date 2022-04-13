import "reflect-metadata";
require("dotenv").config()
import "./services";
import { createConnection } from "typeorm";
import express from "express";
import AuthController from "./auth/controllers/AuthController";
import { registerController } from "./utils/controller";
import bodyParser from "body-parser";
import OrganizationsController from "./organizations/controllers/OrganizationsController";
import InventoryController from "./inventory/controllers/inventoryController";



createConnection().then(async connection => {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  registerController(AuthController, app, "/auth");
  registerController(OrganizationsController, app, "/organizations");
  registerController(InventoryController, app, "/inventory");

  app.listen(process.env.PORT || 3000, () => {
    console.log(`listening on ${process.env.PORT || 3000}`)
  })
}).catch(error => console.log(error));
