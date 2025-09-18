const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { database } = require('../../utils/database');
const { hypixelAPI } = require('../../utils/hypixel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rate')
        .setDescription('Rate a lowballer based on their behavior')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The Minecraft username of the lowballer')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('rating')
                .setDescription('Rating from 1-10 (1 = worst lowballer, 10 = best lowballer)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(10)
        )
        .addStringOption(option =>
            option.setName('comment')
                .setDescription('Optional comment about the lowballer')
                .setRequired(false)
                .setMaxLength(500)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const username = interaction.options.getString('username');
        const rating = interaction.options.getInteger('rating');
        const comment = interaction.options.getString('comment');
        const raterId = interaction.user.id;

        try {
            // Verify the player exists on Hypixel
            const playerStats = await hypixelAPI.getPlayerStats(username);
            
            if (!playerStats.hasSkyblock) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Player Not Found')
                    .setDescription(`The player **${username}** was not found or doesn't have Skyblock stats.`)
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            const lowballerUuid = playerStats.uuid;

            // Check if user has already rated this lowballer
            const hasRated = await database.hasUserRated(lowballerUuid, raterId);
            if (hasRated) {
                const embed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('⚠️ Already Rated')
                    .setDescription(`You have already rated **${username}**. You can only rate each lowballer once.`)
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            // Create or update user record
            await database.createUser(raterId, null, interaction.user.username);

            // Create or update lowballer record
            await database.createLowballer(lowballerUuid, username);

            // Create rating
            await database.createRating(lowballerUuid, raterId, rating, comment);

            // Update lowballer statistics
            await database.updateLowballerStats(lowballerUuid);

            // Get updated lowballer data
            const lowballerData = await database.getLowballer(lowballerUuid);

            // Create success embed
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Rating Submitted')
                .setDescription(`Successfully rated **${username}**`)
                .addFields(
                    { name: 'Your Rating', value: `${rating}/10`, inline: true },
                    { name: 'Total Ratings', value: `${lowballerData.total_ratings}`, inline: true },
                    { name: 'Average Rating', value: `${lowballerData.average_rating.toFixed(1)}/10`, inline: true }
                )
                .setThumbnail(hypixelAPI.getPlayerHeadURL(lowballerUuid, username))
                .setTimestamp();

            if (comment) {
                embed.addFields({ name: 'Your Comment', value: comment, inline: false });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in rate command:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Error')
                .setDescription(`Failed to rate **${username}**: ${error.message}`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    },
};
