const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { database } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Configure bot settings for this server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current bot settings')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('rating-channel')
                .setDescription('Set the channel for rating notifications')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to use for rating notifications')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('admin-role')
                .setDescription('Set the admin role for bot management')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role that can manage bot settings')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('rating-limits')
                .setDescription('Set the minimum and maximum rating values')
                .addIntegerOption(option =>
                    option.setName('min')
                        .setDescription('Minimum rating value')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(10)
                )
                .addIntegerOption(option =>
                    option.setName('max')
                        .setDescription('Maximum rating value')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(10)
                )
        ),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Permission Denied')
                .setDescription('You need Administrator permissions to use this command.')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        try {
            switch (subcommand) {
                case 'view':
                    await this.handleViewSettings(interaction, guildId);
                    break;
                case 'rating-channel':
                    await this.handleRatingChannel(interaction, guildId);
                    break;
                case 'admin-role':
                    await this.handleAdminRole(interaction, guildId);
                    break;
                case 'rating-limits':
                    await this.handleRatingLimits(interaction, guildId);
                    break;
            }
        } catch (error) {
            console.error('Error in settings command:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Error')
                .setDescription(`Failed to update settings: ${error.message}`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    async handleViewSettings(interaction, guildId) {
        const settings = await database.getGuildSettings(guildId);
        
        const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle('⚙️ Bot Settings')
            .setDescription('Current configuration for this server')
            .addFields(
                {
                    name: 'Rating Channel',
                    value: settings?.rating_channel_id ? `<#${settings.rating_channel_id}>` : 'Not set',
                    inline: true
                },
                {
                    name: 'Admin Role',
                    value: settings?.admin_role_id ? `<@&${settings.admin_role_id}>` : 'Not set',
                    inline: true
                },
                {
                    name: 'Rating Limits',
                    value: `${settings?.min_rating || 1} - ${settings?.max_rating || 10}`,
                    inline: true
                }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handleRatingChannel(interaction, guildId) {
        const channel = interaction.options.getChannel('channel');
        
        const settings = await database.getGuildSettings(guildId) || {};
        settings.ratingChannelId = channel.id;
        
        await database.updateGuildSettings(guildId, settings);

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Settings Updated')
            .setDescription(`Rating channel set to ${channel}`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handleAdminRole(interaction, guildId) {
        const role = interaction.options.getRole('role');
        
        const settings = await database.getGuildSettings(guildId) || {};
        settings.adminRoleId = role.id;
        
        await database.updateGuildSettings(guildId, settings);

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Settings Updated')
            .setDescription(`Admin role set to ${role}`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handleRatingLimits(interaction, guildId) {
        const minRating = interaction.options.getInteger('min');
        const maxRating = interaction.options.getInteger('max');

        if (minRating >= maxRating) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Invalid Settings')
                .setDescription('Minimum rating must be less than maximum rating.')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const settings = await database.getGuildSettings(guildId) || {};
        settings.minRating = minRating;
        settings.maxRating = maxRating;
        
        await database.updateGuildSettings(guildId, settings);

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Settings Updated')
            .setDescription(`Rating limits set to ${minRating} - ${maxRating}`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
