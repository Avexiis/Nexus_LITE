/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*******************************************************************************************************/
require('dotenv').config();
const { SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { xeonLog } = require('../utils/logger');

const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cmdreload')
    .setDescription('Reloads slash commands. Optionally reload a specific command or only new ones.')
	.setDMPermission(false)
    .addStringOption(option =>
      option.setName('command')
            .setDescription('Select a command to reload (reload all if empty).')
            .setRequired(false)
            .setAutocomplete(true))
    .addBooleanOption(option =>
      option.setName('new')
            .setDescription('Only load new commands (ignored if a command is selected).')
            .setRequired(false)),
  async execute(interaction) {
    if (interaction.user.id !== process.env.OPERATOR) {
      return await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const selectedCommandName = interaction.options.getString('command');
    const loadNewOnly = interaction.options.getBoolean('new') || false;
    const commandsFolder = __dirname;

    if (selectedCommandName) {
      try {
        const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));
        let found = false;
        let reloadedCommand;
        for (const file of commandFiles) {
          const filePath = path.join(commandsFolder, file);
          delete require.cache[require.resolve(filePath)];
          const command = require(filePath);
          if ('data' in command && 'execute' in command && command.data.name === selectedCommandName) {
            interaction.client.commands.set(command.data.name, command);
            reloadedCommand = command;
            found = true;
            break;
          }
        }
        if (!found) {
          return await interaction.reply({ content: `Command \`${selectedCommandName}\` not found.`, ephemeral: true });
        }

        const rest = new REST({ version: '10' }).setToken(token);
        const existingCommand = interaction.client.application.commands.cache.find(cmd => cmd.name === selectedCommandName);
        if (existingCommand) {
          await rest.patch(Routes.applicationCommand(clientId, existingCommand.id), { body: reloadedCommand.data.toJSON() });
        } else {
          await rest.post(Routes.applicationCommands(clientId), { body: reloadedCommand.data.toJSON() });
        }
        return await interaction.reply({ content: `Reloaded command \`${selectedCommandName}\` successfully!`, ephemeral: true });
      } catch (error) {
        xeonLog('ERROR', `Error reloading command: ${error.message}`);
        return await interaction.reply({ content: `Error reloading command: ${error.message}`, ephemeral: true });
      }
    }

    try {
      const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));

      if (loadNewOnly) {
        const currentCommands = interaction.client.commands;
        const newCommandsData = [];
        for (const file of commandFiles) {
          const filePath = path.join(commandsFolder, file);
          delete require.cache[require.resolve(filePath)];
          const command = require(filePath);
          if ('data' in command && 'execute' in command && !currentCommands.has(command.data.name)) {
            currentCommands.set(command.data.name, command);
            newCommandsData.push(command.data.toJSON());
          }
        }
        const allCommandsData = Array.from(currentCommands.values()).map(cmd => cmd.data.toJSON());
        const rest = new REST({ version: '10' }).setToken(token);
        await rest.put(Routes.applicationCommands(clientId), { body: allCommandsData });
        return await interaction.reply({ content: `Loaded ${newCommandsData.length} new command(s) successfully!`, ephemeral: true });
      } else {
        const newCommands = new Map();
        const commandsData = [];
        for (const file of commandFiles) {
          const filePath = path.join(commandsFolder, file);
          delete require.cache[require.resolve(filePath)];
          const command = require(filePath);
          if ('data' in command && 'execute' in command) {
            newCommands.set(command.data.name, command);
            commandsData.push(command.data.toJSON());
          }
        }
        interaction.client.commands = newCommands;
        const rest = new REST({ version: '10' }).setToken(token);
        await rest.put(Routes.applicationCommands(clientId), { body: commandsData });
        return await interaction.reply({ content: 'Reloaded all slash commands successfully!', ephemeral: true });
      }
    } catch (error) {
      xeonLog('ERROR', `Error reloading slash commands: ${error.message}`);
      return await interaction.reply({ content: `Error reloading slash commands: ${error.message}`, ephemeral: true });
    }
  },
  autocomplete: async (interaction, client) => {
    const focusedValue = interaction.options.getFocused();
    const commandsFolder = __dirname;
    const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));
    const suggestions = [];

    for (const file of commandFiles) {
      const filePath = path.join(commandsFolder, file);
      try {
        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);
        if ('data' in command && command.data && typeof command.data.name === 'string') {
          if (command.data.name.startsWith(focusedValue)) {
            suggestions.push({
              name: command.data.name,
              value: command.data.name,
            });
          }
        }
      } catch (error) {
        xeonLog('ERROR', `Error loading command ${file}: ${error.message}`);
      }
    }
    await interaction.respond(suggestions.slice(0, 25));
  }
};
