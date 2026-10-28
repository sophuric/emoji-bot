import { ChatInputCommandInteraction, Client, type InteractionReplyOptions, SlashCommandBuilder, type InteractionEditReplyOptions, InteractionResponse, Message } from "discord.js";

export type ReplyFunction = (options: string | (InteractionReplyOptions & InteractionEditReplyOptions)) => Promise<Message<boolean> | InteractionResponse<boolean> | null>;

export interface Command {
	data: SlashCommandBuilder;
	ready?: (client: Client<true>) => Promise<void> | void;
	execute: (
		interaction: ChatInputCommandInteraction,
		ctx: {
			reply: ReplyFunction,
			flags: InteractionReplyOptions["flags"]
		}
	) => Promise<void> | void;
}

import reactCommand from "./commands/react.js";

export const commands = [
	reactCommand
].reduce((acc: {[name: string]: Command}, command) => {
	acc[command.data.name] = command;
	return acc;
}, {});
