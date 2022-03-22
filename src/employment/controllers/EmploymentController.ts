import { Request } from "express";
import { UserEntity } from "../../auth/entities/UserEntity";
import { SignupForm } from "../../auth/forms";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { IAuthService } from "../../auth/types";
import { EServices } from "../../types";
import { Controller, Delete, Get, Post } from "../../utils/controller";
import { paginate } from "../../utils/pagination";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { EmploymentEntity } from "../entities/EmploymentEntity";

@Controller([AuthMiddleware])
export default class EmploymentController {
  @service(EServices.auth)
  private authService!: IAuthService;

  @Post()
  async createEmployment(request: Request): Promise<Responder> {
    try {
      const user = await this.authService.getUser<UserEntity>(request, UserEntity);
      const form = new SignupForm(request.body);
      if (!form.validate())
        return jsonResponse(
          400,
          undefined,
          new JsonResponseError("Invalid parameters", form.errors)
        );
      const newEmployment = UserEntity.create(form.cleanedData);
      await newEmployment.save();
      await EmploymentEntity.create({ employeeId: newEmployment.id.toString(), employerId: user!.id.toString() }).save();
      return jsonResponse(201);
    } catch (e) {
      if ((e as any).writeErrors && (e as any).writeErrors[0].err.errmsg.includes("dup key"))
        return jsonResponse(
          400,
          undefined,
          new JsonResponseError("Failed to create user", { email: ["Email already in use"] })
        );
      return jsonResponse(
        400,
        undefined,
        new JsonResponseError("Failed to create user")
      );
    }
  }

  @Delete("/:id")
  async deleteEmployment(request: Request): Promise<Responder> {
    const user = await this.authService.getUser<UserEntity>(request, UserEntity);
    const employee = await UserEntity.findOne({
      where: {
        $and: [
          { _id: request.params.id },
          { deleteDate: undefined }
        ]
      }
    });
    if (!employee)
      return jsonResponse(
        404,
        undefined,
        new JsonResponseError("Employee not found")
      );
    const employment = await EmploymentEntity.findOne({ where: {
      $and: [
        { employeeId: employee.id },
        { employerId: user!.id },
        { deleteDate: undefined }
      ]
    }});
    if(!employment)
      return jsonResponse(
        404,
        undefined,
        new JsonResponseError("Employee not found")
      );
    await UserEntity.softRemove(employee);
    await EmploymentEntity.softRemove(employment);
    return jsonResponse(200);
  }

  @Get()
  async getEmployments(request: Request): Promise<Responder> {
    const user = await this.authService.getUser<UserEntity>(request, UserEntity);
    const query = request.query.query || "";
    const page = Math.abs(parseInt(request.query.page as string)) || 1;
    const size = parseInt(request.query.size as string) || 100;
    const employeeEntities = await EmploymentEntity.find({ where: { employerId: user!.id } });
    const employees = (await UserEntity.find({
      where: {
        $and: [
          { _id: { $in: employeeEntities.map(e => e.employeeId) } },
          { deleteDate: undefined }
        ],
        $or: [
          { firstName: new RegExp(query as string) },
          { lastName: new RegExp(query as string) },
          { email: new RegExp(query as string) },
        ]
      }
    })).map(async e => await e.toDto());

    const [data, numberOfPages, nextPage, previousPage] = paginate(await Promise.all(employees), page, size);

    return jsonResponse(
      200,
      data,
      undefined,
      numberOfPages,
      nextPage,
      previousPage
    );
  }

}