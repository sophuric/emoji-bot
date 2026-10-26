import dotenv from "dotenv";
dotenv.config();

import { Client, Events, GatewayIntentBits } from "discord.js";
import { commands } from "./commands.js";

const client = new Client({
	intents:[]
});

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
	console.log(interaction);
	if (!interaction.isChatInputCommand()) return;
	console.log(interaction.commandName);
	if (!commands.hasOwnProperty(interaction.commandName)) return;
	const command = commands[interaction.commandName];
	console.log(command);
	if (!command) return;

	await command.execute(interaction);
});


client.login(process.env.TOKEN);
console.log("Ready");
