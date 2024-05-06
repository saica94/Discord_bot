const {
    ActionRowBuilder,
    Events,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    SlashCommandBuilder,
    ActionRow,
} = require('discord.js');

module.exports = {
    // スラッシュコマンドの登録
    data: new SlashCommandBuilder()
        .setName("modal")
        .setDescription("モーダルを表示"),
    // スラッシュコマンドを受け取ると以下が実行される
    async execute(interaction) {
        if(!interaction.isChatInputCommand()) return;
        if(interaction.commandName === "modal") {
            const modal = new ModalBuilder()
                .setCustomId("myModal")
                .setTitle("Modal");

            // モーダルを構成するコンポーネントを定義
            const teamnameInput = new TextInputBuilder()
                .setCustomId("teamnameInput")
                .setLabel("チーム名")
                .setStyle(TextInputStyle.Short);
            const readingInput = new TextInputBuilder()
                .setCustomId("readingInput")
                .setLabel("読み方")
                .setStyle(TextInputStyle.Short);
            const ingameIdInput = new TextInputBuilder()
                .setCustomId("ingameIdInput")
                .setLabel("ゲーム内ID")
                .setStyle(TextInputStyle.Short);
            const favoriteRoleInput = new TextInputBuilder()
                .setCustomId("favoriteRoleInput")
                .setLabel("好きなロール")
                .setStyle(TextInputStyle.Short);
            const favoriteCharaInput = new TextInputBuilder()
                .setCustomId("favoriteCharaInput")
                .setLabel("好きなキャラ")
                .setStyle(TextInputStyle.Short);
            
                // コンポーネントの登録
                const firstActionRow = new ActionRowBuilder().addComponents(
                    teamnameInput
                );
                const secondsActionRow = new ActionRowBuilder().addComponents(
                    readingInput
                );
                const thirdActionRow = new ActionRowBuilder().addComponents(
                    ingameIdInput
                );
                const fourthActionRow = new ActionRowBuilder().addComponents(
                    favoriteRoleInput
                );
                const fifthActionRow = new ActionRowBuilder().addComponents(
                    favoriteCharaInput
                );
                modal.addComponents(firstActionRow, secondsActionRow, thirdActionRow, fourthActionRow, fifthActionRow);

                // モーダルの表示
                await interaction.showModal(modal);
        }
    },
};