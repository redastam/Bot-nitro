const express = require('express');
const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder 
} = require('discord.js');
const fs = require('fs');

// --- PETIT SERVEUR POUR RENDER ---
const app = express();
app.get('/', (req, res) => res.send('Bot en ligne'));
app.listen(process.env.PORT || 3000);

// --- CONFIGURATION DU BOT ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const TOKEN = 'MTU2NTc5NzIzNjE2Njg5Mzc3OQ.Gpfxgw.QC8Fa3XR_7VyKL5UPkUQPzbL7yw7UUt_WJRZro'; // TON TOKEN
const DB_FILE = './points.json';
const COOLDOWN_TIME = 120000; // 2 minutes

let stockRestant = 20; 

const cooldowns = new Map();
let pointsDB = {};
if (fs.existsSync(DB_FILE)) {
    pointsDB = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify(pointsDB, null, 2));
}

client.on('ready', () => {
    console.log(`Le piège est armé : ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content === '!points') {
        const pts = pointsDB[message.author.id] || 0;
        return message.reply(`Tu as **${pts} / 1000** points. Continue à parler pour gagner !`);
    }

    if (message.content === '!panel') {
        const embed = new EmbedBuilder()
            .setTitle('🎙️ Générateur de Clé Micro')
            .setDescription('Clique sur le bouton ci-dessous pour générer ta clé micro.\n\n⚠️ **Condition :** Avoir au moins **1000 points** de chat.\n\n📦 **Stock actuel :** 20 clés restantes.\n\n*Les points s\'accumulent en discutant dans les salons.*')
            .setColor('#5865F2')
            .setFooter({ text: 'Système de récompenses - Nitro Rewards' });

        const button = new ButtonBuilder()
            .setCustomId('claim_micro')
            .setLabel('Clé Micro')
            .setEmoji('🎙️')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        return message.channel.send({ embeds: [embed], components: [row] });
    }

    const userId = message.author.id;
    const now = Date.now();

    if (!pointsDB[userId]) pointsDB[userId] = 0;
    if (pointsDB[userId] >= 1000) return;

    const lastMessageTime = cooldowns.get(userId) || 0;
    if (now - lastMessageTime > COOLDOWN_TIME) {
        pointsDB[userId] += 1;
        cooldowns.set(userId, now);
        saveDB();

        if (pointsDB[userId] === 995) {
            message.channel.send(`<@${userId}> n'est plus qu'à **5 points** ! Tu y es presque ! 🔥`);
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'claim_micro') {
        const userId = interaction.user.id;
        const pts = pointsDB[userId] || 0;

        if (pts < 1000) {
            return interaction.reply({ content: `❌ **Erreur : Points insuffisants.**\nTu as seulement **${pts} points**. Il t'en faut **1000** pour générer cette clé.`, ephemeral: true });
        }

        if (stockRestant <= 0) {
            return interaction.reply({ content: `❌ **Erreur : Stock épuisé.**\nDésolé, toutes les clés ont déjà été générées. Merci de réessayer plus tard.`, ephemeral: true });
        }

        return interaction.reply({ content: `❌ **Erreur système.**\nUne erreur est survenue lors de la communication avec le serveur. Merci de réessayer plus tard.`, ephemeral: true });
    }
});

client.login(TOKEN);
