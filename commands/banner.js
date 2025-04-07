/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*******************************************************************************************************/
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Displays the server banner image.'),

  async execute(interaction) {
    if (!interaction.guild.bannerURL()) {
      return interaction.reply({ content: 'This server does not have a banner set.', ephemeral: true });
    }

    const bannerUrl = interaction.guild.bannerURL({ format: 'png', size: 1024 }); //I dunno why it's so hard to grab this image without a bot but here we are
    const embed = new EmbedBuilder()
      .setTitle(`${interaction.guild.name} Server Banner`)
      .setImage(bannerUrl)
      .setColor('Blue');

    await interaction.reply({ embeds: [embed] });
  },
};
