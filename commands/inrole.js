/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*******************************************************************************************************/
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { xeonLog } = require('../utils/logger');
const { loadConfig } = require('../utils/configManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inrole')
    .setDescription('List all users in a specified role, or those with no roles if none is provided.')
    .setDMPermission(false)
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Select a role to list users for. Leave empty to search for users with no roles.')
        .setRequired(false)),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'This command can only be used in a server.',
        ephemeral: true,
      });
    }
    
    const selectedRole = interaction.options.getRole('role');
    const member = interaction.member;

    const config = loadConfig();
    const guildId = interaction.guild.id;
    const guildConfig = config[guildId] || {};
    const closeRoleId = guildConfig.close;

    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      xeonLog('warn', `${interaction.user.tag} tried to use /inrole without permission.`);
      return await interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    try {
      await interaction.deferReply();

      const fetchedMembers = await interaction.guild.members.fetch({ force: true });

      const roleMembers = fetchedMembers
        .filter(member => {
          if (selectedRole) {
            return member.roles.cache.has(selectedRole.id);
          } else {
            return member.roles.cache.size === 1;
          }
        })
        .map(member => `- @\u200B${member.user.tag}\u00A0(<@${member.user.id}>)`);

      if (roleMembers.length === 0) {
        if (selectedRole) {
          return await interaction.editReply({
            content: `No members found with the role ${selectedRole.name}.`,
          });
        } else {
          return await interaction.editReply({
            content: `No members found with no roles.`,
          });
        }
      }

      const itemsPerPage = 20; // Users per page
      const totalPages = Math.ceil(roleMembers.length / itemsPerPage);
      let currentPage = 0;

      const generateEmbed = (page) => {
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const pageMembers = roleMembers.slice(start, end);
        const displayEnd = Math.min(end, roleMembers.length);

        const title = selectedRole ? `Users with role: ${selectedRole.name}` : "Users with no roles";

        return new EmbedBuilder()
          .setTitle(title)
          .setDescription(pageMembers.join('\n') + "\n-# Clickable profiles will appear if they're cached.")
          .setColor('Blue')
          .setFooter({ text: `${start + 1}-${displayEnd} of ${roleMembers.length} | Page ${page + 1} of ${totalPages}` })
          .setTimestamp();
      };

      const getActionRow = (currentPage) => {
        const buttons = [];
        buttons.push(
          new ButtonBuilder()
            .setCustomId('first_page')
            .setLabel('⏮️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === 0)
        );
        buttons.push(
          new ButtonBuilder()
            .setCustomId('prev_page')
            .setLabel('⏪')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0)
        );
        buttons.push(
          new ButtonBuilder()
            .setCustomId('next_page')
            .setLabel('⏩')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages - 1)
        );
        buttons.push(
          new ButtonBuilder()
            .setCustomId('last_page')
            .setLabel('⏭️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === totalPages - 1)
        );
        return new ActionRowBuilder().addComponents(buttons);
      };

      const replyMessage = await interaction.editReply({
        embeds: [generateEmbed(currentPage)],
        components: totalPages > 1 ? [getActionRow(currentPage)] : [],
      });

      if (totalPages <= 1) return;

      const collector = replyMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
      });

      collector.on('collect', async (btnInteraction) => {
        if (btnInteraction.user.id !== interaction.user.id) {
          return btnInteraction.reply({ content: "Only the person who ran the command can use these buttons.", ephemeral: true });
        }

        switch (btnInteraction.customId) {
          case 'first_page':
            currentPage = 0;
            break;
          case 'prev_page':
            if (currentPage > 0) currentPage--;
            break;
          case 'next_page':
            if (currentPage < totalPages - 1) currentPage++;
            break;
          case 'last_page':
            currentPage = totalPages - 1;
            break;
          default:
            break;
        }

        await btnInteraction.update({
          embeds: [generateEmbed(currentPage)],
          components: [getActionRow(currentPage)],
        });
      });

      collector.on('end', async () => {
        await interaction.editReply({ components: [] }).catch(() => {});
      });

    } catch (error) {
      xeonLog('error', `Error fetching members: ${error.message}`);
      await interaction.editReply({
        content: 'There was an error while fetching members. Please try again later.',
      });
    }
  },
};
