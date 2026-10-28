import { type Command } from "../commands.js";
import { ChannelType, Guild, InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, SlashCommandSubcommandGroupBuilder, type Channel, type GuildResolvable } from "discord.js";
import { db } from "../database.js";

export async function getLogChannel(guild: Guild | null | undefined) {
	if (!guild) return null;

	const id = db.logChannelIDs.get(guild.id);
	if (id == null) return null;
	if (typeof id !== "string") throw new Error("Channel ID should be string, but it's not");

	const channel = await guild.channels.fetch(id);
	if (!channel) return null;
	if (!canChannelBeLoggedInto(channel)) return null;

	return channel;
}

function canChannelBeLoggedInto(channel: Channel) {
	return !channel.isDMBased() && channel.isSendable();
}

export default <Command>{
	data: new SlashCommandBuilder()
		.setName("reaction-log-channel")
		.setDescription("Manage logging usage of /react")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.setContexts(InteractionContextType.Guild)
		.addSubcommand(c => c.setName("get").setDescription("Get into what channel the bot logs"))
		.addSubcommand(c => c.setName("set").setDescription("Make the bot log into this channel")),
	execute: async (interaction, { reply, checkMyPermissions }) => {
		if (!interaction.guild) return;
		if (!interaction.channel) return;
		if (interaction.channel.isDMBased()) return;

		switch (interaction.options.getSubcommand()) {
			case "get":
				const channel = await getLogChannel(interaction.guild);
				if (channel) {
					await reply(`Currently logging into ${channel} in this guild`);
				} else {
					await reply("Not logging into any channel in this guild");
				}
				break;
			case "set":
				if (!canChannelBeLoggedInto(interaction.channel)) {
					await reply("Cannot log into this channel");
					return;
				}
				if (!await checkMyPermissions(PermissionFlagsBits.AddReactions | PermissionFlagsBits.UseExternalEmojis | PermissionFlagsBits.ViewChannel)) {
					return;
				}
				db.logChannelIDs.put(interaction.guild.id, interaction.channel.id);
				await reply({ content: `Now logging into ${interaction.channel} in this guild`, flags: undefined });
				break;
		}
	}
};
