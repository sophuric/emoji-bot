<h2 align="center">
Discord Emoji Reaction bot<br/><br/>
</h2>

### Allows users without Nitro to react to messages with emojis from other servers or animated emojis.

## Setup

### Standalone

1. Navigate to [Discord Developer Portal](https://discord.com/developers/applications) to create a new application
2. Install Node.js
3. Clone/download the repo
    - If you have Git, run `git clone https://github.com/sophuric/emoji-bot`
    - Otherwise, [download the ZIP](https://github.com/sophuric/emoji-bot/archive/refs/heads/main.zip) and extract it
4. Run `npm i`
5. Run `npm run build`
6. Create `.env`, and edit the file to set the environment variables. See [Environment Variables](#environment-variables).
7. Run `npm run register` to register the slash commands with Discord
8. Run `npm start` to run the bot

### Docker

See [`sophur/emoji-bot` on Docker Hub](https://hub.docker.com/r/sophur/emoji-bot)

1. Navigate to [Discord Developer Portal](https://discord.com/developers/applications) to create a new application
2. Create `compose.yaml`:
    ```yaml
    services:
      emoji-bot:
        image: sophur/emoji-bot:latest
        volumes:
          - ./database:/bot/db
        environment:
          - TOKEN=${TOKEN}
          - CLIENT_ID=${CLIENT_ID}
          - GUILD_ID=${GUILD_ID}
    volumes:
      database:
    ```
3. Create `.env`, and edit the file to set the environment variables. See [Environment Variables](#environment-variables). You do NOT need to set `DATAPATH_PATH`.

## Environment Variables

Edit the `.env` file. Each line is formatted as `KEY=VALUE`. Here are the environment variables you can set:

- `TOKEN`
    - Keep this confidential.
    - [Application](https://discord.com/developers/applications/) → Bot → Token.
- `CLIENT_ID`
    - [Application](https://discord.com/developers/applications/) → Application ID.
- `GUILD_ID`
    - Guild/Server you want the bot to temporarily upload emojis to.
    - Enable [User Settings → Developer](https://discord.com/settings/advanced) → Developer Mode, then right click a server → Copy Server ID.
- `DATABASE_PATH`
    - Optional. Path to a directory where per-server configuration is stored.
