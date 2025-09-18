# Lowballer Rating Discord Bot

A comprehensive Discord bot for rating Hypixel Skyblock lowballers based on their behavior and trading practices. This bot helps Discord servers maintain a community-driven rating system for lowballers.

## Features

### 🎯 Core Features
- **Rate Lowballers**: Rate players from 1-10 based on their lowballing behavior
- **Player Verification**: Integration with Hypixel API to verify players and fetch stats
- **Profile System**: View detailed profiles of lowballers with ratings and comments
- **Search Functionality**: Search for lowballers by username
- **Leaderboards**: View best and worst lowballers in the community
- **Persistent Storage**: SQLite database for storing all ratings and user data

### ⚙️ Admin Features
- **Server Settings**: Configure rating channels, admin roles, and rating limits
- **Moderation Tools**: Manage ratings and user data
- **Customizable Limits**: Set custom minimum and maximum rating values

### 🔧 Technical Features
- **Slash Commands**: Modern Discord slash command interface
- **Rate Limiting**: Built-in rate limiting for Hypixel API calls
- **Error Handling**: Comprehensive error handling and user feedback
- **Database Management**: Automatic database initialization and maintenance

## Installation

### Prerequisites
- Node.js 16.0.0 or higher
- A Discord bot token
- A Hypixel API key (optional but recommended)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lowballer-discord-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Discord Bot Configuration
   DISCORD_TOKEN=your_discord_bot_token_here
   CLIENT_ID=your_discord_application_id_here
   GUILD_ID=your_test_guild_id_here

   # Hypixel API Configuration
   HYPIXEL_API_KEY=your_hypixel_api_key_here

   # Database Configuration
   DATABASE_PATH=./data/ratings.db

   # Bot Configuration
   PREFIX=!
   MAX_RATING=10
   MIN_RATING=1
   ```

4. **Deploy slash commands**
   ```bash
   npm run deploy
   ```

5. **Start the bot**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

## Discord Bot Setup

### Creating a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section
4. Click "Add Bot"
5. Copy the bot token and add it to your `.env` file
6. Go to the "OAuth2" > "URL Generator" section
5. Select "bot" and "applications.commands" scopes
6. Select necessary permissions (Send Messages, Use Slash Commands, etc.)
7. Use the generated URL to invite the bot to your server

### Required Permissions
- Send Messages
- Use Slash Commands
- Embed Links
- Read Message History
- Add Reactions

## Hypixel API Setup

1. Go to [Hypixel API](https://api.hypixel.net/)
2. Log in with your Minecraft account
3. Generate an API key
4. Add the key to your `.env` file

**Note**: The Hypixel API key is optional but recommended for player verification and stats.

## Commands

### User Commands

#### `/rate <username> <rating> [comment]`
Rate a lowballer based on their behavior.
- **username**: Minecraft username of the lowballer
- **rating**: Rating from 1-10 (1 = worst, 10 = best)
- **comment**: Optional comment about the lowballer (max 500 characters)

#### `/profile <username>`
View a lowballer's rating profile and statistics.

#### `/search <query>`
Search for lowballers by username.

#### `/leaderboard [type] [limit]`
View the lowballer leaderboard.
- **type**: "best" or "worst" (default: best)
- **limit**: Number of players to show (1-20, default: 10)

### Admin Commands

#### `/settings view`
View current bot settings for the server.

#### `/settings rating-channel <channel>`
Set the channel for rating notifications.

#### `/settings admin-role <role>`
Set the admin role for bot management.

#### `/settings rating-limits <min> <max>`
Set the minimum and maximum rating values.

## Database Schema

The bot uses SQLite with the following tables:

- **users**: Stores Discord user information
- **lowballers**: Stores lowballer profiles and statistics
- **ratings**: Stores individual ratings and comments
- **guild_settings**: Stores server-specific bot settings

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DISCORD_TOKEN` | Discord bot token | Yes | - |
| `CLIENT_ID` | Discord application ID | Yes | - |
| `GUILD_ID` | Test guild ID (for development) | No | - |
| `HYPIXEL_API_KEY` | Hypixel API key | No | - |
| `DATABASE_PATH` | Path to SQLite database | No | `./data/ratings.db` |
| `MAX_RATING` | Maximum rating value | No | `10` |
| `MIN_RATING` | Minimum rating value | No | `1` |

### Server Settings

Each server can configure:
- Rating notification channel
- Admin role for bot management
- Custom rating limits (1-10)
- Moderation settings

## Development

### Project Structure
```
src/
├── commands/           # Slash command implementations
│   ├── rate/          # Rate command
│   ├── profile/       # Profile command
│   ├── search/        # Search command
│   ├── leaderboard/   # Leaderboard command
│   └── settings/      # Settings command
├── utils/             # Utility functions
│   ├── database.js    # Database operations
│   ├── hypixel.js     # Hypixel API integration
│   ├── commandLoader.js # Command loading system
│   └── scheduler.js   # Scheduled tasks
├── index.js           # Main bot file
└── deploy-commands.js # Command deployment script
```

### Adding New Commands

1. Create a new folder in `src/commands/`
2. Create an `index.js` file with the command structure:
   ```javascript
   const { SlashCommandBuilder } = require('discord.js');

   module.exports = {
       data: new SlashCommandBuilder()
           .setName('commandname')
           .setDescription('Command description'),
       
       async execute(interaction) {
           // Command logic here
       }
   };
   ```
3. Deploy commands: `npm run deploy`

### Database Operations

Use the database utility for all database operations:
```javascript
const { database } = require('./utils/database');

// Create a rating
await database.createRating(lowballerUuid, raterId, rating, comment);

// Get lowballer data
const lowballer = await database.getLowballer(uuid);
```

## Troubleshooting

### Common Issues

1. **Bot not responding to commands**
   - Check if commands are deployed: `npm run deploy`
   - Verify bot has proper permissions
   - Check console for errors

2. **Hypixel API errors**
   - Verify API key is correct
   - Check rate limiting (bot has built-in rate limiting)
   - Ensure player exists and has Skyblock stats

3. **Database errors**
   - Check if data directory exists
   - Verify database file permissions
   - Check console for SQL errors

### Logs

The bot logs important events to the console:
- ✅ Successful operations
- ❌ Errors and failures
- ⚠️ Warnings
- 📊 Statistics and counts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please:
1. Check the troubleshooting section
2. Look at existing issues
3. Create a new issue with detailed information

## Changelog

### Version 1.0.0
- Initial release
- Basic rating system
- Hypixel API integration
- Slash commands
- Database storage
- Admin settings
- Search and leaderboard functionality
