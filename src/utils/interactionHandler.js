const { EmbedBuilder } = require('discord.js');
const { database } = require('./database');
const { hypixelAPI } = require('./hypixel');

async function handleInteraction(interaction) {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'lowballer_select') {
        await handleLowballerSelect(interaction);
    }
}

async function handleLowballerSelect(interaction) {
    await interaction.deferReply();

    const selectedUuid = interaction.values[0];
    
    try {
        // Get lowballer data
        const lowballerData = await database.getLowballer(selectedUuid);
        
        if (!lowballerData) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Error')
                .setDescription('Lowballer data not found.')
                .setTimestamp();

            return await interaction.editReply({ embeds: [embed] });
        }

        // Get recent ratings
        const recentRatings = await database.getRatings(selectedUuid, 5);

        // Create profile embed
        const embed = new EmbedBuilder()
            .setColor(getRatingColor(lowballerData.average_rating))
            .setTitle(`📊 ${lowballerData.username}'s Profile`)
            .setDescription(`**${lowballerData.username}** has been rated by the community`)
            .addFields(
                { name: 'Average Rating', value: `${lowballerData.average_rating.toFixed(1)}/10`, inline: true },
                { name: 'Total Ratings', value: `${lowballerData.total_ratings}`, inline: true },
                { name: 'Rating Status', value: getRatingStatus(lowballerData.average_rating), inline: true }
            )
            .setThumbnail(hypixelAPI.getPlayerHeadURL(selectedUuid))
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

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error handling lowballer select:', error);
        
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Error')
            .setDescription(`Failed to get lowballer profile: ${error.message}`)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
}

function getRatingColor(rating) {
    if (rating >= 8) return '#00FF00';
    if (rating >= 6) return '#FFFF00';
    if (rating >= 4) return '#FFA500';
    return '#FF0000';
}

function getRatingStatus(rating) {
    if (rating >= 8) return '🟢 Excellent Lowballer';
    if (rating >= 6) return '🟡 Good Lowballer';
    if (rating >= 4) return '🟠 Average Lowballer';
    return '🔴 Poor Lowballer';
}

module.exports = { handleInteraction };
