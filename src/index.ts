import "reflect-metadata";
require("dotenv").config()
import "./services";
import { createConnection } from "typeorm";
import express from "express";
import AuthController from "./auth/controllers/AuthController";
import { registerController } from "./utils/controller";
import bodyParser from "body-parser";
import EmploymentController from "./organizations/controllers/OrganizationsController";
import ItemsController from "./inventory/controllers/ItemsController";
import QRController from "./inventory/controllers/QRController";
import FoldersController from "./inventory/controllers/FoldersController";



createConnection().then(async connection => {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  registerController(AuthController, app, "/auth");
  registerController(EmploymentController, app, "/employees");
  registerController(ItemsController, app, "/items");
  registerController(QRController, app, "/qr");
  registerController(FoldersController, app, "/folders");

  app.listen(process.env.PORT || 3000, () => {
    console.log(`listening on ${process.env.PORT || 3000}`)
  })
}).catch(error => console.log(error));
