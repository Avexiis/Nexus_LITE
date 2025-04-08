/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*******************************************************************************************************/
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, UserFlagsBitField } = require('discord.js');
const { xeonLog } = require('../utils/logger');

function escapeMarkdown(text) {
  return text.replace(/([\\`*_~])/g, '\\$1');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Get detailed information about a user.')
    .setDMPermission(false)
    .addUserOption(option => 
      option.setName('user')
        .setDescription('Select a user to view information about.')
        .setRequired(true)
    ),
    
  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'This command can only be used in a server.',
        ephemeral: true
      });
    }
    
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return await interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
    }
    
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user');
    const targetMember = interaction.guild.members.cache.get(targetUser.id);
    const escapedUserTag = escapeMarkdown(targetUser.tag);

    const dangerousPermissions = [];
    const allDangerousPermissions = [
      { name: 'Administrator', flag: PermissionsBitField.Flags.Administrator },
      { name: 'Manage Channels', flag: PermissionsBitField.Flags.ManageChannels },
      { name: 'Manage Messages', flag: PermissionsBitField.Flags.ManageMessages },
      { name: 'Moderate Members', flag: PermissionsBitField.Flags.ModerateMembers },
      { name: 'Kick Members', flag: PermissionsBitField.Flags.KickMembers },
      { name: 'Ban Members', flag: PermissionsBitField.Flags.BanMembers },
      { name: 'Manage Roles', flag: PermissionsBitField.Flags.ManageRoles },
      { name: 'Manage Guild', flag: PermissionsBitField.Flags.ManageGuild }
    ];
    if (targetMember) {
      allDangerousPermissions.forEach(permission => {
        if (targetMember.permissions.has(permission.flag)) {
          dangerousPermissions.push(permission.name);
        }
      });
    }
    const dangerousPermissionsField = dangerousPermissions.join(', ') || 'None';

    const userEmbed = new EmbedBuilder()
      .setTitle(`__${escapedUserTag}'s Information__`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
      .setColor(targetMember?.displayHexColor || '#000000')
      .addFields(
        { name: 'Username', value: targetUser.tag, inline: true },
        { name: 'User ID', value: targetUser.id, inline: true },
        { name: 'Bot Account', value: targetUser.bot ? 'Yes' : 'No', inline: true },
        { name: 'Account Creation', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`, inline: true }
      );

    if (targetMember) {
      const statusMap = {
        online: 'Online',
        idle: 'Idle',
        dnd: 'Do Not Disturb',
        offline: 'Offline/Unknown'
      };
      const rawStatus = targetMember.presence?.status || 'offline';
      const status = statusMap[rawStatus] || rawStatus;

      const activities = targetMember.presence?.activities;
      const activityDescriptions = activities && activities.length > 0 
        ? activities.map(act => act.name).join(', ') 
        : 'None';

      const roles = targetMember.roles.cache
        .filter(role => role.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position)
        .map(role => role.toString());

      userEmbed.addFields(
        { name: 'Server Nickname', value: targetMember.nickname || 'None', inline: true },
        { name: 'Joined Server On', value: `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:F>`, inline: true },
        { name: 'Roles', value: roles.length ? roles.join(', ') : 'None', inline: false },
        { name: 'Highest Role', value: targetMember.roles.highest.toString(), inline: true },
        { name: 'Boosting Server', value: targetMember.premiumSince ? `<t:${Math.floor(targetMember.premiumSinceTimestamp / 1000)}:F>` : 'Not Boosting', inline: true },
        { name: 'Online Status', value: status, inline: true },
        { name: 'Current Activity', value: activityDescriptions, inline: true },
        { name: 'Dangerous Permissions', value: dangerousPermissionsField, inline: false }
      );
    } else {
      userEmbed.addFields(
        { name: 'Server Status', value: 'User is not a member of this server', inline: false }
      );
    }

    if (targetUser.accentColor) {
      userEmbed.addFields({ name: 'Accent Color', value: `#${targetUser.accentColor.toString(16)}`, inline: true });
    }
    if (targetUser.banner) {
      userEmbed.setImage(targetUser.bannerURL({ dynamic: true, size: 512 }));
    }

    xeonLog('info', `User ${interaction.user.tag} requested info for ${targetUser.tag}`);
    await interaction.editReply({ embeds: [userEmbed] });
  },
};
