import { Db } from "mongodb";
import { ECollections } from "../types";

export const up = async (db: Db) => {
	await db.createIndex(
		ECollections.inventory,
		{ directoryType: 1 }
	)
}

export const down = async (db: Db) => {
	await db.collection(ECollections.inventory).dropIndex("directoryType_1");
};
