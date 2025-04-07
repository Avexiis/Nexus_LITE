/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*******************************************************************************************************/
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { xeonLog } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user to ban')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('days')
        .setDescription('Number of days of messages to delete (0-7)')
        .setRequired(false)
        .addChoices(
          { name: '0 days', value: 0 },
          { name: '1 day', value: 1 },
          { name: '2 days', value: 2 },
          { name: '3 days', value: 3 },
          { name: '4 days', value: 4 },
          { name: '5 days', value: 5 },
          { name: '6 days', value: 6 },
          { name: '7 days', value: 7 },
        )),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const days = interaction.options.getInteger('days') || 0;

    try {
      await interaction.guild.members.ban(target.id, { days, reason: `Banned by ${interaction.user.tag}` }); //byeeeeeeeeee
      await interaction.reply({ content: `${target.tag} has been banned.`, ephemeral: true });
      
      xeonLog('info', `${target.tag} was banned by ${interaction.user.tag} for ${days} days of message deletion.`);
      
    } catch (error) {
      xeonLog('error', `Failed to ban ${target.tag}: ${error.message}`);
      
      await interaction.reply({ content: `Failed to ban ${target.tag}: ${error.message}`, ephemeral: true });
    }
  },
};
