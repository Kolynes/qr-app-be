import { Request } from "express";
import { Collection, ObjectId } from "mongodb";
import AuthMiddleware from "../../auth/middleware/AuthMiddleware";
import { IAuthService } from "../../auth/types";
import { IBatch } from "../../batches/types";
import { ObjectIDForm, OrganizationIdForm } from "../../common/forms";
import { collection, view } from "../../database";
import { IOrganization, IOrganizationView } from "../../organizations/types";
import { ECollections, EServices, EViews } from "../../types";
import { Controller, Delete, Get, Patch, Post, Put } from "../../utils/controller";
import { useForm, useParamsForm } from "../../utils/form";
import { jsonResponse, JsonResponseError, Responder } from "../../utils/responses";
import { service } from "../../utils/services/ServiceProvider";
import { FolderCreateForm, FolderItemsForm, FolderUpdateForm, ItemCreateForm, ItemsUpdateForm } from "../forms";
import { EDirectoryType, IDirectoryLike, IDirectoryLikeView, IItem, IQRService } from "../types";

@Controller([AuthMiddleware])
export default class InventoryController {
  @service(EServices.qrcode)
  private qrCodeService!: IQRService;

  @service(EServices.auth)
  private authService!: IAuthService;

  @collection(ECollections.inventory)
  private Inventory!: Collection<IDirectoryLike>;

  @view(EViews.organization)
  private OrganizationView!: Collection<IOrganizationView>;

  @view(EViews.inventory)
  private InventoryView!: Collection<IDirectoryLikeView>;

  @collection(ECollections.batch)
  private Batch!: Collection<IBatch>;

  async getValidDirectoryOrErrorResponse(id: ObjectId, request: Request): Promise<IDirectoryLikeView | Responder> {
    const directory = await this.InventoryView.findOne({ id: id }) as IDirectoryLikeView;
    if (!directory) return jsonResponse({
      status: 404,
      error: new JsonResponseError("Directory not found")
    });
    const isMember = await this.authService.isMember(directory.organization, request);
    if (!isMember) return jsonResponse({
      status: 403,
      error: new JsonResponseError("You are not authorized to carry out this action")
    });
    return directory;
  }

  async getValidOrganizationOrResponse(id: ObjectId, request: Request): Promise<IOrganizationView | Responder> {
    const organization = await this.OrganizationView.findOne({ id });
    if (!organization) return jsonResponse({
      status: 404,
      error: new JsonResponseError("Organization not found")
    });
    const user = await this.authService.getUser(request);
    if (!user || !user._id!.equals(organization.owner)) return jsonResponse({
      status: 403,
      error: new JsonResponseError("You are not authorized to carry out this action")
    });
    return organization;
  }

