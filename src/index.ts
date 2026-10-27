import dotenv from "dotenv";
import { ChannelType, Client, Events, GatewayIntentBits, MessageFlags, Partials, PermissionsBitField, type InteractionEditReplyOptions, type InteractionReplyOptions } from "discord.js";
import { commands } from "./commands.js";

dotenv.config();

const { TOKEN: token } = process.env;
if (!token) throw new Error("Missing TOKEN");

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
		GatewayIntentBits.GuildExpressions
	],
	partials: [
		Partials.Channel,
		Partials.Message
	]
});

const flags = MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds;

client.once(Events.ClientReady, async readyClient => {
	console.log(`Client ready ${readyClient.user.tag}`);

	await Promise.all(Object.values(commands).map(async command => {
		if (command.ready) {
			await command.ready(readyClient);
		}
	}));

	console.log(`Ready!`);

	client.on(Events.InteractionCreate, async interaction => {
		if (!interaction.isChatInputCommand()) return;
		if (!commands.hasOwnProperty(interaction.commandName)) return;
		const command = commands[interaction.commandName];
		if (!command) return;

		const reply = async function(options: InteractionReplyOptions & InteractionEditReplyOptions) {
			if (options.flags == null) options.flags = flags;
			if (interaction.deferred) {
				return await interaction.editReply(options);
			}
			if (interaction.replied) {
				return await interaction.followUp(options);
			}
			return await interaction.reply(options);
		};

		if (interaction.guild) {
			await interaction.guild.fetch();

			const member = await interaction.guild.members.fetch(interaction.user);
			if (command.requires?.guild) {
				if (!member.permissions.has(command.requires.guild)) {
					const missing = new PermissionsBitField(command.requires.channel);
					missing.remove(member.permissions);
					await reply({ content: `You are missing the following guild permissions:\n${
						missing.toArray().map(e => `- ${e}`).join("\n")
					}` });
					return;
				}
			}
			if (command.requires?.channel && interaction.channel) {
				const channelPerms = member.permissionsIn(interaction.channel.id);
				if (!channelPerms.has(command.requires.channel)) {
					command.requires.channel;
					const missing = new PermissionsBitField(command.requires.channel);
					missing.remove(channelPerms);
					await reply({ content: `You are missing the following channel permissions:\n${
						missing.toArray().map(e => `- ${e}`).join("\n")
					}` });
					return;
				}
			}

			if (command.requires?.custom) {
				try {
					if (!command.requires.custom(interaction)) {
						await reply({ content: "You don't have permission to run this command" });
					}
				} catch (error) {
					console.error(error);

					await reply({ content: "There was an error while executing this command!" });
				}
			}
		}


		try {
			await command.execute(interaction, { reply, flags });
		} catch (error) {
			console.error(error);

			await reply({ content: "There was an error while executing this command!" });
		}
	});
});

client.login(token);
console.log("Connecting...");
