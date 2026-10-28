import { ChatInputCommandInteraction, type InteractionReplyOptions, SlashCommandBuilder, type InteractionEditReplyOptions, InteractionResponse, Message, Client, type PermissionResolvable } from "discord.js";

export type ReplyFunction = (options: string | (InteractionReplyOptions & InteractionEditReplyOptions)) => Promise<Message<boolean> | InteractionResponse<boolean> | null>;

export type CheckPermissionsFunction = (permissions: PermissionResolvable) => Promise<boolean>;

export interface Command {
	data: SlashCommandBuilder;
	ready?: (client: Client<true>) => Promise<void> | void;
	execute: (
		interaction: ChatInputCommandInteraction,
		ctx: {
			reply: ReplyFunction,
			checkMyPermissions: CheckPermissionsFunction
		}
	) => Promise<void> | void;
}

import reactCommand from "./commands/react.js";
import logChannelCommand from "./commands/logChannel.js";

export const commands = [
	reactCommand,
	logChannelCommand
]
	.reduce((acc: {[name: string]: Command}, command) => {
		acc[command.data.name] = command;
		return acc;
	}, {});
