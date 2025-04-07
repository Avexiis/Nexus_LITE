# Nexus LITE by Xeon

Thank you for downloading Nexus LITE by Xeon. Please review the following information and requirements to get started.

## Requirements

- **Node.js:** Version **v20.12.0** or later is required.  
- **Discord.js:** Version **14.0.0** or later is needed.  
  *Note: Node.js must be installed before the bot, and Discord.js will be installed during the bot setup process.*

## Compatibility

- This bot has been developed and tested on:
  - **Windows Server 2022**
  - **Windows 10**

Usage on Linux or other versions of Windows may vary or not function as expected.

## Setup Instructions

1. **Discord Developer Portal Setup:**
   - Create an application with the proper permissions.
   - Add the application to your server.
   - If you are unsure about the permissions, set it to **Administrator** and ensure the bot's role is as high as possible in the role hierarchy.

2. **Environment Variables:**
   - Create the `.env` file to include your:
     - Bot token
     - Application client ID
     - Operator ID (this should be a Discord user ID representing the host, developer, etc.)
     - The Operator ID grants access to the command reload functions.
    - Sample:
     ```
     BOT_TOKEN=Token_From_Dev_Portal
     CLIENT_ID=Client_ID_From_Dev_Portal
     OPERATOR=Owner_or_Developer_ID
     ```

3. **Bot Configuration:**
   - While a basic understanding of JavaScript is recommended, it is not required.
   - The bot is deployable out-of-the-box. However, it is recommended to customize the bot as much as possible.

4. **Logger and Info Command:**
   - The logger file and info command are obfuscated to prevent easy modifications or removal of credits.
   - Although this project is open source, a mark of ownership is retained. Overcoming the obfuscation is a challenge – if you manage to defeat it, you win and may change the credits in the info command as you please! That said, please leave this file and inline credits intact.

5. **Installation on Windows:**
   - **Download and Install Node.js:**  
     Visit [nodejs.org](https://nodejs.org/) and download the latest LTS version.
   - **Clone the Repository:**  
     Open a command prompt and run:
     ```bash
     git clone https://github.com/Avexiis/Nexus-LITE.git
     ```
   - **Navigate to the Project Directory:**  
     ```bash
     cd C:\Path\To\Your\Bot\Folder
     ```
   - **Install Dependencies:**  
     Run the following commands to install required packages:
     ```bash
     npm init -y
     ```
     ```bash
     npm install
     ```
   - **Configure Environment Variables:**  
     Edit the `.env` file to include your bot token, application client ID, and operator ID.
   - **Start the Bot:**  
     Use the provided Run.bat file OR
     Launch the bot in command prompt with:
     ```bash
     node index.js
     ```
   - **Verify Operation:**  
     Ensure the bot is running and connected to your Discord server.

## Command List

### Developer Commands
- 🚫 **Cmdreload:** Reloads commands with options to specify. (Operator only).
- 🚫 **Errortest:** Sends a dummy error to the console. (Operator only/Disabled).

### Admin Commands
- ⛔ **Hackban:** Bans a user who is not in the server by user ID.
- ⛔ **Kickrole:** Kicks all users in a specified role from the server.

### Staff Commands
- ⚠️ **Ban:** Bans a user for a specified duration or permanently. (Ban members permission).
- ⚠️ **Embedcreator:** An interactive JSON embed creator. Edit all fields of an embed with a live visual preview, then send it to any channel in the server. (Manage Messages permission).
- ⚠️ **Embedextract:** Extracts JSON embeds via message URL with the option to specify text reply or file reply. (Manage Messages permission).
- ⚠️ **Kick:** Kicks a user from the server (Kick members permission).
- ⚠️ **Say:** Speak as the bot. Input a text string and optionally specify a channel for the bot to send your message. (Manage Messages permission).
- ⚠️ **Serverinfo:** Shows information about the server including channel count, server owner, and more. (Manage Messages permission).
- ⚠️ **Timeout:** Times a user out for a specified duration. (Moderate members permission).
- ⚠️ **Unban:** Unbans a user. (Ban members permission).
- ⚠️ **Userinfo:** Shows detailed user information about the selected user. (Ban members permission).
- ⚠️ **Inchannel:** Shows what users have access to a channel in an embed with pages. (Manage Messages permission).
- ⚠️ **Inrole:** Shows what users have a specified role in an embed with pages. (Manage Messages permission).
- ⚠️ **Resourceusage:** Shows system metrics. (Manage Messages permission).

### All Users Commands
- ✅ **Banner:** Displays the server banner.
- ✅ **Info:** Shows information about the bot.
- ✅ **Ping:** Shows network and uptime information.
- ✅ **Commands:** Displays a list of commands based on permissions.

### Legend
- 🚫 = Developer Command
- ⛔ = Admin Command
- ⚠️ = Staff Command
- ✅ = All User Command

## Credits

The only component not developed by the author is the file `/data/all-emojis.json`, which was sourced from [Fantantonio](https://github.com/Fantantonio).  
This project took weeks to create and months to perfect. Redistribution is allowed as long as inline credits and this README file remain intact.

## Support

Support for this bot is limited. If you have any questions, please reach out via the Discord server:  
[Nexus Development](https://discord.gg/BcfV8jbqxS)
