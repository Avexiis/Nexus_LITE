/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*******************************************************************************************************/
require('dotenv').config();
const { Client, IntentsBitField, Collection, REST, Routes, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { xeonLog } = require('./utils/logger');

const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;

xeonLog('INFO', 'Nexus is starting...');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildPresences,
  ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

xeonLog('INFO', 'Finished loading commands and events.');

process.on('unhandledRejection', (reason, promise) => {
  xeonLog('ERROR', `Unhandled Rejection: ${reason}`);
});

process.on('uncaughtException', (error) => {
  xeonLog('ERROR', `Uncaught Exception: ${error.message}`);
});

client.ws.on('shardDisconnect', (event, shardId) => {
  xeonLog('WARN', `Shard ${shardId} disconnected with code ${event.code}. Starting reconnection attempts...`);
  let attempt = 0;
  const intervals = [0, 3000, 5000];

  const tryReconnect = () => {
    const interval = attempt < intervals.length ? intervals[attempt] : 30000;
    xeonLog('INFO', `Shard ${shardId} reconnection attempt ${attempt + 1} in ${interval} ms...`);
    setTimeout(() => {
      const shard = client.ws.shards.get(shardId);
      if (shard && shard.status !== 0) {
        xeonLog('WARN', `Shard ${shardId} still disconnected on attempt ${attempt + 1}.`);
        attempt++;
        tryReconnect();
      } else {
        xeonLog('INFO', `Shard ${shardId} reconnected successfully.`);
      }
    }, interval);
  };

  tryReconnect();
});

client.ws.on('shardError', (error, shardId) => {
  xeonLog('ERROR', `Shard ${shardId} encountered an error: ${error.message}`);
});

client.once('ready', async () => {
  xeonLog('INFO', `Logged in as ${client.user.tag}`);

  let statusIndex = 0;
  const updateStatus = () => {
    const statusArray = [
      () => `${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)} users!`,
      () => 'Made By Xeon',
    ];
    const statusMessage = statusArray[statusIndex % statusArray.length]();
    client.user.setPresence({
      status: 'dnd',
      activities: [
        {
          name: statusMessage,
          type: ActivityType.Watching,
        },
      ],
    });
    statusIndex++;
  };

  updateStatus();
  setInterval(updateStatus, 10000);

  const rest = new REST({ version: '10' }).setToken(token);
  try {
    xeonLog('INFO', 'Started global slash command sync.');
    const commands = client.commands.map(command => command.data.toJSON());
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    xeonLog('INFO', 'Finished global slash command sync.');
  } catch (error) {
    xeonLog('ERROR', `Error occurred: ${error.message}`);
  }
});

client.login(token);
