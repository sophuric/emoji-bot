import { ChannelType, Client, Events, GatewayIntentBits, GuildMember, MessageFlags, Partials, PermissionsBitField, type GuildResolvable, type InteractionEditReplyOptions, type InteractionReplyOptions, type PermissionResolvable, type Snowflake } from "discord.js";
import { commands, type CheckPermissionsFunction, type Command, type ReplyFunction } from "./commands.js";
import { messageFlags, throw_, token } from "./var.js";

console.log("Loading...");

const client = new Client({
	allowedMentions: {
		parse: [],
		repliedUser: false,
		roles: [],
		users: []
	},
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildExpressions,
		GatewayIntentBits.DirectMessageReactions
	],
	partials: [
		Partials.Channel,
		Partials.Message,
		Partials.Reaction
	]
});

client.once(Events.ClientReady, async () => {
	if (!client.isReady()) throw new Error("Received ClientReady but !client.isReady()");

	console.log(`Client ready! ${client.user.tag}`);

	await Promise.all(Object.values(commands).map(async command => {
		if (command.ready) {
			await command.ready(client);
		}
	}));

	console.log("Ready!");

	client.on(Events.InteractionCreate, async interaction => {
		if (!interaction.isChatInputCommand()) return;
		if (!commands.hasOwnProperty(interaction.commandName)) return;
		const command = commands[interaction.commandName];
		if (!command) return;

		const reply: ReplyFunction = async function(options) {
			if (typeof options == "string") options = { content: options };

			try {
				if (!options.hasOwnProperty("flags")) options.flags = messageFlags;
				if (interaction.replied || interaction.deferred) {
					return await interaction.editReply(options);
				}
				return await interaction.reply(options);
			} catch (err) {
				console.log(err);
				return null;
			}
		};

		async function checkPermissionsFunc(member: GuildMember | null | undefined, requiredPermissions: PermissionResolvable, str: string) {
			if (!interaction.channel) {
				await reply("Not in a channel");
				return false;
			}
			if (!interaction.guild || interaction.channel.isDMBased()) {
				await reply("Not in a guild");
				return false;
			}
			if (!member) {
				await reply("Missing member");
				return false;
			}
			if (!member.permissionsIn(interaction.channel).has(requiredPermissions)) {
				const missing = new PermissionsBitField(requiredPermissions);
				missing.remove(member.permissions);
				await reply(`${str} missing the following permissions:\n${
					missing.toArray().map(e => `- ${e}`).join("\n")
				}`);
				return false;
			}
			return true;
		}
		async function checkMyPermissions(requiredPermissions: PermissionResolvable) {
			return await checkPermissionsFunc(interaction.guild?.members.me, requiredPermissions, "The bot is");
		}

		if (interaction.guild) {
			if (!interaction.channel) return;
			await interaction.guild.fetch();
			await interaction.channel.fetch();
		}

		try {
			await command.execute(interaction, { reply, checkMyPermissions });
		} catch (error) {
			console.error(error);

			await reply({ content: "There was an error while executing this command!" });
		}
	});
});

client.login(token);
console.log("Connecting...");
