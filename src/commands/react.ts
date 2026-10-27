import dotenv from "dotenv";
import { type Command } from "../commands.js";
import { Guild, InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

dotenv.config();

const { GUILD_ID: guildId } = process.env;
if (!guildId) throw new Error("Missing GUILD_ID");

let guild: Guild;

const emojiRegex = /(?:\bhttps?:\/\/cdn\.discordapp\.com\/emojis\/(\d+).webp(?:\?(?:[^\s&]*&)*(?:name=(\w+)))?\b)|(?:<a?:(\w+):(\d+)>)/g;
const idRegex = /^\d+$/;

export default <Command>{
	data: new SlashCommandBuilder()
		.setName("react")
		.setDescription("React to a message with emojis")
		.addStringOption(o => o.setName("message").setDescription("Message ID").setRequired(true))
		.addStringOption(o => o.setName("emojis").setDescription("String of emojis to react with").setMinLength(5).setRequired(true))
		.setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
	ready: async client => {
		const g = client.guilds.resolve(guildId);
		if (!g) throw new Error(`Cannot resolve guild ${guildId}`);
		guild = g;
	},
	requires: {
		channel: PermissionFlagsBits.AddReactions | PermissionFlagsBits.UseExternalEmojis | PermissionFlagsBits.ViewChannel
	},
	execute: async (interaction, { reply }) => {
		const messageID = interaction.options.getString("message")!;
		const emojisStr = interaction.options.getString("emojis")!;

		if (!interaction.channel) {
			await reply({ content: "Must be in a channel" });
			return;
		}

		await interaction.channel.fetch();

		let message;
		try {
			message = await interaction.channel.messages.fetch(messageID);
		} catch {
			await reply({ content: "Failed to get message" });
			return;
		}

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const emojisToReact = [];
		let matched = 0;
		// match emojis in string
		for (let match; match = emojiRegex.exec(emojisStr);) {
			const emojiName = match[2] || match[3];
			const emojiID = match[1] || match[4];

			if (!emojiID || !emojiID.match(idRegex)) continue;

			const emojis = await guild.emojis.fetch();

			// find already existing emoji in our server
			let existingEmoji = emojis.values().find(emoji => emoji.name == emojiID && emoji.author?.id == interaction.client.user.id);
			if (!existingEmoji) {
				try {
					// create emoji for this emoji
					existingEmoji = await guild.emojis.create({
						attachment: `https://cdn.discordapp.com/emojis/${emojiID}.webp?animated=true&size=4096&lossless=true`,
						name: emojiID // easier lookup of existing emojis
					});
				} catch (err) {
					await reply({ content: "Failed to add emoji to server" });
					return;
				}
			}

			emojisToReact.push(existingEmoji);
			++matched;
		}

		if (matched == 0) {
			await reply({ content: "No emojis supplied" });
			return;
		}

		const reactions = [];
		try {
			// collect emojis that users react with, and remove our own reaction
			const collector = message.createReactionCollector({
				time: 30_000,
				filter: async (reaction, user) => {
					const hasMyReaction = (await reaction.users.fetch()).has(interaction.client.user.id);
					const hasOtherReaction = !user.bot && user.id != interaction.client.user.id;
					return hasMyReaction && hasOtherReaction;
				}
			});
			collector.on("collect", r => r.users.remove(interaction.client.user));

			// add reactions
			for (const emoji of emojisToReact) {
				const reaction = await message.react(emoji);
				reactions.push(reaction);
			}
			await reply({ content: `Reacted with ${reactions.length} emojis!` });

			await new Promise(resolve => collector.once("end", resolve));
			await Promise.all(reactions.map(reaction => reaction.users.remove(interaction.client.user)));
		} catch (err) {
			await Promise.all(reactions.map(reaction => reaction.users.remove(interaction.client.user)));
			await reply({ content: "Failed to react" });
			return;
		}
	}
};
