import { Request } from "express";
import { Collection } from "mongodb";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { IBatch } from "../../batches/types";
import { CommaSeparatedObjectIDsForm, ObjectIDForm, ObjectIDsForm, OrganizationIdForm, PageForm } from "../../common/forms";
import Helpers from "../../common/helpers";
import { collection, view } from "../../database";
import { ECollections, EServices, EViews } from "../../types";
import { Controller, Delete, Get, Patch, Post, Put } from "../../utils/controller";
import { useForm, useParamsForm, useQueryForm } from "../../utils/form";
import { paginate } from "../../utils/pagination";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { FolderCreateForm, FolderUpdateForm, ItemCreateForm, DirectorySearchForm, ItemsUpdateForm } from "../forms";
import { EDirectoryType, IDirectoryLike, IDirectoryLikeView, IQRService } from "../types";

const helpers = new Helpers();

@Controller([AuthMiddleware])
export default class InventoryController {
  @service(EServices.qrcode)
  private qrCodeService!: IQRService;

  @collection(ECollections.inventory)
  private Inventory!: Collection<IDirectoryLike>;

  @collection(ECollections.batch)
  private Batch!: Collection<IBatch>;

  @view(EViews.inventory)
  private InventoryView!: Collection<IDirectoryLikeView>;

  @Post("/items", [useForm(ItemCreateForm)])
  async createItems(request: Request, form: ItemCreateForm): Promise<Responder> {
    const { numberOfItems, folder, organization } = form.cleanedData;
    const result = await helpers.getValidOrganizationByMembershipOrResponse(organization, request);
    if (result instanceof Function) return result;
    const parentFolderResult = await helpers.getValidDirectoryOrErrorResponse(folder || result.rootFolder, request);
    if (parentFolderResult instanceof Function) return parentFolderResult;
    if (parentFolderResult.directoryType != EDirectoryType.folder) return jsonResponse({
      status: 404,
      error: new JsonResponseError(
        "Invalid parameters",
        { folder: ["This is not a valid folder"] }
      )
    })
    const batch = { organization, createDate: new Date() } as IBatch;
    await this.Batch.insertOne(batch);
    const items = [];
    for (let i = 0; i < numberOfItems; i++) items.push({
      folder: parentFolderResult.id,
      directoryType: EDirectoryType.item,
      batch: batch._id,
      organization,
      createDate: new Date(),
      addToFolderDate: new Date()
    } as IDirectoryLike);
    await this.Inventory.insertMany(items);
    const itemViews = await this.InventoryView.find({ id: { $in: items.map(item => item._id) } }).toArray();
    return jsonResponse({
      status: 201,
      data: {
        batch: batch._id,
        items: await Promise.all(itemViews.map(async item => ({
          qrCode: await this.qrCodeService.createQRCode(item.id!, organization),
          ...item
        })))
      }
    });
  }

  @Post("/folders", [useForm(FolderCreateForm)])
  async createFolder(request: Request, form: FolderCreateForm): Promise<Responder> {
    try {
      const { name, folder, organization, color } = form.cleanedData;
      const result = await helpers.getValidOrganizationByMembershipOrResponse(organization, request);
      if (result instanceof Function) return result;
      const parentFolderResult = await helpers.getValidDirectoryOrErrorResponse(folder || result.rootFolder, request);
      if (parentFolderResult instanceof Function) return parentFolderResult;
      if (parentFolderResult.directoryType != EDirectoryType.folder) return jsonResponse({
        status: 404,
        error: new JsonResponseError(
          "Invalid parameters",
          { folder: ["This is not a valid folder"] }
        )
      })
      const newFolder = {
        name,
        folder: parentFolderResult.id,
        organization,
        color,
        directoryType: EDirectoryType.folder,
        createDate: new Date(),
        addToFolder: new Date()
      } as IDirectoryLike;
      await this.Inventory.insertOne(newFolder);
      return jsonResponse({
        status: 201,
        data: await this.InventoryView.findOne({ id: newFolder._id })
      });
    } catch (e) {
      console.log(e);
      return jsonResponse({ status: 400, error: new JsonResponseError((e as any).toString()) })
    }
  }

  @Get("/search", [useQueryForm(DirectorySearchForm), useQueryForm(PageForm)])
  async search(request: Request, directorySearchForm: DirectorySearchForm, pageForm: PageForm): Promise<Responder> {
    const { organization, folder } = directorySearchForm.cleanedData;
    const { page, size, query } = pageForm.cleanedData;
    const result = await helpers.getValidOrganizationByMembershipOrResponse(organization, request);
    if (result instanceof Function) return result;
    const queryObject = {
      organization,
      directoryType: EDirectoryType.item
    }
    if (folder) Object.assign(queryObject, { folder });
    if (query) Object.assign(queryObject, {
      $or: [
        { "item.type": new RegExp(`${query || ""}`) },
        { "item.tags": new RegExp(`${query || ""}`) },
        { "item.genetiName": new RegExp(`${query || ""}`) },
      ]
    })
    const list = this.InventoryView.find(queryObject);
    return jsonResponse({
      status: 200,
      ...await paginate(list, page, size)
    });
  }

