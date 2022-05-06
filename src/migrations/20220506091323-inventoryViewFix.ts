import { Db } from "mongodb";
import { EViews, ECollections } from "../types";

export const up = async (db: Db) => {
  await db.dropCollection(EViews.inventory);
  await db.createCollection(
    EViews.inventory,
    {
      viewOn: ECollections.inventory,
      pipeline: [
        {
          $lookup: {
            from: ECollections.inventory,
            as: "items",
            foreignField: "folder",
            localField: "_id",
            pipeline: [
              { $count: "numberOfItems" },
            ]
          }
        },
        { $unwind: "$items" },
        { $addFields: { id: "$_id"} },
        { $project: { _id: 0 } },
        { $match: { deleteDate: undefined } },
      ]
    }
  );
};

export const down = async (db: Db) => {
  await db.dropCollection(EViews.inventory);
  await db.createCollection(
    EViews.inventory,
    {
      viewOn: ECollections.inventory,
      pipeline: [
        {
          $lookup: {
            from: ECollections.inventory,
            as: "items",
            foreignField: "folder",
            localField: "_id",
            pipeline: [
              { $count: "numberOfItems" },
            ]
          }
        },
        { $unwind: "$items" },
        { $addFields: { id: "$_id", numberOfItems: "$items.numberOfItems" } },
        { $project: { _id: 0, items: 0 } },
        { $match: { deleteDate: undefined } },
      ]
    }
  );
};
