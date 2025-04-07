/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*******************************************************************************************************/
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { xeonLog } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user to timeout')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('Duration of the timeout')
        .setRequired(true)
        .addChoices(
          { name: '60 seconds', value: '60' },
          { name: '5 minutes', value: '300' },
          { name: '10 minutes', value: '600' },
          { name: '1 hour', value: '3600' },
          { name: '1 day', value: '86400' },
          { name: '1 week', value: '604800' },
        )),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const durationSeconds = parseInt(interaction.options.getString('duration'), 10);

    try {
      const member = await interaction.guild.members.fetch(target.id);
      await member.timeout(durationSeconds * 1000, `Timed out by ${interaction.user.tag}`);
      await interaction.reply({ content: `${target.tag} has been timed out for ${durationSeconds} seconds.`, ephemeral: true });
    } catch (error) {
      xeonLog('error', `Failed to timeout ${target.tag}: ${error.message}`);
      
      await interaction.reply({ content: `Failed to timeout ${target.tag}: ${error.message}`, ephemeral: true });
    }
  },
};
