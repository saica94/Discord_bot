const fs = require('node:fs');
const path = require('node:path');
const {
    ButtonBuilder,
    ButtonStyle,
    Client,

    Collection,
    ChannelType,
    Events,
    GatewayIntentBits,
    PermissionFlagsBits,
    PermissionOverwrites,
    ActionRowBuilder,
} = require('discord.js');
const { token } = require('./config.json');
const { deploy } = require('./config.json');
const { web_application } = require('./config.json');
const client = new Client({
    intents: [GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});
let ticketOwners= {};
console.log(web_application);

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

        const delete_ticketButton = new ButtonBuilder()
            .setCustomId("delete_ticket")
            .setLabel("チケットを削除")
            .setStyle(ButtonStyle.Danger);
        const view = new ActionRowBuilder()
            .addComponents(delete_ticketButton);

            await channel.send({ content: "チケットを削除するには以下のボタンを押してください", components: [view] });
    }
    if(customId === 'delete_ticket'){
        const channel = interaction.channel
        await channel.delete()
        ticketOwners[channel.id] = ""
    }
});

// モーダルで受け取った値をDiscordに送信する
client.on(Events.InteractionCreate, async(interaction) => {
    if(!interaction.isModalSubmit()) return;

    const teamname = interaction.fields.getTextInputValue("teamnameInput");
    const reading = interaction.fields.getTextInputValue("readingInput");
    const ingameId = interaction.fields.getTextInputValue("ingameIdInput");
    const favoriteRole = interaction.fields.getTextInputValue("favoriteRoleInput");
    const favoriteChara = interaction.fields.getTextInputValue("favoriteCharaInput");
    console.log({ teamname, reading, ingameId, favoriteRole, favoriteChara });
    await interaction.reply({
        content:"チーム名:" + teamname + "\n読み方:" + reading + "\nゲーム内ID:" + ingameId + "\n好きなロール:" + favoriteRole + "\n好きなキャラ:" + favoriteChara + "\n",
    });

    const END_POINT = `${web_application}`;
    const SHEET_NO = 1;
    const sourceList = {
        sheetNo: SHEET_NO,
        data: [
            {'チーム名': `${teamname}`, '読み方': `${reading}`, 'ゲーム内ID': `${ingameId}`, '好きなロール': `${favoriteRole}`, '好きなキャラ': `${favoriteChara}`},
        ]
    };

    console.log(sourceList);

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
        }
    );
});

client.login(token);