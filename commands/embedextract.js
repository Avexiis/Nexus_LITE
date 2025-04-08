/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*******************************************************************************************************/
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embedextract')
    .setDescription('Extract embed JSON data from a given message URL.')
    .setDMPermission(false)
    .addStringOption(option =>
      option.setName('message_url')
        .setDescription('The URL of the message containing the embed.')
        .setRequired(true))
    .addBooleanOption(option =>
      option.setName('as_file')
        .setDescription('If true, the embed JSON will be sent as a text file instead of in the message.')),	
  
  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'This command can only be used in a server.',
        ephemeral: true,
      });
    }
    
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({
        content: 'You do not have the required permission to manage messages to use this command.',
        ephemeral: true,
      });
    }
    
    await interaction.deferReply();

    const messageUrl = interaction.options.getString('message_url');
    const asFileOption = interaction.options.getBoolean('as_file') || false;

    const regex = /https?:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/channels\/(\d+)\/(\d+)\/(\d+)/;
    const match = messageUrl.match(regex);
    if (!match) {
      return interaction.editReply('Invalid message URL provided.');
    }
    const [ , guildId, channelId, messageId ] = match;

    try {
      const channel = await interaction.client.channels.fetch(channelId);
      if (!channel) {
        return interaction.editReply('Channel not found.');
      }

      const message = await channel.messages.fetch(messageId);
      if (!message) {
        return interaction.editReply('Message not found.');
      }

      if (message.embeds.length === 0) {
        return interaction.editReply('No embeds found in the provided message.');
      }

      const embedData = message.embeds[0].toJSON();
      const jsonString = JSON.stringify(embedData, null, 2);

      if (asFileOption || jsonString.length > 1900) {
        const buffer = Buffer.from(jsonString, 'utf8');
        return interaction.editReply({
          content: '"Send as file" option selected, or the embed JSON data is too large to display here, sending as file:',
          files: [{
            attachment: buffer,
            name: 'embed.json'
          }]
        });
      } else {
        return interaction.editReply({
          content: `Embed JSON:\n\`\`\`json\n${jsonString}\n\`\`\``
        });
      }
    } catch (error) {
      console.error(error);
      return interaction.editReply(`Error fetching message: ${error.message}`);
    }
  }
};
