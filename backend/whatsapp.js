if (process.env.ENABLE_WHATSAPP !== 'true') {
  console.log('⚠️ WhatsApp module fully disabled');

  module.exports = {
    getQR: () => null,
    isReady: () => false,
    sendMessage: async () => ({
      success: false,
      disabled: true
    })
  };

} else {
  const { Client, LocalAuth } = require('whatsapp-web.js');
  const qrcode = require('qrcode');

  let currentQR = null;
  let ready = false;

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: 'asma-medical'
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    }
  });

  client.on('qr', async (qr) => {
    currentQR = await qrcode.toDataURL(qr);
    console.log('📱 WhatsApp QR generated');
  });

  client.on('ready', () => {
    ready = true;
    console.log('🔐 WhatsApp Authenticated');
  });

  client.initialize();

  module.exports = {
    getQR: () => currentQR,
    isReady: () => ready,
    sendMessage: async (number, message) => {
      try {
        const formatted = number.replace(/\+/g, '') + '@c.us';

        await client.sendMessage(formatted, message);

        return {
          success: true
        };

      } catch (error) {
        console.error(error);

        return {
          success: false,
          error: error.message
        };
      }
    }
  };
}