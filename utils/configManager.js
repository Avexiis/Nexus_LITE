/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
*******************************************************************************************************/
const fs = require('fs');
const path = require('path');

const configFilePath = path.join(__dirname, '../config.json');

function loadConfig() {
  if (!fs.existsSync(configFilePath)) {
    return {};
  }
  const rawData = fs.readFileSync(configFilePath, 'utf8');
  return JSON.parse(rawData);
}

function saveConfig(config) {
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
}

module.exports = {
  loadConfig,
  saveConfig,
};
