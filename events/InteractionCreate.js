/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*******************************************************************************************************/
const {
  Events,
  ButtonBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
  PermissionsBitField,
} = require('discord.js');
const { xeonLog } = require('../utils/logger');
const { loadConfig, saveConfig } = require('../utils/configManager');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        xeonLog('ERROR', `No command matching ${interaction.commandName} was found for autocomplete.`);
        return;
      }
      try {
        if (typeof command.autocomplete === 'function') {
          await command.autocomplete(interaction, client);
        } else {
          await interaction.respond([]);
        }
      } catch (error) {
        xeonLog('ERROR', `Error handling autocomplete for ${interaction.commandName}: ${error.message}`);
      }
      return;
    }

    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        xeonLog('ERROR', `No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        const commandName = interaction.commandName;
        const userTag = interaction.user.tag;
        const channelName = interaction.channel ? interaction.channel.name : 'DM';
        const guildName = interaction.guild ? interaction.guild.name : 'Direct Message';

        xeonLog(
          'INFO',
          `Command ${commandName} run by ${userTag} in channel ${channelName} in server ${guildName}`
        );

        await command.execute(interaction, client);
      } catch (error) {
        xeonLog('ERROR', `Error executing ${interaction.commandName}: ${error.message}`);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: 'There was an error executing that command.',
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: 'There was an error executing that command.',
            ephemeral: true,
          });
        }
      }
      return;
    }
  },
};
