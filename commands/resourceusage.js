/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*******************************************************************************************************/
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const si = require('systeminformation');
const { xeonLog } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resourceusage')
    .setDescription('Displays resource usage of the bot and system.'),
  async execute(interaction) {
	if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return interaction.reply({
            content: "You do not have permission to use this command.",
                ephemeral: true,
            });
        }
    try {
      await interaction.deferReply();

      const initialBotCpu = process.cpuUsage();
      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 500));
      const elapsed = Date.now() - startTime;
      const botMemory = process.memoryUsage();

      const cpu = await si.currentLoad();
      const memory = await si.mem();
      const disk = await si.fsSize();

      const basicText = 
`**System CPU Usage:** ${cpu.currentLoad.toFixed(2)}%
**System Memory Usage:** ${(memory.active / 1024 / 1024 / 1024).toFixed(2)} GB / ${(memory.total / 1024 / 1024 / 1024).toFixed(2)} GB
**Bot Memory Usage:** ${(botMemory.rss / 1024 / 1024).toFixed(2)} MB
**Disk Usage:** Total: ${(disk[0].size / 1024 / 1024 / 1024).toFixed(2)} GB, Used: ${(disk[0].used / 1024 / 1024 / 1024).toFixed(2)} GB`;

      const basicEmbed = new EmbedBuilder()
        .setTitle('Resource Usage')
        .setDescription(basicText)
        .setColor(0x00BBFF);

      await interaction.editReply({ embeds: [basicEmbed] });
    } catch (error) {
      xeonLog('error', `Error in resourceusage command: ${error.message}`);
      await interaction.editReply({ content: 'There was an error fetching resource usage data.' });
    }
  },
};
