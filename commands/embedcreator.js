/*******************************************************************************************************
* @author: Xeon (https://github.com/Avexiis / https://discord.com/users/975580212236521512)
* @contributor: Thanks to https://github.com/Fantantonio for posting ALL Unicode emojis in JSON format.
*
* The goal of this command is to provide an embed creator for users within discord.
* There's many web based JSON embed creators out there, but none of them are very mobile friendly.
* Paired with the /embedextract command, this is a unique tool that makes editing embeds easy.
*******************************************************************************************************/
const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ButtonBuilder, 
  ActionRowBuilder, 
  ButtonStyle, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle,
  PermissionsBitField,
  ComponentType,
  ChannelSelectMenuBuilder,
  ChannelType
} = require('discord.js');
const { xeonLog } = require('../utils/logger');

const allEmojis = require('../data/all-emojis.json');
const emojiSet = new Set();
allEmojis.forEach(entry => {
  if (Array.isArray(entry) && entry.length >= 3 && typeof entry[2] === 'string') {
    emojiSet.add(entry[2]);
  }
});

const activeEmbedCreators = new Map();

function isValidImageUrl(url) {
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
}

function containsIllegalUrlChars(text) {
  if (/<a?:\w+:\d+>/.test(text)) return true;
  if (/[\x00-\x1F\x7F]/.test(text)) return true;
  for (const emoji of emojiSet) {
    if (text.includes(emoji)) return true;
  }
  return false;
}

function isStrictUrl(url) {
  const regex = /^https?:\/\/[\x20-\x7E]+$/;
  return regex.test(url);
}

async function safeUpdate(interaction, options) {
  try {
    await interaction.update(options);
  } catch (err) {
    if (
      err.message.includes("Unknown Interaction") ||
      err.message.includes("Unknown Message") ||
      err.message.includes("Interaction has already been acknowledged")
    ) {
      return;
    }
    xeonLog('ERROR', err.message);
  }
}

async function safeReply(interaction, options) {
  try {
    await interaction.reply(options);
  } catch (err) {
    if (
      err.message.includes("Unknown Interaction") ||
      err.message.includes("Unknown Message") ||
      err.message.includes("Interaction has already been acknowledged")
    ) {
      return;
    }
    xeonLog('ERROR', err.message);
  }
}

function buildRow1(userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`btn_title_${userId}`).setLabel('Title').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`btn_description_${userId}`).setLabel('Description').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`btn_messagecontent_${userId}`).setLabel('Message content').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`btn_colour_${userId}`).setLabel('Color').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`btn_url_${userId}`).setLabel('URL').setStyle(ButtonStyle.Secondary)
  );
}

function buildCombinedRow2(userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`btn_image_${userId}`).setLabel('Image').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`btn_thumbnail_${userId}`).setLabel('Thumbnail').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`btn_author_${userId}`).setLabel('Author').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`btn_footer_${userId}`).setLabel('Footer').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`btn_footericon_${userId}`).setLabel('Footer Icon').setStyle(ButtonStyle.Secondary)
  );
}

function buildRow3(userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`btn_clear_${userId}`).setLabel('Clear').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`btn_addfield_${userId}`).setLabel('+ Add field').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`btn_removefield_${userId}`).setLabel('- Remove field').setStyle(ButtonStyle.Danger)
  );
}

function buildCombinedRow4(userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`btn_replacejson_${userId}`).setLabel('Replace JSON').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`btn_sendjson_${userId}`).setLabel('Send JSON').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`btn_delete_${userId}`).setLabel('Delete').setStyle(ButtonStyle.Danger)
  );
}

function buildRow5(userId) {
  return new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(`select_channel_${userId}_${Date.now()}`)
      .setPlaceholder('Select a channel')
      .setMinValues(1)
      .setMaxValues(1)
      .setChannelTypes([ChannelType.GuildText, ChannelType.GuildAnnouncement])
  );
}

function disableRows(userId) {
  const rows = [
    buildRow1(userId),
    buildCombinedRow2(userId),
    buildRow3(userId),
    buildCombinedRow4(userId),
    buildRow5(userId)
  ];
  return rows.map(row => {
    row.components = row.components.map(component => {
      if (component.data?.type === 2) {
        return ButtonBuilder.from(component).setDisabled(true);
      }
      return component;
    });
    return row;
  });
}

