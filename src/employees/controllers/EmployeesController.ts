import { Request } from "express";
import { ObjectId } from "mongodb";
import { UserEntity } from "../../auth/entities/UserEntity";
import { SignupForm } from "../../auth/forms";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { EUserType, IAuthService } from "../../auth/types";
import { EServices } from "../../types";
import { Controller, Delete, Get, Post } from "../../utils/controller";
import { useForm } from "../../utils/form";
import { paginate } from "../../utils/pagination";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";

@Controller([AuthMiddleware])
export default class EmploymentController {
  @service(EServices.auth)
  private authService!: IAuthService;

  @Post("", [useForm(SignupForm)])
  async createEmployee(request: Request, form: SignupForm): Promise<Responder> {
    try {
      const user = (await this.authService.getUser<UserEntity>(request, UserEntity))!;
      const newEmployee = UserEntity.create(form.cleanedData);
      newEmployee.userType = EUserType.employee;
      newEmployee.employer = user.id.toString();
      await newEmployee.save();
      user.userType = EUserType.employer;
      await user.save();
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
  async deleteEmployee(request: Request): Promise<Responder> {
    const user = (await this.authService.getUser<UserEntity>(request, UserEntity))!;
    const employee = await UserEntity.findOne({
      where: {
        $and: [
          { _id: ObjectId(request.params.id) },
          { employer: user.id },
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
    await employee.softRemove();
    return jsonResponse(200);
  }

  @Get()
  async getEmployees(request: Request): Promise<Responder> {
    const user = (await this.authService.getUser<UserEntity>(request, UserEntity))!;
    const query = request.query.query || "";
    const page = Math.abs(parseInt(request.query.page as string)) || 1;
    const size = parseInt(request.query.size as string) || 100;
    const employees = (await UserEntity.find({
      where: {
        $and: [
          { employer: user.id },
          { deleteDate: undefined }
        ],
        $or: [
          { firstName: new RegExp(query as string) },
          { lastName: new RegExp(query as string) },
          { email: new RegExp(query as string) },
        ]
      }
    })).map(async e => await e.toDto());
    console.log(user)

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