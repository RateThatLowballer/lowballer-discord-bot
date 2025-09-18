const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { database } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the lowballer leaderboard')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of leaderboard to view')
                .setRequired(false)
                .addChoices(
                    { name: 'Best Lowballers', value: 'best' },
                    { name: 'Worst Lowballers', value: 'worst' }
                )
        )
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('Number of players to show (1-20)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(20)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const type = interaction.options.getString('type') || 'best';
        const limit = interaction.options.getInteger('limit') || 10;

        try {
            let lowballers;
            let title;
            let color;

            if (type === 'best') {
                lowballers = await database.getTopLowballers(limit);
                title = '🏆 Best Lowballers';
                color = '#00FF00';
            } else {
                lowballers = await database.getWorstLowballers(limit);
                title = '💀 Worst Lowballers';
                color = '#FF0000';
            }

            if (lowballers.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('📊 No Data')
                    .setDescription('No lowballers have been rated yet.')
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            // Create leaderboard text
            const leaderboardText = lowballers.map((lowballer, index) => {
                const position = index + 1;
                const medal = this.getMedal(position);
                const rating = lowballer.average_rating.toFixed(1);
                const totalRatings = lowballer.total_ratings;
                const status = this.getRatingStatus(lowballer.average_rating);

                return `${medal} **${lowballer.username}** - ${rating}/10 (${totalRatings} ratings) ${status}`;
            }).join('\n');

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(title)
                .setDescription(leaderboardText)
                .setFooter({ text: `Showing top ${lowballers.length} lowballers` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in leaderboard command:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Error')
                .setDescription(`Failed to get leaderboard: ${error.message}`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    },

    getMedal(position) {
        switch (position) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `${position}.`;
        }
    },

    getRatingStatus(rating) {
        if (rating >= 8) return '🟢';
        if (rating >= 6) return '🟡';
        if (rating >= 4) return '🟠';
        return '🔴';
    }
};
