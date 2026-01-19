const nodemailer = require('nodemailer');

// --- EMAIL CONFIGURATION (SMTP) ---
// For Gmail: Use 'service: "gmail"' and an App Password.
// For others: Configure host, port, secure, auth.
const emailTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use true for 465, false for other ports
    auth: {
        user: '08tplp003@gmail.com', // Email Sender Asli
        pass: 'dlzejfqqstsobwye'     // App Password
    }
});

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Email body text
 */
const sendEmail = async (to, subject, text) => {
    try {
        // If credentials are dummy, don't actually try to send, just log.
        if (emailTransporter.options.auth.user.includes('your-email')) {
            console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Body: ${text}`);
            return true;
        }

        const info = await emailTransporter.sendMail({
            from: '"Finance App" <no-reply@financeapp.com>',
            to,
            subject,
            text
        });
        console.log(`[EMAIL SENT] MessageId: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};

/**
 * Send a WhatsApp message
 * @param {string} phone - Recipient phone number (e.g., 0812...)
 * @param {string} message - Message content
 */
const sendWhatsApp = async (phone, message) => {
    console.log(`[MOCK WHATSAPP] To: ${phone} | Message: ${message}`);

    // --- REAL WHATSAPP INTEGRATION (Example: Fonnte) ---
    // const axios = require('axios');
    // try {
    //     await axios.post('https://api.fonnte.com/send', {
    //         target: phone,
    //         message: message,
    //     }, {
    //         headers: { Authorization: 'YOUR_FONNTE_TOKEN' }
    //     });
    //     return true;
    // } catch (err) {
    //     console.error('WA Error:', err);
    //     return false;
    // }

    return true;
};

const axios = require('axios'); // Add axios

/**
 * Send a Telegram message
 * @param {string} message - Message content
 */
const sendTelegram = async (message) => {
    // These should be in .env, but for now we'll look for them or use placeholders
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        console.warn("[TELEGRAM] Missing Bot Token or Chat ID. Skipping.");
        return false;
    }

    try {
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        });
        console.log(`[TELEGRAM SENT] Message: ${message}`);
        return true;
    } catch (error) {
        console.error("Error sending Telegram message:", error.response?.data || error.message);
        return false;
    }
};

module.exports = { sendEmail, sendWhatsApp, sendTelegram };
