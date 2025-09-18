const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { database } = require('../../utils/database');
const { hypixelAPI } = require('../../utils/hypixel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View a lowballer\'s rating profile')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The Minecraft username of the lowballer')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const username = interaction.options.getString('username');

        try {
            // Get player stats from Hypixel
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

            // Get lowballer data from database
            const lowballerData = await database.getLowballer(lowballerUuid);
            
            if (!lowballerData || lowballerData.total_ratings === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('📊 No Ratings Found')
                    .setDescription(`**${username}** has not been rated yet.`)
                    .setThumbnail(hypixelAPI.getPlayerHeadURL(lowballerUuid, username))
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            // Get recent ratings
            const recentRatings = await database.getRatings(lowballerUuid, 5);

            // Create profile embed
            const embed = new EmbedBuilder()
                .setColor(this.getRatingColor(lowballerData.average_rating))
                .setTitle(`📊 ${username}'s Lowballer Profile`)
                .setDescription(`**${username}** has been rated by the community`)
                .addFields(
                    { name: 'Average Rating', value: `${lowballerData.average_rating.toFixed(1)}/10`, inline: true },
                    { name: 'Total Ratings', value: `${lowballerData.total_ratings}`, inline: true },
                    { name: 'Rating Status', value: this.getRatingStatus(lowballerData.average_rating), inline: true }
                )
                .setThumbnail(hypixelAPI.getPlayerHeadURL(lowballerUuid, username))
                .setTimestamp();

            // Add recent ratings if available
            if (recentRatings.length > 0) {
                const ratingsText = recentRatings.map(rating => 
                    `**${rating.rating}/10** - ${rating.comment || 'No comment'} *(${rating.rater_username || 'Unknown'})*`
                ).join('\n');

                embed.addFields({
                    name: 'Recent Ratings',
                    value: ratingsText.length > 1024 ? ratingsText.substring(0, 1021) + '...' : ratingsText,
                    inline: false
                });
            }

            // Hypixel stats removed for now

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in profile command:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Error')
                .setDescription(`Failed to get profile for **${username}**: ${error.message}`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    },

    getRatingColor(rating) {
        if (rating >= 8) return '#00FF00'; // Green
        if (rating >= 6) return '#FFFF00'; // Yellow
        if (rating >= 4) return '#FFA500'; // Orange
        return '#FF0000'; // Red
    },

    getRatingStatus(rating) {
        if (rating >= 8) return '🟢 Excellent Lowballer';
        if (rating >= 6) return '🟡 Good Lowballer';
        if (rating >= 4) return '🟠 Average Lowballer';
        return '🔴 Poor Lowballer';
    },

    formatNumber(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toString();
    }
};
