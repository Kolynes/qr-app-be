import { Db, ObjectID } from "mongodb";
import { EViews, ECollections } from "../types";

export const up = async (db: Db) => {
  await db.createCollection(ECollections.membership);
  await db.createIndex(
    ECollections.membership,
    { user: 1, organization: 1},
    { unique: true }
  );

  const orgs = await db.collection(ECollections.organization).find().toArray();
  for (let org of orgs)
    if(org.members)
    try {
      await db.collection(ECollections.membership)
        .insertMany(
          org.members.map(
            (member: ObjectID) => ({ user: member, organization: org._id })
          )
        );
    } catch(e) { console.log((e as any).toString()) }
  await db.collection(ECollections.organization).updateMany(
    {},
    { $unset: { members: "" } }
  );
  await db.dropCollection(EViews.organization)
  await db.createCollection(
    EViews.organization,
    {
      viewOn: ECollections.organization,
      pipeline: [
        { $addFields: { id: "$_id" } },
        { $project: { _id: 0 } }
      ]
    }
  )

  await db.dropCollection(EViews.batch)
  await db.createCollection(
    EViews.batch,
    {
      viewOn: ECollections.batch,
      pipeline: [
        { $addFields: { id: "$_id" } },
        { $project: { _id: 0 } },
        { $match: { deleteDate: undefined } },
      ]
    }
  )

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
            localField: "_id",
            foreignField: "folder",
            as: "items",
            pipeline: [
              { $addFields: { id: "$_id" } },
              { $project: { _id: 0 } },
              { $match: { deleteDate: undefined } }
            ]
          }
        },
        { $addFields: { id: "$_id" } },
        { $project: { _id: 0 } },
        { $match: { deleteDate: undefined } },
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
            localField: "_id",
            foreignField: "folder",
            as: "items",
            pipeline: [
              { $addFields: { id: "$_id" } },
              { $match: { deleteDate: undefined } },
              { $project: { _id: 0 } }
            ]
          }
        },
        { $addFields: { id: "$_id" } },
        { $project: { _id: 0 } },
        { $match: { deleteDate: undefined } },
      ]
    }
  )
};
