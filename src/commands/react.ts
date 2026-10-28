import dotenv from "dotenv";
import { type Command } from "../commands.js";
import { Guild, GuildEmoji, InteractionContextType, MessageFlags, MessageReaction, PermissionFlagsBits, ReactionCollector, SlashCommandBuilder, time, TimestampStyles, type UserResolvable } from "discord.js";

dotenv.config();

const { GUILD_ID: guildId } = process.env;
if (!guildId) throw new Error("Missing GUILD_ID");

let guild: Guild;

const emojiRegex = /(?:\bhttps?:\/\/cdn\.discordapp\.com\/emojis\/(\d+).(?:png|gif|webp)(?:\?(?:[^\s&]*&)*(?:name=(\w+)))?\b)|(?:<a?:(\w+):(\d+)>)/g;
const idRegex = /^\d+$/;
const messageRegex = /^https?\:\/\/(?:canary\.|ptb\.)?discord\.com\/channels\/(\d+|@me)\/(\d+)\/(\d+)\/?(?:[#?].*)?$|^(\d+)$/;
const dmString = "@me";

const cooldown = new Set<UserResolvable>();

export default <Command>{
	data: new SlashCommandBuilder()
		.setName("react")
		.setDescription("React to a message with emojis")
		.addStringOption(o => o.setName("message").setDescription("Message ID or URL").setRequired(true))
		.addStringOption(o => o.setName("emojis").setDescription("String of emojis to react with").setMinLength(5).setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.AddReactions | PermissionFlagsBits.UseExternalEmojis | PermissionFlagsBits.ViewChannel)
		.setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
	ready: async client => {
		const g = client.guilds.resolve(guildId);
		if (!g) throw new Error(`Cannot resolve guild ${guildId}`);
		guild = g;

		const emojis = await guild.emojis.fetch();
		const leftoverEmojis = emojis.filter(e => e?.author?.id == client.user.id);

		for (const emoji of leftoverEmojis.values()) {
			console.log(`Deleting leftover emoji ${emoji}...`);
			await emoji.delete();
		}
	},
	execute: async (interaction, { reply }) => {
		const messageURL = interaction.options.getString("message")!;
		const emojisStr = interaction.options.getString("emojis")!;

		if (!interaction.channel) {
			await reply("Must be in a channel");
			return;
		}

		await interaction.channel.fetch();

		let message;
		const messageMatch = messageURL.match(messageRegex);
		const messageID = messageMatch && (messageMatch[3] || messageMatch[4]);
		if (!messageID) {
			await reply("Invalid message URL/ID");
			return;
		}

		if (messageMatch[1] && messageMatch[1] != (interaction.guild ? interaction.guild.id : dmString)) {
			await reply("The message link is from a " + (
				(messageMatch[1] == dmString && interaction.guild) ? "DM" :
					(messageMatch[1] != dmString && !interaction.guild) ? "server" :
						"different server"));
			return;
		}

		if (messageMatch[2] && messageMatch[2] != interaction.channel.id) {
			await reply("The message link is from a different " +
						(interaction.guild ? "channel" : "DM"));
			return;
		}

		try {
			message = await interaction.channel.messages.fetch(messageID);
		} catch {
			await reply("Failed to get message");
			return;
		}

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const addedEmojis: (GuildEmoji | null)[] = [];
		const addedReactions: (MessageReaction | null)[] = [];
		let collector: ReactionCollector | undefined;

		if (cooldown.has(interaction.user.id)) {
			await reply("You are currently in cooldown. Please wait before trying again.");
			return;
		}

		let err;
		let sentReactedMessage = false;
		try {
			cooldown.add(interaction.user.id);

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
					await reply("No emojis supplied");
					return;
				}

				if (addEmojis.length > 5) {
					await reply("Max 5 emojis at a time");
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
						await reply("Failed to add emoji to server");
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
					collector.on("collect", r => r.users.remove());

					// add reactions
					for (let i = 0; i < addedEmojis.length; ++i) {
						const emoji = addedEmojis[i];
						if (!emoji) continue;

						const reaction = await message.react(emoji);
						addedReactions.push(reaction);
					}

					const timeout = 10_000;
					await reply(`Reacted with ${addedReactions.length} emojis!\nPlease react with these emojis yourself.\n` +
								`-# expires ${time(Math.floor((Date.now() + timeout) / 1000), TimestampStyles.RelativeTime)}\n# ` +
								addedEmojis.join(" "));
					sentReactedMessage = true;

					// wait 30 seconds for user to add their reactions
					// remove our emojis in the meantime
					await Promise.all([
						(async () => {
							for (let i = 0; i < addedEmojis.length; ++i) {
								const emoji = addedEmojis[i];
								if (!emoji) continue;
								try {
									await emoji.delete();
									addedEmojis[i] = null;
								} catch {}
							}
						})(),
						// not using reaction collector timeout here because we can't control when the timeout starts
						// we don't want to start the timer until after we have reacted
						await new Promise(res => setTimeout(res, timeout))
					]);
				} catch (err) {
					await reply("Failed to react");
					return;
				}
			})();
		} catch (err_) {
			err = err_;
			sentReactedMessage = false;
		}

		if (collector) collector.stop();

		// remove remaining emojis and reactions
		if (sentReactedMessage) {
			reply({
				content: "Removing leftover reactions and temporary emojis..."
			});
		}
		for (let i = 0; i < addedEmojis.length; ++i) {
			const emoji = addedEmojis[i];
			if (!emoji) continue;
			try {
				await emoji.delete();
				addedEmojis[i] = null;
			} catch {}
		}
		for (let i = 0; i < addedReactions.length; ++i) {
			const reaction = addedReactions[i];
			if (!reaction) continue;
			try {
				await reaction.users.remove();
				addedReactions[i] = null;
			} catch {}
		}
		if (sentReactedMessage) {
			reply({
				content: "Finished!"
			});
		}
		cooldown.delete(interaction.user.id);

		if (err) throw err;
	}
};
