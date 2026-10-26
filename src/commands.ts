import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export interface Command {
	data: SlashCommandBuilder;
	execute: (interaction: CommandInteraction) => Promise<void> | void;
}

import reactCommand from "./commands/react.js";

export const commands = [
	reactCommand
].reduce((acc: {[name: string]: Command}, command) => {
	acc[command.data.name] = command;
	return acc;
}, {});
