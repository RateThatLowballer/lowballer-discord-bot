const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder } = require('discord.js');
const { loadCommands } = require('./utils/commandLoader');
const { initializeDatabase } = require('./utils/database');
const { scheduleTasks } = require('./utils/scheduler');
const { handleInteraction } = require('./utils/interactionHandler');
require('dotenv').config();

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Create collections for commands
client.commands = new Collection();

// Bot ready event
client.once(Events.ClientReady, async (readyClient) => {
    console.log(`✅ Bot is ready! Logged in as ${readyClient.user.tag}`);
    console.log(`📊 Serving ${readyClient.guilds.cache.size} guilds`);
    
    // Initialize database
    await initializeDatabase();
    console.log('🗄️ Database initialized');
    
    // Load commands
    await loadCommands(client);
    console.log('⚡ Commands loaded');
    
    // Schedule recurring tasks
    scheduleTasks(client);
    console.log('⏰ Scheduled tasks started');
    
    // Set bot status
    client.user.setActivity('for lowballers to rate', { type: 'WATCHING' });
});

// Handle interactions (slash commands and select menus)
client.on(Events.InteractionCreate, async (interaction) => {
    // Handle select menu interactions
    if (interaction.isStringSelectMenu()) {
        await handleInteraction(interaction);
        return;
    }

    // Handle slash command interactions
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`❌ Command ${interaction.commandName} not found`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`❌ Error executing command ${interaction.commandName}:`, error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Error')
            .setDescription('An error occurred while executing this command. Please try again later.')
            .setTimestamp();

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
});

// Handle errors
client.on('error', (error) => {
    console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled promise rejection:', error);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
