import "reflect-metadata";
import { createConnection } from "typeorm";
import express from "express";
import "./services";
import AuthController from "./auth/controllers/AuthController";
import { registerController } from "./utils/controller";
import bodyParser from "body-parser";
import EmploymentController from "./employees/controllers/EmployeesController";
import ItemsController from "./inventory/controllers/ItemsController";
// import ProductController from "./qr/controllers/QRController";
// import FolderController from "./qr/controllers/FolderController";

require("dotenv").config()

createConnection().then(async connection => {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  registerController(AuthController, app, "/auth");
  registerController(EmploymentController, app, "/employees");
  registerController(ItemsController, app, "/items");
  // registerController(FolderController, app, "/folders");

  app.listen(process.env.PORT || 3000, () => {
    console.log(`listening on ${process.env.PORT || 3000}`)
  })
}).catch(error => console.log(error));
