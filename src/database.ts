import { open } from "lmdb";

const databasePath = process.env.DATABASE_PATH || `${import.meta.dirname}/db`;

console.log(`Opening database... ${databasePath}`);

export const database = open(databasePath, {
	compression: true
});

console.log("Opened database");

export const db = {
	logChannelIDs: database.openDB({ name: "log-channel-id" })
};
