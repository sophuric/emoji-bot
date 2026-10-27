import dotenv from "dotenv";
import { type Command } from "../commands.js";
import { Guild, GuildEmoji, InteractionContextType, MessageFlags, MessageReaction, PermissionFlagsBits, ReactionCollector, SlashCommandBuilder } from "discord.js";

dotenv.config();

const { GUILD_ID: guildId } = process.env;
if (!guildId) throw new Error("Missing GUILD_ID");

let guild: Guild;

const emojiRegex = /(?:\bhttps?:\/\/cdn\.discordapp\.com\/emojis\/(\d+).webp(?:\?(?:[^\s&]*&)*(?:name=(\w+)))?\b)|(?:<a?:(\w+):(\d+)>)/g;
const idRegex = /^\d+$/;
const messageRegex = /^https?\:\/\/(?:canary\.|ptb\.)?discord\.com\/channels\/\d+\/\d+\/(\d+)\/?(?:[#?].*)?$|^(\d+)$/;

export default <Command>{
	data: new SlashCommandBuilder()
		.setName("react")
		.setDescription("React to a message with emojis")
		.addStringOption(o => o.setName("message").setDescription("Message ID or URL").setRequired(true))
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
		const messageURL = interaction.options.getString("message")!;
		const emojisStr = interaction.options.getString("emojis")!;

		if (!interaction.channel) {
			await reply({ content: "Must be in a channel" });
			return;
		}

		await interaction.channel.fetch();

		let message;
		const messageMatch = messageURL.match(messageRegex);
		const messageID = messageMatch && (messageMatch[1] || messageMatch[2]);
		if (!messageID) {
			await reply({ content: "Invalid message URL/ID" });
			return;
		}

		try {
			message = await interaction.channel.messages.fetch(messageID);
		} catch {
			await reply({ content: "Failed to get message" });
			return;
		}

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const addedEmojis: (GuildEmoji | null)[] = [];
		const addedReactions: MessageReaction[] = [];
		let collector: ReactionCollector | undefined;

		let err;
		try {
			await (async () => {
				// match emojis in string
				const addEmojis = [];
				for (let match; match = emojiRegex.exec(emojisStr);) {
					const emojiID = match[1] || match[4];

					if (!emojiID || !emojiID.match(idRegex)) continue;

					const emojiName = match[2] || match[3] || emojiID;

					addEmojis.push({ emojiID, emojiName });
				};

				if (addEmojis.length < 1) {
					await reply({ content: "No emojis supplied" });
					return;
				}

				if (addEmojis.length > 5) {
					await reply({ content: "Max 5 emojis at a time" });
					return;
				}

				for (const { emojiID, emojiName } of addEmojis) {
					try {
						// create emoji for this emoji
						const newEmoji = await guild.emojis.create({
							attachment: `https://cdn.discordapp.com/emojis/${emojiID}.webp?animated=true&size=4096&lossless=true`,
							name: emojiName // easier lookup of existing emojis
						});
						addedEmojis.push(newEmoji);
					} catch (err) {
						await reply({ content: "Failed to add emoji to server" });
						return;
					}
				}

				try {
					// collect emojis that users react with, and remove our own reaction
					collector = message.createReactionCollector({
						filter: async (reaction, user) => {
							const hasMyReaction = (await reaction.users.fetch()).has(interaction.client.user.id);
							const hasOtherReaction = !user.bot && user.id != interaction.client.user.id;
							return hasMyReaction && hasOtherReaction;
						}
					});
					collector.on("collect", r => r.users.remove(interaction.client.user));

					// add reactions
					for (let i = 0; i < addedEmojis.length; ++i) {
						const emoji = addedEmojis[i];
						if (!emoji) continue;

						const reaction = await message.react(emoji);
						addedReactions.push(reaction);
					}
					await reply({ content: `Reacted with ${addedReactions.length} emojis!\nPlease react with these emojis yourself.\n# ` +
								addedEmojis.join(" ") });

					// wait 30 seconds for user to add their reactions
					collector.options.time = 30_000;
					collector.resetTimer();

					// remove our emojis in the meantime
					await Promise.all([
						async () => {
							for (let i = 0; i < addedEmojis.length; ++i) {
								const emoji = addedEmojis[i];
								if (!emoji) continue;
								await emoji.delete();
								console.log("deleting emoji:", `${emoji}`);
								addedEmojis[i] = null; // avoid deleting twice
							}
						},
						new Promise(resolve => {
							if (!collector) {
								resolve(null);
								return;
							}
							collector.once("end", resolve);
						})
					]);
				} catch (err) {
					await reply({ content: "Failed to react" });
					return;
				}
			})();
		} catch (err_) {
			err = err_;
		}

		if (collector) collector.stop();

		// remove remaining emojis and reactions
		await Promise.all([
			...addedReactions.map(reaction => reaction.users.remove(interaction.client.user)),
			...addedEmojis.map(emoji => {
				if (!emoji) return;
				emoji.delete();
			})
		]);

		if (err) throw err;
	}
};