  @Get("/:id", [useParamsForm(ObjectIDForm)])
  async getDirectory(request: Request, form: ObjectIDForm): Promise<Responder> {
    const { id } = form.cleanedData;
    const result = await helpers.getValidDirectoryOrErrorResponse(id, request);
    if (result instanceof Function) return result;
    else return jsonResponse({
      status: 200,
      data: result
    });
  }

  @Get("/:id/list", [useParamsForm(ObjectIDForm), useQueryForm(PageForm)])
  async listDirectory(request: Request, idForm: ObjectIDForm, pageForm: PageForm) {
    const { id } = idForm.cleanedData;
    const { page, size } = pageForm.cleanedData;
    const result = await helpers.getValidDirectoryOrErrorResponse(id, request);
    if (result instanceof Function) return result;
    const count = await this.InventoryView.find({ folder: id }).count();
    const oldest = (await this.InventoryView.find({ folder: id }).sort("createDate", 1).limit(1).toArray())[0];
    const newest = (await this.InventoryView.find({ folder: id }).sort("createDate", -1).limit(1).toArray())[0];
    const pageData = result.name
      ? await paginate<IDirectoryLikeView>(this.InventoryView.find({ folder: id }), page, size)
      : await paginate<IDirectoryLikeView>(this.InventoryView.find({ folder: id, directoryType: EDirectoryType.folder }), page, size)
    const averageAgeResult = await this.Inventory.aggregate([
      { $match: { folder: id } },
      { 
        $group: {
          _id: null,
          averageAge: { $avg: { $subtract: [new Date(), "$addToFolderDate"] } } 
        }
      }
    ]).toArray() as unknown as [{ averageAge: number}];
    const data = {
      averageAge: averageAgeResult.length > 0
        ? Math.round(averageAgeResult[0].averageAge)
        : 0,
      count,
      oldest,
      newest,
      list: pageData.data
    }
    return jsonResponse({
      status: 200,
      ...pageData,
      data
    });
  }

  @Get("/root/:organization", [useParamsForm(OrganizationIdForm)])
  async getRootDirectory(request: Request, form: OrganizationIdForm): Promise<Responder> {
    const { organization } = form.cleanedData;
    const orgnizationResult = await helpers.getValidOrganizationByMembershipOrResponse(organization, request);
    if (orgnizationResult instanceof Function) return orgnizationResult;
    const directoryResult = await helpers.getValidDirectoryOrErrorResponse(orgnizationResult.rootFolder, request);
    if (directoryResult instanceof Function) return directoryResult;
    return jsonResponse({
      status: 200,
      data: directoryResult
    });
  }

  @Delete("", [useQueryForm(CommaSeparatedObjectIDsForm)])
  async deleteDirectories(request: Request, form: CommaSeparatedObjectIDsForm): Promise<Responder> {
    const { ids } = form.cleanedData;
    await this.Inventory.updateOne(
      { _id: { $in: ids } },
      { $set: { deleteDate: new Date() } }
    );
    return jsonResponse({ status: 200 });
  }

  @Patch("/folders/:id", [useParamsForm(ObjectIDForm), useForm(FolderUpdateForm)])
  async updateFolder(request: Request, idForm: ObjectIDForm, folderUpdateForm: FolderUpdateForm): Promise<Responder> {
    const { id } = idForm.cleanedData;
    const result = await helpers.getValidDirectoryOrErrorResponse(id, request);
    if (result instanceof Function) return result;
    if (result.directoryType != EDirectoryType.item) return jsonResponse({
      status: 400,
      error: new JsonResponseError("This is not a folder")
    })
    await this.Inventory.updateOne(
      { _id: result.id },
      { $set: { ...folderUpdateForm.cleanedData, createDate: new Date() } }
    );
    return jsonResponse({
      status: 200,
      data: await this.InventoryView.findOne({ id: result.id })
    });
  }

  @Patch("/items", [useForm(ItemsUpdateForm)])
  async updateItems(request: Request, form: ItemsUpdateForm): Promise<Responder> {
    const { ids, item, folder } = form.cleanedData;
    if (folder) await this.Inventory.updateMany(
      { folder, directoryType: EDirectoryType.item },
      { $set: { item, updateDate: new Date() } }
    );
    else await this.Inventory.updateMany(
      { _id: { $in: ids }, directoryType: EDirectoryType.item },
      { $set: { item, updateDate: new Date() } }
    );
    return jsonResponse({
      status: 200,
      data: await this.InventoryView.find({ id: { $in: ids } }).toArray()
    });
  }

  @Put("/folders/:id/add", [useParamsForm(ObjectIDForm), useForm(ObjectIDsForm)])
  async addToFolder(request: Request, idForm: ObjectIDForm, folderItemsForm: ObjectIDsForm): Promise<Responder> {
    const { id } = idForm.cleanedData;
    const { ids } = folderItemsForm.cleanedData;
    const folder = await helpers.getValidDirectoryOrErrorResponse(id, request);
    if (folder instanceof Function) return folder;
    await this.Inventory.updateMany(
      { _id: { $in: ids } },
      { $set: { folder: id, updateDate: new Date(), addToFolderDate: new Date() } }
    );
    return jsonResponse({ status: 200 });
  }
}