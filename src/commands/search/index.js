// Search command completely removed
// This file is kept for future reference but the command is not exported

// To re-enable search in the future, uncomment the code below:
/*
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { database } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for lowballers by username')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Search query (username)')
                .setRequired(true)
                .setMaxLength(50)
        ),

    async execute(interaction) {
        // Search implementation here
    }
};
*/
