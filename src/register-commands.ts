import { REST, Routes } from "discord.js";
import { commands } from "./commands.js";
import { clientId, guildId, token } from "./var.js";

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
