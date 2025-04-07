/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*******************************************************************************************************/
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { xeonLog } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hackban')
    .setDescription('Ban a user by ID who is not in the server.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('The ID of the user to ban')
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
    const userId = interaction.options.getString('user_id');
    const days = interaction.options.getInteger('days') || 0;

    try {
      await interaction.guild.members.ban(userId, { days, reason: `Hackbanned by ${interaction.user.tag}` });
      
      const banDuration = days === 0 ? 'permanent ban' : `${days} day(s) of message deletion`;
      
      await interaction.reply({ content: `User with ID ${userId} has been banned (${banDuration}).`, ephemeral: true });

      xeonLog('info', `User with ID ${userId} was hackbanned by ${interaction.user.tag}.`);

    } catch (error) {
      xeonLog('error', `Failed to hackban user ID ${userId}: ${error.message}`);

      await interaction.reply({ content: `Failed to ban user with ID ${userId}: ${error.message}`, ephemeral: true });
    }
  },
};
