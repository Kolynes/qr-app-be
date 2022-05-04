import { Db } from 'mongodb';
import { ECollections, EViews } from '../types';

export async function up(db: Db) {
  await db.createCollection(ECollections.user);
  await db.createIndex(
    ECollections.user,
    { email: 1 },
    { unique: true }
  );
  await db.createCollection(
    EViews.user,
    {
      viewOn: ECollections.user,
      pipeline: [
        { $addFields: { id: "$_id" } },
        { $project: { password: 0, _id: 0 } }
      ]
    },
  );

  await db.createCollection(ECollections.verification);
  await db.createIndex(
    ECollections.verification,
    { userId: 1 },
    { unique: true }
  );

  await db.createCollection(ECollections.inventory);
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
            as: "items"
          }
        },
        { $addFields: { id: "$_id" } },
        { $project: { _id: 0 } }
      ]
    }
  )

  await db.createCollection(ECollections.batch);
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

  await db.createCollection(ECollections.organization);
  await db.createIndex(
    ECollections.organization,
    { name: 1, owner: 1 },
    { unique: true }
  );
  await db.createCollection(
    EViews.organization,
    {
      viewOn: ECollections.organization,
      pipeline: [
        {
          $lookup: {
            from: EViews.user,
            localField: "members",
            foreignField: "id",
            as: "members"
          }
        },
        { $addFields: { id: "$_id" } },
        { $project: { _id: 0 } }
      ]
    }
  )
}

async function down(db: Db) {
  await db.dropCollection(ECollections.user);
  await db.dropCollection(ECollections.verification);
  await db.dropCollection(ECollections.batch);
  await db.dropCollection(ECollections.inventory);
  await db.dropCollection(ECollections.organization);
}
