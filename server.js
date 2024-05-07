const fs = require('node:fs');
const path = require('node:path');
const {
    ActionRow,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Client,
    Collection,
    ChannelType,
    Events,
    GatewayIntentBits,
    ModalBuilder,
    PermissionFlagsBits,
    PermissionOverwrites,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');
const { token } = require('./config.json');
const { deploy } = require('./config.json');
const { web_application } = require('./config.json');
const client = new Client({
    intents: [GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});
let ticketOwners = {};
let fetchedData = [];
let userData;
let flag = "add"

// 各コマンドの読み込み
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

for(const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

// BOTが稼働しているかの確認
client.once(Events.ClientReady, () => {
    console.log(`GASアドレス : ${web_application}`)
    console.log("ready");
});

// discordからコマンドを受け取り、それに応じた処理を行う
client.on(Events.InteractionCreate, async(interaction) => {
    if(!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if(!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: "このコマンドの実行中にエラーが発生しました",
            ephemral: true,
        });
    }
});


client.on(Events.InteractionCreate, async(interaction) => {
    console.log(`チケット作成者 -> ${interaction.user.username}(${interaction.user.id})`);
    const customId = interaction.customId;
    if(customId === "addteaminfoButton"){
        const server = interaction.guild;
        const myRole = server.roles.cache.find(role => role.name === 'nodejs_test');
        
        if(Object.values(ticketOwners).includes(interaction.user.id)){
            await interaction.reply(`${interaction.user.toString()} 既にチケットが存在します。`);
            return;
        }

        const channelName = `チケット-${interaction.user.username}`;
        const channel = await interaction.guild.channels.create({
            name: `${channelName}`,
            topic: interaction.user.id,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: myRole.id,
                    allow: [PermissionFlagsBits.SendMessages,PermissionFlagsBits.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.SendMessages,PermissionFlagsBits.ViewChannel],
                },
            ],
        })
        

        ticketOwners[channel.id] = interaction.user.id;

        await channel.send(`${interaction.user.toString()} チケットが作成されました`);

        const ticketMessage = `チケットが作成されました\n${channel.toString()}`;

        await interaction.reply({ content: ticketMessage, ephemeral: true});

        const add_editButton = new ButtonBuilder()
            .setCustomId("add_edit")
            .setLabel("登録/修正する")
            .setStyle(ButtonStyle.Primary);
        const add = new ActionRowBuilder()
            .addComponents(add_editButton);
            await channel.send({ content:"データを登録/修正するには以下のボタンを押してください", components: [add] });

        const delete_ticketButton = new ButtonBuilder()
            .setCustomId("delete_ticket")
            .setLabel("チケットを削除")
            .setStyle(ButtonStyle.Danger);
        const del = new ActionRowBuilder()
            .addComponents(delete_ticketButton);
            await channel.send({ content: "チケットを削除するには以下のボタンを押してください", components: [del] });
    }
    if(customId === 'delete_ticket'){
        const channel = interaction.channel
        await channel.delete()
        ticketOwners[channel.id] = ""
    }
});

