import { type Command } from "../commands.js";
import { InteractionContextType, SlashCommandBuilder } from "discord.js";

export default <Command>{
	data: new SlashCommandBuilder()
		.setName("about")
		.setDescription("Show bot information")
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
	execute: async (_, { reply }) => {
		await reply(
			"# [Reaction Emoji Bot](https://github.com/sophuric/emoji-bot)\n" +
			"Allows users without Nitro to react to messages with emojis from other servers or animated emojis.\n" +
			"Programmed by [sophur](https://github.com/sophuric)\n" +
			"[Source code](https://github.com/sophuric/emoji-bot)\n" +
			"[Submit bug reports here](https://github.com/sophuric/emoji-bot/issues)\n" +
			"Licensed under [MPL-2.0](https://github.com/sophuric/emoji-bot/blob/main/LICENSE)"
		);
	}
};
