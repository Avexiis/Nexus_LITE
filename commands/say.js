/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*******************************************************************************************************/
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Send a message as the bot to a specified channel.')
    .setDMPermission(false)
    .addStringOption(option =>
      option.setName('text')
        .setDescription('The message to send.')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel where the message should be sent. (Optional)')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'This command can only be used in a server.',
        ephemeral: true,
      });
    }

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({
        content: 'You do not have the required permission to use this command.',
        ephemeral: true,
      });
    }

    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
    const text = interaction.options.getString('text');

    if (!targetChannel || !targetChannel.isTextBased()) {
      return interaction.reply({
        content: 'Please select a valid text channel.',
        ephemeral: true,
      });
    }

    const botMember = await interaction.guild.members.fetchMe();
    if (!targetChannel.permissionsFor(botMember).has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({
        content: 'I do not have permission to send messages in that channel.',
        ephemeral: true,
      });
    }

    try {
      await targetChannel.send({
        content: text,
        allowedMentions: { parse: ['users', 'roles'] }
      });
      
      await interaction.reply({
        content: `Message sent to ${targetChannel}.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: `Error sending message: ${error.message}`,
        ephemeral: true,
      });
    }
  }
};
