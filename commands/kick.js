/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*******************************************************************************************************/
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { xeonLog } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user to kick')
        .setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('target');

    try {
      await interaction.guild.members.kick(target.id, `Kicked by ${interaction.user.tag}`);
      await interaction.reply({ content: `${target.tag} has been kicked.`, ephemeral: true });
    } catch (error) {
      xeonLog('error', `Failed to kick ${target.tag}: ${error.message}`);
      
      await interaction.reply({ content: `Failed to kick ${target.tag}: ${error.message}`, ephemeral: true });
    }
  },
};
