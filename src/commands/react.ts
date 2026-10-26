import { type Command } from "../commands.js";
import { SlashCommandBuilder } from "discord.js";
export default <Command>{
	data: new SlashCommandBuilder()
		.setName("react")
		.setDescription("React to a message with emojis")
		.addStringOption(o => o.setName("message").setDescription("Message ID").setRequired(true))
		.addStringOption(o => o.setName("emojis").setDescription("String of emojis to react with").setMinLength(5).setRequired(true)),
	execute: async interaction => {
		await interaction.reply("meow");
	}
};