function getPlaceholderEmbed() {
  return new EmbedBuilder()
    .setTitle('Embed Creator Instructions')
    .setDescription(String.raw`Welcome to the Embed Creator!

Use the buttons below to customize your embed interactively. Each button opens a modal to edit a specific part of your embed.

How to Use:
- Title: The embed's title.
- Description: Main body text of the embed.
- Message content: The text sent with your embed.
- Color: Enter a hex color code (Example: #FF0000).
- URL: Attach a URL to the embed's title.
- Image/Thumbnail: Add an image or thumbnail via URL.
- Author/Footer: Customize the author and footer.
- Footer Icon: Set a URL for the footer icon.
- Fields: Add/Remove fields.
- JSON Options: Replace the embed using raw JSON or send the existing JSON as a reply.

Discord Markdown in Embeds:
- Bold: ` + "`**text**`" + `
- Italics: ` + "`*text*`" + ` or ` + "`_text_`" + `
- Underline: ` + "`__text__`" + `
- Strikethrough: ` + "`~~text~~`" + `
- User Mentions: ` + "`<@USER_ID>`" + `
- Role Mentions: ` + "`<@&ROLE_ID>`" + `
- Channel Mentions: ` + "`<#CHANNEL_ID>`" + `
- Large Header: ` + "`# text`" + `
- Subtext: ` + "`-# text`" + `

Enjoy customizing your embed!`)
    .setColor('Blue')
    .setTimestamp();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embedcreator')
    .setDescription('Interactively create and modify an embed.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
    .setDMPermission(false),

  async execute(interaction, client) {
    try {
      const userId = interaction.user.id;
      let messageContent = '';

      if (activeEmbedCreators.has(userId)) {
        const prevInstance = activeEmbedCreators.get(userId);
        if (prevInstance.collector) prevInstance.collector.stop("New instance started");
        try {
          await prevInstance.message.edit({
            content: prevInstance.message.content,
            embeds: prevInstance.message.embeds,
            components: disableRows(userId)
          });
        } catch (e) {
          xeonLog('ERROR', e.message);
        }
        activeEmbedCreators.delete(userId);
      }

      let currentEmbed = getPlaceholderEmbed();

      let modalCache = {
        title: currentEmbed.data.title || "",
        description: currentEmbed.data.description || "",
        messageContent: messageContent || "",
        colour: currentEmbed.data.color ? "#" + currentEmbed.data.color.toString(16).toUpperCase() : "",
        url: currentEmbed.data.url || "",
        image: currentEmbed.data.image ? currentEmbed.data.image.url : "",
        thumbnail: currentEmbed.data.thumbnail ? currentEmbed.data.thumbnail.url : "",
        author: currentEmbed.data.author ? currentEmbed.data.author.name : "",
        footer: currentEmbed.data.footer ? currentEmbed.data.footer.text : "",
        footerIcon: currentEmbed.data.footer ? (currentEmbed.data.footer.icon_url || "") : "",
        addFieldName: "",
        addFieldValue: ""
      };

      function awaitModalSubmission(customId, time = 2 * 60 * 1000) {
        return new Promise((resolve) => {
          const handler = (i) => {
            if (i.isModalSubmit() && i.customId === customId) {
              client.off('interactionCreate', handler);
              resolve(i);
            }
          };
          client.on('interactionCreate', handler);
          setTimeout(() => {
            client.off('interactionCreate', handler);
            resolve(null);
          }, time);
        });
      }

      await interaction.reply({
        content: messageContent || '*No message content*',
        embeds: [currentEmbed],
        components: [
          buildRow1(userId),
          buildCombinedRow2(userId),
          buildRow3(userId),
          buildCombinedRow4(userId),
          buildRow5(userId)
        ],
        ephemeral: false
      });
      const previewMessage = await interaction.fetchReply();

      const btnCollector = previewMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 5 * 60 * 1000
      });

      function messageDeleteHandler(deletedMessage) {
        if (deletedMessage.id === previewMessage.id) {
          activeEmbedCreators.delete(userId);
          btnCollector.stop("Message deleted");
          client.off('messageDelete', messageDeleteHandler);
        }
      }
      client.on('messageDelete', messageDeleteHandler);

      btnCollector.on('collect', async (btnInteraction) => {
        if (btnInteraction.user.id !== userId) {
          return btnInteraction.reply({ content: "Only the user who ran the command may interact with the embed creator!", ephemeral: true });
        }
        const customId = btnInteraction.customId;

        // Delete
        if (customId.startsWith('btn_delete_')) {
          await previewMessage.delete();
          activeEmbedCreators.delete(userId);
          btnCollector.stop("Deleted by user");
          client.off('messageDelete', messageDeleteHandler);
          return;
        }
        // Send JSON
        else if (customId.startsWith('btn_sendjson_')) {
          const jsonData = JSON.stringify(currentEmbed.data, null, 2);
          if (jsonData.length > 1900) {
            const buffer = Buffer.from(jsonData, 'utf8');
            await safeReply(btnInteraction, {
              content: 'JSON output is too long; it has been sent as a file instead.',
              files: [{ attachment: buffer, name: 'embed.json' }],
              ephemeral: false
            });
          } else {
            await safeReply(btnInteraction, { content: `\`\`\`json\n${jsonData}\n\`\`\``, ephemeral: false });
          }
          btnCollector.resetTimer();
        }
        // Title
        else if (customId.startsWith('btn_title_')) {
          const modal = new ModalBuilder()
            .setCustomId(`modal_title_${userId}`)
            .setTitle('Edit Title');
          const titleInput = new TextInputBuilder()
            .setCustomId('title_input')
            .setLabel('Enter a new title')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Title...')
            .setValue(modalCache.title)
            .setRequired(false);
          modal.addComponents(new ActionRowBuilder().addComponents(titleInput));
          await btnInteraction.showModal(modal);
          try {
            const modalInteraction = await awaitModalSubmission(`modal_title_${userId}`, 2 * 60 * 1000);
            if (!modalInteraction) return;
            if (!activeEmbedCreators.has(userId))
              return safeReply(modalInteraction, { content: "This session has expired.", ephemeral: true });
            const newTitle = modalInteraction.fields.getTextInputValue('title_input').trim();
            modalCache.title = newTitle;
            currentEmbed.setTitle(newTitle === "" ? null : newTitle);
            await safeUpdate(modalInteraction, {
              content: messageContent || '*No message content*',
              embeds: [currentEmbed],
              components: [
                buildRow1(userId),
                buildCombinedRow2(userId),
                buildRow3(userId),
                buildCombinedRow4(userId),
                buildRow5(userId)
              ]
            });
            btnCollector.resetTimer();
          } catch (err) {
            xeonLog('ERROR', err.message);
          }
        }
        // Description
        else if (customId.startsWith('btn_description_')) {
          const modal = new ModalBuilder()
            .setCustomId(`modal_description_${userId}`)
            .setTitle('Edit Description');
          const descInput = new TextInputBuilder()
            .setCustomId('description_input')
            .setLabel('Enter a new description')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Description...')
            .setValue(modalCache.description)
            .setRequired(false);
          modal.addComponents(new ActionRowBuilder().addComponents(descInput));
          await btnInteraction.showModal(modal);
          try {
            const modalInteraction = await awaitModalSubmission(`modal_description_${userId}`, 2 * 60 * 1000);
            if (!modalInteraction) return;
            if (!activeEmbedCreators.has(userId))
              return safeReply(modalInteraction, { content: "This session has expired.", ephemeral: true });
            const newDesc = modalInteraction.fields.getTextInputValue('description_input').trim();
            modalCache.description = newDesc;
            currentEmbed.setDescription(newDesc === "" ? null : newDesc);
            await safeUpdate(modalInteraction, {
              content: messageContent || '*No message content*',
              embeds: [currentEmbed],
              components: [
                buildRow1(userId),
                buildCombinedRow2(userId),
                buildRow3(userId),
                buildCombinedRow4(userId),
                buildRow5(userId)
              ]
            });
            btnCollector.resetTimer();
          } catch (err) {
            xeonLog('ERROR', err.message);
          }
        }
        // Message Content
        else if (customId.startsWith('btn_messagecontent_')) {
          const modal = new ModalBuilder()
            .setCustomId(`modal_messagecontent_${userId}`)
            .setTitle('Edit Message Content');
          const msgInput = new TextInputBuilder()
            .setCustomId('msgcontent_input')
            .setLabel('Enter message content')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Message...')
            .setValue(modalCache.messageContent)
            .setRequired(false);
          modal.addComponents(new ActionRowBuilder().addComponents(msgInput));
          await btnInteraction.showModal(modal);
          try {
            const modalInteraction = await awaitModalSubmission(`modal_messagecontent_${userId}`, 2 * 60 * 1000);
            if (!modalInteraction) return;
            if (!activeEmbedCreators.has(userId))
              return safeReply(modalInteraction, { content: "This session has expired.", ephemeral: true });
            const newMsgContent = modalInteraction.fields.getTextInputValue('msgcontent_input').trim();
            modalCache.messageContent = newMsgContent;
            messageContent = newMsgContent;
            await safeUpdate(modalInteraction, {
              content: messageContent === "" ? '*No message content*' : messageContent,
              embeds: [currentEmbed],
              components: [
                buildRow1(userId),
                buildCombinedRow2(userId),
                buildRow3(userId),
                buildCombinedRow4(userId),
                buildRow5(userId)
              ]
            });
            btnCollector.resetTimer();
          } catch (err) {
            xeonLog('ERROR', err.message);
          }
        }
        // Color
        else if (customId.startsWith('btn_colour_')) {
          const modal = new ModalBuilder()
            .setCustomId(`modal_colour_${userId}`)
            .setTitle('Edit Color');
          const colourInput = new TextInputBuilder()
            .setCustomId('colour_input')
            .setLabel('Enter a hex color code')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('#FF0000')
            .setValue(modalCache.colour)
            .setRequired(false);
          modal.addComponents(new ActionRowBuilder().addComponents(colourInput));
          await btnInteraction.showModal(modal);
          try {
            const modalInteraction = await awaitModalSubmission(`modal_colour_${userId}`, 2 * 60 * 1000);
            if (!modalInteraction) return;
            if (!activeEmbedCreators.has(userId))
              return safeReply(modalInteraction, { content: "This session has expired.", ephemeral: true });
            const newColour = modalInteraction.fields.getTextInputValue('colour_input').trim();
            modalCache.colour = newColour;
            currentEmbed.setColor(newColour === "" ? null : newColour);
            await safeUpdate(modalInteraction, {
              content: messageContent || '*No message content*',
              embeds: [currentEmbed],
              components: [
                buildRow1(userId),
                buildCombinedRow2(userId),
                buildRow3(userId),
                buildCombinedRow4(userId),
                buildRow5(userId)
              ]
            });
            btnCollector.resetTimer();
          } catch (err) {
            xeonLog('ERROR', err.message);
          }
        }
        // URL
        else if (customId.startsWith('btn_url_')) {
          const modal = new ModalBuilder()
            .setCustomId(`modal_url_${userId}`)
            .setTitle('Edit URL');
          const urlInput = new TextInputBuilder()
            .setCustomId('url_input')
            .setLabel('Enter a valid URL')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://example.com')
            .setValue(modalCache.url)
            .setRequired(false);
          modal.addComponents(new ActionRowBuilder().addComponents(urlInput));
          await btnInteraction.showModal(modal);
          try {
            const modalInteraction = await awaitModalSubmission(`modal_url_${userId}`, 2 * 60 * 1000);
            if (!modalInteraction) return;
            if (!activeEmbedCreators.has(userId))
              return safeReply(modalInteraction, { content: "This session has expired.", ephemeral: true });
            const newURL = modalInteraction.fields.getTextInputValue('url_input').trim();
            if (newURL !== "" && (!isStrictUrl(newURL) || containsIllegalUrlChars(newURL))) {
              return safeReply(modalInteraction, { content: 'The URL contains invalid characters, non-ASCII characters, or emojis.', ephemeral: true });
            }
            modalCache.url = newURL;
            currentEmbed.setURL(newURL === "" ? null : newURL);
            await safeUpdate(modalInteraction, {
              content: messageContent || '*No message content*',
              embeds: [currentEmbed],
              components: [
                buildRow1(userId),
                buildCombinedRow2(userId),
                buildRow3(userId),
                buildCombinedRow4(userId),
                buildRow5(userId)
              ]
            });
            btnCollector.resetTimer();
          } catch (err) {
            xeonLog('ERROR', err.message);
          }
        }
        // Image
        else if (customId.startsWith('btn_image_')) {
          const modal = new ModalBuilder()
            .setCustomId(`modal_image_${userId}`)
            .setTitle('Edit Image');
          const imageInput = new TextInputBuilder()
            .setCustomId('image_input')
            .setLabel('Enter an image URL')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://example.com/image.png')
            .setValue(modalCache.image)
            .setRequired(false);
          modal.addComponents(new ActionRowBuilder().addComponents(imageInput));
          await btnInteraction.showModal(modal);
          try {
            const modalInteraction = await awaitModalSubmission(`modal_image_${userId}`, 2 * 60 * 1000);
            if (!modalInteraction) return;
            if (!activeEmbedCreators.has(userId))
              return safeReply(modalInteraction, { content: "This session has expired.", ephemeral: true });
            const newLink = modalInteraction.fields.getTextInputValue('image_input').trim();
            if (newLink !== "" && (!isValidImageUrl(newLink) || !isStrictUrl(newLink) || containsIllegalUrlChars(newLink))) {
              return safeReply(modalInteraction, { content: 'Please enter a valid image URL without illegal characters, non-ASCII characters, or emojis (jpg, jpeg, png, gif, or webp).', ephemeral: true });
            }
            modalCache.image = newLink;
            currentEmbed.setImage(newLink === "" ? null : newLink);
            await safeUpdate(modalInteraction, {
              content: messageContent || '*No message content*',
              embeds: [currentEmbed],
              components: [
                buildRow1(userId),
                buildCombinedRow2(userId),
                buildRow3(userId),
                buildCombinedRow4(userId),
                buildRow5(userId)
              ]
            });
            btnCollector.resetTimer();
          } catch (err) {
            xeonLog('ERROR', err.message);
          }
        }
        // Thumbnail
        else if (customId.startsWith('btn_thumbnail_')) {
          const modal = new ModalBuilder()
            .setCustomId(`modal_thumbnail_${userId}`)
            .setTitle('Edit Thumbnail');
          const thumbInput = new TextInputBuilder()
            .setCustomId('thumbnail_input')
            .setLabel('Enter a thumbnail URL')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://example.com/thumb.png')
            .setValue(modalCache.thumbnail)
            .setRequired(false);
          modal.addComponents(new ActionRowBuilder().addComponents(thumbInput));
          await btnInteraction.showModal(modal);
          try {
            const modalInteraction = await awaitModalSubmission(`modal_thumbnail_${userId}`, 2 * 60 * 1000);
            if (!modalInteraction) return;
            if (!activeEmbedCreators.has(userId))
              return safeReply(modalInteraction, { content: "This session has expired.", ephemeral: true });
            const newThumb = modalInteraction.fields.getTextInputValue('thumbnail_input').trim();
            if (newThumb !== "" && (!isValidImageUrl(newThumb) || !isStrictUrl(newThumb) || containsIllegalUrlChars(newThumb))) {
              return safeReply(modalInteraction, { content: 'Please enter a valid thumbnail URL without illegal characters, non-ASCII characters, or emojis (jpg, jpeg, png, gif, or webp).', ephemeral: true });
            }
            modalCache.thumbnail = newThumb;
            currentEmbed.setThumbnail(newThumb === "" ? null : newThumb);
            await safeUpdate(modalInteraction, {
              content: messageContent || '*No message content*',
              embeds: [currentEmbed],
              components: [
                buildRow1(userId),
                buildCombinedRow2(userId),
                buildRow3(userId),
                buildCombinedRow4(userId),
                buildRow5(userId)
              ]
            });
            btnCollector.resetTimer();
          } catch (err) {
            xeonLog('ERROR', err.message);
          }
        }
        // Author
        else if (customId.startsWith('btn_author_')) {
          const modal = new ModalBuilder()
            .setCustomId(`modal_author_${userId}`)
            .setTitle('Edit Author');
          const authorInput = new TextInputBuilder()
            .setCustomId('author_input')
            .setLabel('Enter author text')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Author...')
            .setValue(modalCache.author)
            .setRequired(false);
          modal.addComponents(new ActionRowBuilder().addComponents(authorInput));
          await btnInteraction.showModal(modal);
          try {
            const modalInteraction = await awaitModalSubmission(`modal_author_${userId}`, 2 * 60 * 1000);
            if (!modalInteraction) return;
            if (!activeEmbedCreators.has(userId))
              return safeReply(modalInteraction, { content: "This session has expired.", ephemeral: true });
            const newAuthor = modalInteraction.fields.getTextInputValue('author_input').trim();
            modalCache.author = newAuthor;
            currentEmbed.setAuthor(newAuthor === "" ? null : { name: newAuthor });
            await safeUpdate(modalInteraction, {
              content: messageContent || '*No message content*',
              embeds: [currentEmbed],
              components: [
                buildRow1(userId),
                buildCombinedRow2(userId),
                buildRow3(userId),
                buildCombinedRow4(userId),
                buildRow5(userId)
              ]
            });
            btnCollector.resetTimer();
          } catch (err) {
            xeonLog('ERROR', err.message);
          }
        }
        // Footer
        else if (customId.startsWith('btn_footer_')) {
          const modal = new ModalBuilder()
            .setCustomId(`modal_footer_${userId}`)
            .setTitle('Edit Footer');
          const footerInput = new TextInputBuilder()
            .setCustomId('footer_input')
            .setLabel('Enter footer text')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Footer...')
            .setValue(modalCache.footer)
            .setRequired(false);
          modal.addComponents(new ActionRowBuilder().addComponents(footerInput));
          await btnInteraction.showModal(modal);
          try {
            const modalInteraction = await awaitModalSubmission(`modal_footer_${userId}`, 2 * 60 * 1000);
            if (!modalInteraction) return;
            if (!activeEmbedCreators.has(userId))
              return safeReply(modalInteraction, { content: "This session has expired.", ephemeral: true });
            const newFooter = modalInteraction.fields.getTextInputValue('footer_input').trim();
            modalCache.footer = newFooter;
            if (newFooter === "") {
              currentEmbed.setFooter(null);
            } else {
              const footerOptions = { text: newFooter };
              if (modalCache.footerIcon && modalCache.footerIcon.trim() !== "") {
                footerOptions.iconURL = modalCache.footerIcon;
              }
              currentEmbed.setFooter(footerOptions);
            }
            await safeUpdate(modalInteraction, {
              content: messageContent || '*No message content*',
              embeds: [currentEmbed],
              components: [
                buildRow1(userId),
                buildCombinedRow2(userId),
                buildRow3(userId),
                buildCombinedRow4(userId),
                buildRow5(userId)
              ]
            });
            btnCollector.resetTimer();
          } catch (err) {
            xeonLog('ERROR', err.message);
          }
        }
        // Footer Icon
        else if (customId.startsWith('btn_footericon_')) {
          if (!modalCache.footer) {
            return safeReply(btnInteraction, { content: "Set footer text first.", ephemeral: true });
          }
          const modal = new ModalBuilder()
            .setCustomId(`modal_footericon_${userId}`)
            .setTitle('Edit Footer Icon');
          const footerIconInput = new TextInputBuilder()
            .setCustomId('footericon_input')
            .setLabel('Enter footer icon URL')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://example.com/icon.png')
            .setValue(modalCache.footerIcon)
            .setRequired(false);
          modal.addComponents(new ActionRowBuilder().addComponents(footerIconInput));
          await btnInteraction.showModal(modal);
          try {
            const modalInteraction = await awaitModalSubmission(`modal_footericon_${userId}`, 2 * 60 * 1000);
            if (!modalInteraction) return;
            if (!activeEmbedCreators.has(userId))
              return safeReply(modalInteraction, { content: "This session has expired.", ephemeral: true });
            const newFooterIcon = modalInteraction.fields.getTextInputValue('footericon_input').trim();
            if (newFooterIcon !== "" && (!isValidImageUrl(newFooterIcon) || containsIllegalUrlChars(newFooterIcon))) {
              return safeReply(modalInteraction, { content: 'Please enter a valid footer icon URL without illegal characters or emojis (jpg, jpeg, png, gif, or webp).', ephemeral: true });
            }
            modalCache.footerIcon = newFooterIcon;
            const footerOptions = { text: modalCache.footer };
            if (newFooterIcon !== "") {
              footerOptions.iconURL = newFooterIcon;
            }
            currentEmbed.setFooter(footerOptions);
            await safeUpdate(modalInteraction, {
              content: messageContent || '*No message content*',
              embeds: [currentEmbed],
              components: [
                buildRow1(userId),
                buildCombinedRow2(userId),
                buildRow3(userId),
                buildCombinedRow4(userId),
                buildRow5(userId)
              ]
            });
            btnCollector.resetTimer();
          } catch (err) {
            xeonLog('ERROR', err.message);
          }
        }
        // Clear modal
        else if (customId.startsWith('btn_clear_')) {
          currentEmbed = getPlaceholderEmbed();
          messageContent = '';
          modalCache = {
            title: currentEmbed.data.title || "",
            description: currentEmbed.data.description || "",
            messageContent: "",
            colour: currentEmbed.data.color ? "#" + currentEmbed.data.color.toString(16).toUpperCase() : "",
            url: currentEmbed.data.url || "",
            image: currentEmbed.data.image ? currentEmbed.data.image.url : "",
            thumbnail: currentEmbed.data.thumbnail ? currentEmbed.data.thumbnail.url : "",
            author: currentEmbed.data.author ? currentEmbed.data.author.name : "",
            footer: currentEmbed.data.footer ? currentEmbed.data.footer.text : "",
            footerIcon: currentEmbed.data.footer ? (currentEmbed.data.footer.icon_url || "") : "",
            addFieldName: "",
            addFieldValue: ""
          };
          await safeUpdate(btnInteraction, {
            content: messageContent || '*No message content*',
            embeds: [currentEmbed],
            components: [
              buildRow1(userId),
              buildCombinedRow2(userId),
              buildRow3(userId),
              buildCombinedRow4(userId),
              buildRow5(userId)
            ]
          });
          btnCollector.resetTimer();
        }
        // Add Field
        else if (customId.startsWith('btn_addfield_')) {
          const modal = new ModalBuilder()
            .setCustomId(`modal_addfield_${userId}`)
            .setTitle('Add Field');
          const fieldName = new TextInputBuilder()
            .setCustomId('field_name')
            .setLabel('Field Name')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Field name...')
            .setValue(modalCache.addFieldName || "")
            .setRequired(true);
          const fieldValue = new TextInputBuilder()
            .setCustomId('field_value')
            .setLabel('Field Value')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Field value...')
            .setValue(modalCache.addFieldValue || "")
            .setRequired(true);
          modal.addComponents(
            new ActionRowBuilder().addComponents(fieldName),
            new ActionRowBuilder().addComponents(fieldValue)
          );
          await btnInteraction.showModal(modal);
          try {
            const modalInteraction = await awaitModalSubmission(`modal_addfield_${userId}`, 2 * 60 * 1000);
            if (!modalInteraction) return;
            if (!activeEmbedCreators.has(userId))
              return safeReply(modalInteraction, { content: "This session has expired.", ephemeral: true });
            const fName = modalInteraction.fields.getTextInputValue('field_name').trim();
            const fValue = modalInteraction.fields.getTextInputValue('field_value').trim();
            if (fName.length > 256) {
              return safeReply(modalInteraction, { content: 'Field name must be 256 characters or less.', ephemeral: true });
            }
            if (fValue.length > 1024) {
              return safeReply(modalInteraction, { content: 'Field value must be 1024 characters or less.', ephemeral: true });
            }
            modalCache.addFieldName = fName;
            modalCache.addFieldValue = fValue;
            currentEmbed.addFields({ name: fName, value: fValue });
            await safeUpdate(modalInteraction, {
              content: messageContent || '*No message content*',
              embeds: [currentEmbed],
              components: [
                buildRow1(userId),
                buildCombinedRow2(userId),
                buildRow3(userId),
                buildCombinedRow4(userId),
                buildRow5(userId)
              ]
            });
            btnCollector.resetTimer();
          } catch (err) {
            xeonLog('ERROR', err.message);
          }
        }
        // Remove Field
        else if (customId.startsWith('btn_removefield_')) {
          const fields = currentEmbed.data.fields || [];
          if (fields.length > 0) {
            fields.pop();
            currentEmbed.setFields(fields);
            await safeUpdate(btnInteraction, {
              content: messageContent || '*No message content*',
              embeds: [currentEmbed],
              components: [
                buildRow1(userId),
                buildCombinedRow2(userId),
                buildRow3(userId),
                buildCombinedRow4(userId),
                buildRow5(userId)
              ]
            });
            btnCollector.resetTimer();
          } else {
            await safeReply(btnInteraction, { content: 'No fields to remove.', ephemeral: false });
          }
        }
        // Replace JSON
        else if (customId.startsWith('btn_replacejson_')) {
          const modal = new ModalBuilder()
            .setCustomId(`modal_replacejson_${userId}`)
            .setTitle('Replace JSON');
          const jsonInput = new TextInputBuilder()
            .setCustomId('json_input')
            .setLabel('Embed JSON')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('{"title": "New Title", ...}')
            .setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(jsonInput));
          await btnInteraction.showModal(modal);
          try {
            const modalInteraction = await awaitModalSubmission(`modal_replacejson_${userId}`, 2 * 60 * 1000);
            if (!modalInteraction) return;
            if (!activeEmbedCreators.has(userId))
              return safeReply(modalInteraction, { content: "This session has expired.", ephemeral: true });
            const rawJson = modalInteraction.fields.getTextInputValue('json_input').trim();
            if (rawJson[0] !== '{' || rawJson.slice(-1) !== '}') {
              return safeReply(modalInteraction, { content: 'JSON must begin with `{` and end with `}`.\nPlease check your syntax or use `/embedextract` to get the valid JSON for an existing embed to be edited.' , ephemeral: true });
            }
            try {
              const parsed = JSON.parse(rawJson);
              currentEmbed = new EmbedBuilder(parsed);
            } catch (parseErr) {
              return safeReply(modalInteraction, { content: 'Invalid JSON provided.\nPlease check your syntax or use `/embedextract` to get the valid JSON for an existing embed to be edited.', ephemeral: true });
            }
            modalCache.title = currentEmbed.data.title || "";
            modalCache.description = currentEmbed.data.description || "";
            modalCache.url = currentEmbed.data.url || "";
            modalCache.colour = currentEmbed.data.color ? "#" + currentEmbed.data.color.toString(16).toUpperCase() : "";
            modalCache.image = currentEmbed.data.image ? currentEmbed.data.image.url : "";
            modalCache.thumbnail = currentEmbed.data.thumbnail ? currentEmbed.data.thumbnail.url : "";
            modalCache.author = currentEmbed.data.author ? currentEmbed.data.author.name : "";
            modalCache.footer = currentEmbed.data.footer ? currentEmbed.data.footer.text : "";
            modalCache.footerIcon = currentEmbed.data.footer ? (currentEmbed.data.footer.icon_url || "") : "";
            await safeUpdate(modalInteraction, {
              content: messageContent || '*No message content*',
              embeds: [currentEmbed],
              components: [
                buildRow1(userId),
                buildCombinedRow2(userId),
                buildRow3(userId),
                buildCombinedRow4(userId),
                buildRow5(userId)
              ]
            });
            btnCollector.resetTimer();
          } catch (err) {
            xeonLog('ERROR', err.message);
          }
        }
      });

      const selectCollector = previewMessage.createMessageComponentCollector({
        componentType: ComponentType.ChannelSelect,
        time: 5 * 60 * 1000
      });

      selectCollector.on('collect', async (selectInteraction) => {
        if (selectInteraction.user.id !== userId) {
          return selectInteraction.reply({ content: "Only the user who ran the command may interact with the embed creator!", ephemeral: true });
        }
        const selectedChannelId = selectInteraction.values[0];
        const targetChannel = interaction.guild.channels.cache.get(selectedChannelId);
        if (targetChannel) {
          await targetChannel.send({ content: messageContent || ' ', embeds: [currentEmbed] });
          await safeUpdate(selectInteraction, {
            content: `Embed sent to <#${selectedChannelId}>.`,
            embeds: [currentEmbed],
            components: [
              buildRow1(userId),
              buildCombinedRow2(userId),
              buildRow3(userId),
              buildCombinedRow4(userId)
            ]
          });
          setTimeout(() => {
            interaction.editReply({
              components: [
                buildRow1(userId),
                buildCombinedRow2(userId),
                buildRow3(userId),
                buildCombinedRow4(userId),
                buildRow5(userId)
              ]
            });
          }, 500);
        } else {
          await safeReply(selectInteraction, { content: 'Invalid channel selected.', ephemeral: true });
        }
      });

      btnCollector.on('end', async () => {
        const disabledRows = [
          buildRow1(userId),
          buildCombinedRow2(userId),
          buildRow3(userId),
          buildCombinedRow4(userId),
          buildRow5(userId)
        ].map(row => {
          row.components = row.components.map(component => {
            if (component.data?.type === 2) {
              return ButtonBuilder.from(component).setDisabled(true);
            }
            return component;
          });
          return row;
        });
        try {
          await interaction.editReply({
            content: messageContent || '*No message content*',
            embeds: [currentEmbed],
            components: disabledRows
          });
        } catch (e) { }
        activeEmbedCreators.delete(userId);
        client.off('messageDelete', messageDeleteHandler);
      });

      activeEmbedCreators.set(userId, { 
        collector: btnCollector, 
        message: previewMessage 
      });
      
    } catch (error) {
      xeonLog('ERROR', `Error in embedcreator command: ${error.message}`);
    }
  },
};
