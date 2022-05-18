import { Db } from "mongodb";
import { ECollections, EViews } from "../types";

export const up = async (db: Db) => {
	await db.dropCollection(EViews.inventory);
  await db.createCollection(
    EViews.inventory,
    {
      viewOn: ECollections.inventory,
      pipeline: [
        { $addFields: { id: "$_id" } },
        { $project: { _id: 0 } },
        { $match: { deleteDate: undefined } },
				{ $sort: { directoryType: 1 } }
      ]
    }
  );
}

export const down = async (db: Db) => {
	await db.dropCollection(EViews.inventory);
  await db.createCollection(
    EViews.inventory,
    {
      viewOn: ECollections.inventory,
      pipeline: [
        { $addFields: { id: "$_id" } },
        { $project: { _id: 0 } },
        { $match: { deleteDate: undefined } },
      ]
    }
  );
};
