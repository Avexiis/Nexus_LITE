/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*******************************************************************************************************/
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { xeonLog } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inchannel')
    .setDescription('List all users with access to a specified channel (Admins only).')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Select a channel to list users for.')
        .setRequired(true)),
  
  async execute(interaction) {
    const selectedChannel = interaction.options.getChannel('channel');
    const member = interaction.member;

    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      xeonLog('warn', `${interaction.user.tag} tried to use /inchannel without permissions.`);
      return await interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    try {
      await interaction.deferReply();

      const fetchedMembers = await interaction.guild.members.fetch({ force: true });

      const channelMembers = fetchedMembers
        .filter(member => 
          selectedChannel.permissionsFor(member).has(PermissionsBitField.Flags.ViewChannel) &&
          !member.user.bot
        )
        .map(member => `@\u200B${member.user.tag}`);

      if (channelMembers.length === 0) {
        return await interaction.editReply({
          content: `No members found with access to the channel ${selectedChannel.name}.`,
        });
      }

      const itemsPerPage = 20;
      const totalPages = Math.ceil(channelMembers.length / itemsPerPage);
      let currentPage = 0;

      const generateEmbed = (page) => {
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const pageMembers = channelMembers.slice(start, end);
        return new EmbedBuilder()
          .setTitle(`Users with access to: ${selectedChannel.name}`)
          .setDescription(pageMembers.join('\n'))
          .setColor('Blue')
          .setFooter({ text: `Page ${page + 1} of ${totalPages}` })
          .setTimestamp();
      };

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev_page')
          .setLabel('⬅️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('➡️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(totalPages <= 1)
      );

      const reply = await interaction.editReply({
        embeds: [generateEmbed(currentPage)],
        components: totalPages > 1 ? [row] : [],
      });

      if (totalPages <= 1) return;

      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
      });

      collector.on('collect', async (btnInteraction) => {
        if (btnInteraction.user.id !== interaction.user.id) {
          return btnInteraction.reply({ content: "You can't use these buttons.", ephemeral: true });
        }

        if (btnInteraction.customId === 'prev_page' && currentPage > 0) {
          currentPage--;
        } else if (btnInteraction.customId === 'next_page' && currentPage < totalPages - 1) {
          currentPage++;
        }

        await btnInteraction.update({
          embeds: [generateEmbed(currentPage)],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('prev_page')
                .setLabel('⬅️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 0),
              new ButtonBuilder()
                .setCustomId('next_page')
                .setLabel('➡️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === totalPages - 1)
            ),
          ],
        });
      });

      collector.on('end', async () => {
        await interaction.editReply({ components: [] }).catch(() => {});
      });

    } catch (error) {
      xeonLog('error', `Error fetching members for channel ${selectedChannel.name}: ${error.message}`);
      await interaction.editReply({
        content: 'There was an error while fetching members. Please try again later.',
      });
    }
  },
};
