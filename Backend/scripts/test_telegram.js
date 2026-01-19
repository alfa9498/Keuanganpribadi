require('dotenv').config();
const { sendTelegram } = require('../services/notificationService');

const run = async () => {
    console.log("Testing Telegram Notification...");
    
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
        console.error("ERROR: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing in .env");
        console.log("Please check TELEGRAM_SETUP.md for instructions.");
        return;
    }

    const success = await sendTelegram("🔔 Tes Notifikasi dari Aplikasi Finance!");
    
    if (success) {
        console.log("✅ Sukses! Cek Telegram Anda.");
    } else {
        console.log("❌ Gagal mengirim pesan.");
    }
};

run();
