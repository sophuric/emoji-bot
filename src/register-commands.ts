import dotenv from "dotenv";
dotenv.config();

import { REST, Routes } from "discord.js";
import { commands } from "./commands.js";

const { TOKEN: token, CLIENT_ID: clientId, GUILD_ID: guildId } = process.env;
if (!token) throw new Error("Missing TOKEN");
if (!clientId) throw new Error("Missing CLIENT_ID");
if (!guildId) throw new Error("Missing GUILD_ID");

const rest = new REST().setToken(token);

(async () => {
	console.log("Refreshing commands...");
	await rest.put(
		// Routes.applicationGuildCommands(clientId, guildId),
		Routes.applicationCommands(clientId),
		{ body: Object.values(commands).map(command => command.data.toJSON()) }
	);
	console.log("Refreshed commands!");
})();
