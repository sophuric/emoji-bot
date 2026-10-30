<h2 align="center">
Discord Emoji Reaction bot<br/><br/>
</h2>

### Allows users without Nitro to react to messages with emojis from other servers or animated emojis.

## Setup

### Standalone

- Install Node.js
- Run `npm i`
- Run `npm run build`
- Edit `.env` and set the environment variables: (`KEY=VALUE` each line)
  - `TOKEN` (Bot's token. Keep this confidential.)
  - `CLIENT_ID` (Client ID, or Application ID.)
  - `GUILD_ID` (Guild/Server you want the bot to temporarily upload emojis to.)
  - `DATABASE_PATH` (Optional. Path to a directory where per-server configuration is stored.)
- Run `npm run register` to register the slash commands with Discord
- Run `npm start` to run the bot

### Docker

To-Do