client.on(Events.InteractionCreate, async(interaction) => {
    console.log(`クリックしたボタン -> ${interaction.customId}\nクリックしたユーザー -> ${interaction.user.username}(${interaction.user.id})`);
    if(!interaction.isButton()) return;
    if(interaction.customId === 'add_edit'){
        //if(flag === 'edit'){
            const userId = `${interaction.user.id}`;
            const channel = interaction.channel
            userData = await fetchDataFromServer(userId);

            // 登録する前なのか登録した後で修正するのかのフラグが必要の為記載。
            // この処理が無いと flag === "edit" && userData[1] が真にならず
            // モーダルのインプボットボックスに値を設定できない。
            // また、flag === "edit" の部分を削除して動作させようとしても
            // userDataの中身がundefinedの為エラーが出る。
            // 登録した後にもう一度この親イベントを呼び出せば解決するので
            // このような処理になっている
            if(typeof userData === "undefined"){
                flag = "add"
            } else if (userData !== null){
                flag = "edit"
            }
        //}
        const modal = new ModalBuilder()
            .setCustomId("dataModal")
            .setTitle("フォーム");

        // モーダルを構成するコンポーネントを定義
        const teamnameInput = new TextInputBuilder()
            .setCustomId("teamnameInput")
            .setLabel("チーム名")
            .setStyle(TextInputStyle.Short);
            if(flag === "edit" && userData[1]){
                teamnameInput.setValue(userData[1]);
            }
        const readingInput = new TextInputBuilder()
                .setCustomId("readingInput")
                .setLabel("読み方")
                .setStyle(TextInputStyle.Short);
            if(flag === "edit" && userData[2]){
                readingInput.setValue(userData[2]);
            }
            const ingameIdInput = new TextInputBuilder()
                .setCustomId("ingameIdInput")
                .setLabel("ゲーム内ID")
                .setStyle(TextInputStyle.Short);
            if(flag === "edit" && userData[3]){
                ingameIdInput.setValue(userData[3]);
            }
            const favoriteRoleInput = new TextInputBuilder()
                .setCustomId("favoriteRoleInput")
                .setLabel("好きなロール")
                .setStyle(TextInputStyle.Short);
            if(flag === "edit" && userData[4]){
                favoriteRoleInput.setValue(userData[4]);
            }
            const favoriteCharaInput = new TextInputBuilder()
                .setCustomId("favoriteCharaInput")
                .setLabel("好きなキャラ")
                .setStyle(TextInputStyle.Short);
            if(flag === "edit" && userData[5]){
                favoriteCharaInput.setValue(userData[5]);
            }
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
            interaction.showModal(modal);
    }
})

// モーダルで受け取った値をDiscordに送信する
client.on(Events.InteractionCreate, async(interaction) => {
    if(!interaction.isModalSubmit()) return;

    const teamname = interaction.fields.getTextInputValue("teamnameInput");
    const reading = interaction.fields.getTextInputValue("readingInput");
    const ingameId = interaction.fields.getTextInputValue("ingameIdInput");
    const favoriteRole = interaction.fields.getTextInputValue("favoriteRoleInput");
    const favoriteChara = interaction.fields.getTextInputValue("favoriteCharaInput");
    await interaction.reply({
        content:"チーム名:" + teamname + "\n読み方:" + reading + "\nゲーム内ID:" + ingameId + "\n好きなロール:" + favoriteRole + "\n好きなキャラ:" + favoriteChara + "\n",
    });
    const END_POINT = `${web_application}`;
    const SHEET_NO = 1;
    const sourceList = {
        sheetNo: SHEET_NO,
        data: [
            {'userId': `${interaction.user.id}`, 'チーム名': `${teamname}`, '読み方': `${reading}`, 'ゲーム内ID': `${ingameId}`, '好きなロール': `${favoriteRole}`, '好きなキャラ': `${favoriteChara}`},
        ]
    };
    const postparam = {
        method: 'POST',
        body: JSON.stringify(sourceList),
    };

    fetch(END_POINT, postparam)
        .then(response => {
            if(!response.ok){
                throw new Error(`Network response was not ok`);
            }
            console.log(response.status);
            return response.text();
        })
        .then((data) => {
            console.log(data);
        })
        .catch(err => {
            console.error("error", err);
        });

    console.log(`送信したデータ\n${postparam}`);
    userData = null;
})

async function fetchDataFromServer(userId){
    try{
        const response = await fetch(`${web_application}?userId=${userId}`)
        const data = await response.json();
            //.then(response => response.json())
            //.then(data => {
            fetchedData = data.data;
            console.log(`GETリクエスト送信者 -> ${userId}\n***********取得したデータ***********\n${fetchedData}`);
            return fetchedData;
    } catch(error) {
        console.error(error);
        return null;
    }
}

client.login(token);