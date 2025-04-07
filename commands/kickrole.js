/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*
* Use this shit carefully.
* It has the capacity to kick thousands of members as fast as Discord API will allow.
*******************************************************************************************************/
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { xeonLog } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kickrole')
    .setDescription('Kick all members with a specific role.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role whose members should be kicked')
        .setRequired(true)),

  async execute(interaction) {
    const role = interaction.options.getRole('role');
    await interaction.deferReply({ ephemeral: true });
    await interaction.guild.members.fetch();

    const membersWithRole = interaction.guild.members.cache.filter(member => member.roles.cache.has(role.id));

    if (membersWithRole.size === 0) {
      return interaction.editReply({ content: `No members found with the role ${role.name}.` });
    }

    let kickedCount = 0;
    let failedCount = 0;
    const kickedMembers = [];

    for (const member of membersWithRole.values()) {
      try {
        if (member.kickable) {
          await member.kick(`Kicked by ${interaction.user.tag} using /kickrole command`);
          kickedCount++;
          kickedMembers.push(member.user.tag);
        } else {
          failedCount++;
          xeonLog('error', `Could not kick ${member.user.tag}: Missing permissions.`);
        }
      } catch (err) {
        failedCount++;
        xeonLog('error', `Could not kick ${member.user.tag}: ${err.message}`);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`Kicked Members with Role: ${role.name}`)
      .setDescription(kickedMembers.length > 0 ? kickedMembers.join('\n') : 'No members were kicked.')
      .setColor('Red')
      .setFooter({ text: `Kicked by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({
      content: `Successfully kicked ${kickedCount} members with the role ${role.name}.${failedCount > 0 ? ` Failed to kick ${failedCount} members.` : ''}`,
      embeds: [embed],
      ephemeral: true,
    });
  },
};
