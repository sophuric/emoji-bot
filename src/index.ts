import dotenv from "dotenv";
import { ChannelType, Client, Events, GatewayIntentBits, MessageFlags, Partials, PermissionsBitField, type InteractionEditReplyOptions, type InteractionReplyOptions } from "discord.js";
import { commands, type Command, type ReplyFunction } from "./commands.js";

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

	console.log("Ready!");

	client.on(Events.InteractionCreate, async interaction => {
		if (!interaction.isChatInputCommand()) return;
		if (!commands.hasOwnProperty(interaction.commandName)) return;
		const command = commands[interaction.commandName];
		if (!command) return;

		const reply: ReplyFunction = async function(options) {
			if (typeof options == "string") options = { content: options };

			try {
				if (options.flags == null) options.flags = flags;
				if (interaction.deferred) {
					return await interaction.editReply(options);
				}
				if (interaction.replied) {
					return await interaction.followUp(options);
				}
				return await interaction.reply(options);
			} catch (err) {
				console.log(err);
				return null;
			}
		};

		if (interaction.guild) {
			await interaction.guild.fetch();
		}

		if (interaction.channel) {
			await interaction.channel.fetch();
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
