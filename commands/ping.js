/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*******************************************************************************************************/
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with ping and latency information!'),

  async execute(interaction, client) {
    try {
      let websocketPing = client.ws.ping >= 0 ? Math.round(client.ws.ping) : 'N/A';

      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
      }

      const sent = await interaction.editReply({ content: 'Pinging...', fetchReply: true });
      const messagePing = sent.createdTimestamp - interaction.createdTimestamp;

      const totalSeconds = Math.floor(client.uptime / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      const startTime = Math.floor(client.readyTimestamp / 1000);

      const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('Network & Uptime information')
        .addFields(
          { name: '🏓 WS Ping Speed', value: `${websocketPing}ms`, inline: true },
          { name: '📶 Message Send Speed', value: `${messagePing}ms`, inline: true },
          { name: '⏰ Current Uptime', value: `${uptime}`, inline: false },
          { name: '🕒 Startup Time', value: `<t:${startTime}:f>`, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ content: null, embeds: [embed] });
    } catch (error) {
      console.error('Error executing Ping command:', error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error executing that command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error executing that command!', ephemeral: true });
      }
    }
  },
};
