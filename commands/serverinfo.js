/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*******************************************************************************************************/
const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Get detailed information about this server.'),
  
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const guild = interaction.guild;
    if (!guild) {
      return interaction.editReply('This command can only be used in a server.');
    }

    const owner = await guild.fetchOwner();

    const onlineCount = guild.members.cache.filter(
      member => member.presence && member.presence.status !== 'offline'
    ).size;

    const totalChannels = guild.channels.cache.size;
    const textChannels = guild.channels.cache.filter(
      channel => channel.type === ChannelType.GuildText
    ).size;
    const voiceChannels = guild.channels.cache.filter(
      channel => channel.type === ChannelType.GuildVoice
    ).size;
    const stageChannels = guild.channels.cache.filter(
      channel => channel.type === ChannelType.GuildStageVoice
    ).size;

    const emojiCount = guild.emojis.cache.size;
    const stickerCount = guild.stickers.cache.size;
    const roleCount = guild.roles.cache.size;
    const botCount = guild.members.cache.filter(
      member => member.user.bot
    ).size;

    const boostCount = guild.premiumSubscriptionCount || 0;
    const boostTier = guild.premiumTier || 0;

    const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);

    const serverEmbed = new EmbedBuilder()
      .setTitle(`__${guild.name} - Server Information__`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
      .setImage(guild.bannerURL({ dynamic: true, size: 512 }) || null)
      .setColor(guild.members.me.displayHexColor || '#0099ff')
      .addFields(
        { name: '__Owner__', value: `**${owner.user.tag}**`, inline: true },
        { name: '__Total Members__', value: `**${guild.memberCount}**`, inline: true },
        { name: '__Online Members__', value: `**${onlineCount}**`, inline: true },
        { 
          name: '__Channels__', 
          value: `**Total**: *${totalChannels}*\n**Text**: *${textChannels}*\n**Voice**: *${voiceChannels}*\n**Stage**: *${stageChannels}*`, 
          inline: false 
        },
        { 
          name: '__Emojis & Stickers__', 
          value: `**Emojis**: ${emojiCount}\n**Stickers**: ${stickerCount}`, 
          inline: false 
        },
        { name: '__Roles__', value: `**${roleCount}**`, inline: true },
        { name: '__Bot Count__', value: `**${botCount}**`, inline: true },
        { name: '__Server Boosts__', value: `**${boostCount}** (Tier ${boostTier})`, inline: true },
        { 
          name: '__Server Created__', 
          value: `<t:${createdTimestamp}:F>\n(<t:${createdTimestamp}:R>)`, 
          inline: false 
        }
      );

    return interaction.editReply({ embeds: [serverEmbed] });
  },
};
