const {
    Events,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require('discord.js');

module.exports = {
    // スラッシュコマンドの登録
    data: new SlashCommandBuilder()
        .setName("buttons")
        .setDescription("ボタンを表示"),
    // スラッシュコマンドを受け取ると以下が実行される
    async execute(interaction) {
        if(!interaction.isChatInputCommand()) return;
        if(interaction.commandName === "buttons") {
            const addteaminfoButton = new ButtonBuilder()
                .setCustomId("addteaminfoButton")
                .setLabel("チーム情報登録")
                .setStyle(ButtonStyle.Primary);
            const row = new ActionRowBuilder()
                .addComponents(addteaminfoButton);
            
            await interaction.reply({
                content:"",
                components: [row],
            })
        }
    },
};