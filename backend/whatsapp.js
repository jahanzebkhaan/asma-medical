const { Client, LocalAuth } = require('whatsapp-web.js');

let latestQR = null;
let isWhatsAppReady = false;

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "AsmaMedical"
    }),
    puppeteer: {
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    }
});

client.on('qr', (qr) => {
    latestQR = qr;

    console.log('');
    console.log('📱 WhatsApp QR Generated');
    console.log('👉 Open AsmaMedical frontend to scan QR');
});

client.on('authenticated', () => {
    console.log('🔐 WhatsApp Authenticated');
});

client.on('ready', () => {
    isWhatsAppReady = true;
    latestQR = null;

    console.log('');
    console.log('✅ WhatsApp Connected Successfully!');
    console.log('🚀 AsmaMedical WhatsApp Engine is Live');
});

client.on('auth_failure', msg => {
    console.error('❌ Auth Failure:', msg);
});

client.on('disconnected', reason => {
    console.log('⚠️ WhatsApp Disconnected:', reason);
});

client.initialize();

module.exports = {
    client,
    getQR: () => latestQR,
    isReady: () => isWhatsAppReady
};