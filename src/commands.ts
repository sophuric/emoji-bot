import { ChatInputCommandInteraction, Client, type InteractionReplyOptions, SlashCommandBuilder, type InteractionEditReplyOptions, InteractionResponse, Message, type PermissionResolvable, type Interaction } from "discord.js";

export interface Command {
	data: SlashCommandBuilder;
	ready?: (client: Client<true>) => Promise<void> | void;
	requires?: {
		guild?: PermissionResolvable,
		channel?: PermissionResolvable,
		custom?: (interaction: ChatInputCommandInteraction) => boolean,
	};
	execute: (
		interaction: ChatInputCommandInteraction,
		ctx: {
			reply: (options: InteractionReplyOptions & InteractionEditReplyOptions) => Promise<Message<boolean> | InteractionResponse<boolean> | null>,
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
