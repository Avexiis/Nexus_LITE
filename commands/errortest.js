/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*
* This file is for test purposes. It generates an intentional error.
* I made it to test the web logging in the full version of this bot.
* You will really have no need for it, which is why it's disabled.
********************************************************************************************************
require('dotenv').config();
const { SlashCommandBuilder } = require('discord.js');
const { xeonLog } = require('../utils/logger.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('errortest')
        .setDescription('Triggers a test error with a stack trace.'),
    async execute(interaction) {
      if (interaction.user.id !== process.env.OPERATOR) {
        return await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      } try {
            throw new Error('This is a test error for stack trace logging!');
        } catch (error) {
            xeonLog('ERROR', error);

            await interaction.reply({
                content: 'An error has been triggered and logged successfully. Check the logs for the stack trace.',
                ephemeral: true
            });
        }
    },
};
*/
