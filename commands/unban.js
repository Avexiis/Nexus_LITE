/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*******************************************************************************************************/
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { xeonLog } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('The ID of the user to unban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for unbanning (optional)')
        .setRequired(false)),

  async execute(interaction) {
    const userId = interaction.options.getString('user_id');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      await interaction.guild.members.unban(userId, `Unbanned by ${interaction.user.tag}: ${reason}`);
      await interaction.reply({ content: `User with ID ${userId} has been unbanned.`, ephemeral: true });

      xeonLog('info', `User with ID ${userId} was unbanned by ${interaction.user.tag}. Reason: ${reason}`);
    } catch (error) {
      xeonLog('error', `Failed to unban user with ID ${userId}: ${error.message}`);

      await interaction.reply({ content: `Failed to unban user with ID ${userId}: ${error.message}`, ephemeral: true });
    }
  },
};