  @Post("/items", [useForm(ItemCreateForm)])
  async createItems(request: Request, form: ItemCreateForm): Promise<Responder> {
    const { numberOfItems, folder, organization } = form.cleanedData;
    const result = await this.getValidOrganizationOrResponse(organization, request);
    if (result instanceof Function) return result;
    const parentFolderResult = await this.getValidDirectoryOrErrorResponse(folder || result.rootFolder, request);
    if (parentFolderResult instanceof Function) return parentFolderResult;
    if (parentFolderResult.directoryType != EDirectoryType.folder) return jsonResponse({
      status: 404,
      error: new JsonResponseError(
        "Invalid parameters",
        { folder: ["This is not a valid folder"] }
      )
    })
    const batch = { organization } as IBatch;
    await this.Batch.insertOne(batch);
    const items = [];
    for (let i = 0; i < numberOfItems; i++) items.push({
      folder: folder || result.rootFolder,
      directoryType: EDirectoryType.item,
      batch: batch._id,
      organization,
      createDate: new Date()
    } as IDirectoryLike);
    await this.Inventory.insertMany(items);
    await this.Inventory.updateOne(
      { _id: parentFolderResult.id },
      {
        $set: {
          items: [
            ...parentFolderResult.items!.map(item => item.id!),
            ...items.map(item => item._id!)
          ]
        }
      }
    );
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
      const result = await this.getValidOrganizationOrResponse(organization, request);
      if (result instanceof Function) return result;
      const parentFolderResult = await this.getValidDirectoryOrErrorResponse(folder || result.rootFolder, request);
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
        folder: folder || result.rootFolder,
        organization,
        color,
        directoryType: EDirectoryType.folder,
        createDate: new Date()
      } as IDirectoryLike;
      await this.Inventory.insertOne(newFolder);
      await this.Inventory.updateOne(
        { _id: parentFolderResult.id },
        {
          $set: {
            items: [
              newFolder._id!,
              ...parentFolderResult.items!.map(item => item.id!),
            ]
          }
        }
      );
      return jsonResponse({
        status: 201,
        data: {
          qrCode: await this.qrCodeService.createQRCode(newFolder._id!, organization),
          ...await this.InventoryView.findOne({ id: newFolder._id })
        }
      });
    } catch (e) {
      console.log(e);
      return jsonResponse({ status: 400, error: new JsonResponseError((e as any).toString()) })
    }
  }

  @Get("/:id", [useParamsForm(ObjectIDForm)])
  async getDirectory(request: Request, form: ObjectIDForm): Promise<Responder> {
    const { id } = form.cleanedData;
    const result = await this.getValidDirectoryOrErrorResponse(id, request);
    if (result instanceof Function) return result;
    else return jsonResponse({
      status: 200,
      data: result
    });
  }

  @Get("/root/:organization", [useParamsForm(OrganizationIdForm)])
  async getRootDirectory(request: Request, form: OrganizationIdForm): Promise<Responder> {
    const { organization } = form.cleanedData;
    const result = await this.getValidOrganizationOrResponse(organization, request);
    if (result instanceof Function) return result;
    return jsonResponse({
      status: 200,
      data: await this.InventoryView.find({
        organization,
        folder: result.rootFolder,
        deleteDate: undefined
      }).toArray() as IDirectoryLikeView[]
    });
  }

  @Delete("/:id", [useParamsForm(ObjectIDForm)])
  async deleteDirectory(request: Request, form: ObjectIDForm): Promise<Responder> {
    const { id } = form.cleanedData;
    const result = await this.getValidDirectoryOrErrorResponse(id, request);
    if (result instanceof Function) return result;
    await this.Inventory.updateOne(
      { _id: result.id },
      { $set: { deleteDate: new Date() } }
    );
    return jsonResponse({ status: 200 });
  }

  @Patch("/folders/:id", [useParamsForm(ObjectIDForm), useForm(FolderUpdateForm)])
  async updateFolder(request: Request, idForm: ObjectIDForm, folderUpdateForm: FolderUpdateForm): Promise<Responder> {
    const { id } = idForm.cleanedData;
    const result = await this.getValidDirectoryOrErrorResponse(id, request);
    if (result instanceof Function) return result;
    if (result.directoryType != EDirectoryType.item) return jsonResponse({
      status: 400,
      error: new JsonResponseError("This is not a folder")
    })
    await this.Inventory.updateOne(
      { _id: result.id },
      { $set: folderUpdateForm.cleanedData }
    );
    return jsonResponse({
      status: 200,
      data: await this.InventoryView.findOne({ id: result.id })
    });
  }

  @Patch("/items", [useForm(ItemsUpdateForm)])
  async updateItems(request: Request, itemUpdateForm: ItemsUpdateForm): Promise<Responder> {
    const { ids, item } = itemUpdateForm.cleanedData;
    await this.Inventory.updateMany(
      { _id: { $in: ids } },
      { $set: { item } }
    );
    return jsonResponse({
      status: 200,
      data: await this.InventoryView.find({ id: { $in: ids } }).toArray()
    });
  }

  @Put("/folders/:id/add", [useParamsForm(ObjectIDForm), useForm(FolderItemsForm)])
  async addToFolder(request: Request, idForm: ObjectIDForm, folderItemsForm: FolderItemsForm): Promise<Responder> {
    const { id } = idForm.cleanedData;
    const { items } = folderItemsForm.cleanedData;
    const folder = await this.getValidDirectoryOrErrorResponse(id, request);
    if (folder instanceof Function) return folder;
    const idSet = new Set([
      ...folder.items!.map(item => item.id),
      ...items
    ]);
    const ids = [];
    for(let id of idSet) ids.push(id);
    await this.Inventory.updateOne(
      { _id: id },
      { $set: { items : ids } }
    );
    await this.Inventory.updateMany(
      { _id: { $in: ids } },
      { $set: { folder: id } }
    );
    return jsonResponse({ status: 200 });
  }
}