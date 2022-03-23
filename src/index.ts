import "reflect-metadata";
import { createConnection } from "typeorm";
import express from "express";
import "./services";
import AuthController from "./auth/controllers/AuthController";
import { registerController } from "./utils/controller";
import bodyParser from "body-parser";
import EmploymentController from "./employment/controllers/EmploymentController";
import ProductController from "./inventory/controllers/ProductController";
import FolderController from "./inventory/controllers/FolderController";

require("dotenv").config()

createConnection().then(async connection => {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  registerController(AuthController, app, "/auth");
  registerController(EmploymentController, app, "/employees");
  registerController(FolderController, app, "/folders");
  registerController(ProductController, app, "/products");

  app.listen(process.env.PORT || 3000, () => {
    console.log(`listening on ${process.env.PORT || 3000}`)
  })
}).catch(error => console.log(error));
