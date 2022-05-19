import { Db } from "mongodb";
import { ECollections } from "../types";

export const up = async (db: Db) => {
	await db.collection(ECollections.inventory).updateMany(
		{},
		{ $set: { addToFolder: new Date() } }
	)
}

export const down = async (db: Db) => {
	await db.collection(ECollections.inventory).updateMany(
		{},
		{ $unset: { addToFolder: "" } }
	)
};
