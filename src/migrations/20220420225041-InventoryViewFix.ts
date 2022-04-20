import { Db } from "mongodb";
import { ECollections, EViews } from "../types";

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
            localField: "items",
            foreignField: "_id",
            as: "items",
            pipeline: [
              { $addFields: { id: "$_id" } },
              { $project: { _id: 0 } }
            ]
          }
        },
        { $addFields: { id: "$_id" } },
        { $project: { _id: 0 } }
      ]
    }
  );

  await db.dropCollection(EViews.batch);
  await db.createCollection(
    EViews.batch,
    {
      viewOn: ECollections.batch,
      pipeline: [
        {
          $lookup: {
            from: ECollections.inventory,
            localField: "items",
            foreignField: "_id",
            as: "items",
            pipeline: [
              { $addFields: { id: "$_id" } },
              { $project: { _id: 0 } }
            ]
          }
        },
        { $addFields: { id: "$_id" } },
        { $project: { _id: 0 } }
      ]
    }
  )
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
            localField: "items",
            foreignField: "_id",
            as: "items",
          }
        },
        { $addFields: { id: "$_id" } },
        { $project: { _id: 0 } }
      ]
    }
  );

  await db.dropCollection(EViews.batch);
  await db.createCollection(
    EViews.batch,
    {
      viewOn: ECollections.batch,
      pipeline: [
        {
          $lookup: {
            from: ECollections.inventory,
            localField: "items",
            foreignField: "_id",
            as: "items",
          }
        },
        { $addFields: { id: "$_id" } },
        { $project: { _id: 0 } }
      ]
    }
  )
};
