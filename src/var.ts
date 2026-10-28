import dotenv from "dotenv";
import { MessageFlags } from "discord.js";

export function throw_(error: Error): never {
	throw error;
}

dotenv.config();

export const token = process.env.TOKEN || throw_(new Error("Missing TOKEN"));
export const clientId = process.env.CLIENT_ID || throw_(new Error("Missing CLIENT_ID"));
export const guildId = process.env.GUILD_ID || throw_(new Error("Missing GUILD_ID"));
export const messageFlags = MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds;
