/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*******************************************************************************************************/
require('dotenv').config();
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { xeonLog } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('commands')
    .setDescription('Displays a list of available commands.')
	.setDMPermission(false),
  async execute(interaction) {
    const developerBlock = `__***Developer Commands***__
🚫 __**Cmdreload**__
Reloads commands with options to specify.
🚫 __**Errortest**__
Sends a dummy error to the console.
-------------------------\n`;
    
    const adminBlock = `__***Admin Commands***__
⛔ __**Hackban**__
Bans a user who is not in the server by user ID.
⛔ __**Kickrole**__
Kicks all users in a specified role from the server.
-------------------------\n`;
    
    const staffBlock = `__***Staff Commands***__
⚠️ __**Ban**__
Bans a user for a specified duration or permanently.
⚠️ __**Embedcreator**__
An interactive JSON embed creator. Edit all fields of an embed with a live visual preview, then send it to any channel in the server.
⚠️ __**Embedextract**__
Extracts JSON embeds via message URL with the option to specify text reply or file reply.
⚠️ __**Kick**__
Kicks a user from the server (with permissions).
⚠️ __**Say**__
Speak as the bot. Input a text string and optionally specify a channel for the bot to send your message.
⚠️ __**Serverinfo**__
Shows information about the server including channel count, server owner, and more.
⚠️ __**Timeout**__
Times a user out for a specified duration.
⚠️ __**Unban**__
Unbans a user.
⚠️ __**Userinfo**__
Shows detailed user information about the selected user.
⚠️ __**Inchannel**__
Shows what users have access to a channel in an embed with pages.
⚠️ __**Inrole**__
Shows what users have a specified role in an embed with pages.
⚠️ __**Resourceusage**__
Shows system metrics.
-------------------------\n`;
    
    const allUsersBlock = `__***All Users Commands***__
✅ __**Banner**__
Displays the server banner.
✅ __**Info**__
Shows information about the bot.
✅ __**Ping**__
Shows network and uptime information.
✅ __**Commands**__
This command. Shows a list of commands based on permissions. 
-------------------------\n`;
    
    let commandsData = "";
    let showDeveloper = false;
    let showAdmin = false;
    let showStaff = false;
    
    if (interaction.user.id === process.env.OPERATOR) {
      commandsData += developerBlock;
      showDeveloper = true;
    }
    
    if (
      interaction.user.id === process.env.OPERATOR ||
      interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      commandsData += adminBlock;
      showAdmin = true;
    }
    
    if (
      interaction.user.id === process.env.OPERATOR ||
      interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
      interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)
    ) {
      commandsData += staffBlock;
      showStaff = true;
    }
    
    commandsData += allUsersBlock;
    
    let legendBlock = "";
    if (showDeveloper) legendBlock += "-# 🚫 = Developer Command\n";
    if (showAdmin) legendBlock += "-# ⛔ = Admin Command\n";
    if (showStaff) legendBlock += "-# ⚠️ = Staff Command\n";
    legendBlock += "-# ✅ = All Users Command";
    
    commandsData += legendBlock;
    
    const embed = new EmbedBuilder()
      .setTitle("Command List")
      .setDescription(commandsData)
      .setColor('Blue')
      .setTimestamp();
    
    try {
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      xeonLog('error', `Error in commands command: ${error.message}`); //commands command :kek:
    }
  },
};
