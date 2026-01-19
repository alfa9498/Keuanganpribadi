const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const transactionService = require('./transactionService');
const ocrService = require('./ocrService');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const ownerChatId = process.env.TELEGRAM_CHAT_ID;
const appUserId = process.env.TELEGRAM_USER_ID || 1; // Fetch from .env or default to 1

let bot = null;

const init = () => {
    console.log('🏁 Initializing Telegram Bot Service...');
    if (!token) {
        console.warn('⚠️ Telegram Bot Token not found in .env');
        return;
    }

    // Initialize Bot
    if (process.env.WEBHOOK_URL) {
        bot = new TelegramBot(token); // No polling
        console.log(`🤖 Telegram Bot initialized in Webhook mode: ${process.env.WEBHOOK_URL}`);
        bot.setWebHook(`${process.env.WEBHOOK_URL}/api/telegram-webhook`);
    } else {
        bot = new TelegramBot(token, { polling: true });
        console.log('🤖 Telegram Bot is running in Polling mode...');
    }

    // Set Bot Commands Menu
    bot.setMyCommands([
        { command: '/start', description: 'Menu Utama' },
        { command: '/help', description: 'Bantuan' },
        { command: '/in', description: 'Input Pemasukan (Manual)' },
        { command: '/out', description: 'Input Pengeluaran (Manual)' }
    ]);

    // External Trigger for Webhooks
    const processUpdate = (body) => {
        if (bot) bot.processUpdate(body);
    };

    // Middleware to check authorization
    const isAuthorized = (msg) => {
        const chatId = msg.chat.id.toString();
        // Skip log for persistent menu clicks unless they are text
        if (msg.text) console.log(`[BOT] Incoming from ${chatId} (${msg.from?.username || 'no-username'}): ${msg.text}`);
        
        if (chatId !== ownerChatId) {
            console.warn(`[BOT] Unauthorized attempt from: ${chatId}`);
            bot.sendMessage(msg.chat.id, "⛔ Unauthorized access.");
            return false;
        }
        return true;
    };

    // State for interactive sessions (e.g., editing amount)
    const userState = {};

    bot.on('message', async (msg) => {
        if (!isAuthorized(msg)) return;
        const chatId = msg.chat.id;
        const text = msg.text;

        // --- HANDLE PERSISTENT KEYBOARD CLICKS ---
        if (text === '➕ Pemasukan') {
            userState[chatId] = { type: 'wait_amt', t: 'income' };
            bot.sendMessage(chatId, "Silakan ketik **Nominal** pemasukan:");
            return;
        }
        if (text === '➖ Pengeluaran') {
            userState[chatId] = { type: 'wait_amt', t: 'expense' };
            bot.sendMessage(chatId, "Silakan ketik **Nominal** pengeluaran:");
            return;
        }
        if (text === '❓ Bantuan') {
            bot.sendMessage(chatId, "Kirim foto struk atau klik tombol di bawah untuk input manual.");
            return;
        }

        if (!text || text.startsWith('/')) return;

        // State Machine Handling
        if (userState[chatId]) {
            const state = userState[chatId];
            
            // 1. Waiting for Amount (Manual Flow)
            if (state.type === 'wait_amt') {
                const amt = parseInt(text.replace(/\D/g, ''));
                if (!isNaN(amt) && amt > 0) {
                    userState[chatId] = { ...state, type: 'wait_cat', amt };
                    const categories = ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Tagihan', 'Lainnya'];
                    const buttons = categories.reduce((acc, curr, i) => {
                        if (i % 2 === 0) acc.push([{ text: curr, callback_data: JSON.stringify({ a: 'set_cat', cat: curr }) }]);
                        else acc[acc.length - 1].push({ text: curr, callback_data: JSON.stringify({ a: 'set_cat', cat: curr }) });
                        return acc;
                    }, []);
                    
                    bot.sendMessage(chatId, `💰 Nominal: **Rp ${amt.toLocaleString('id-ID')}**\n\nSekarang pilih **Kategori**:`, {
                        reply_markup: { inline_keyboard: buttons },
                        parse_mode: 'Markdown'
                    });
                } else {
                    bot.sendMessage(chatId, "⚠️ Masukkan angka nominal yang valid.");
                }
                return;
            }

            // 2. Waiting for Description (Manual or OCR Edit)
            if (state.type === 'wait_desc') {
                const desc = text.trim();
                const finalDesc = desc.toLowerCase() === 'skip' ? '-' : desc;
                // Update state for confirmation
                userState[chatId] = { ...state, type: 'wait_confirm', desc: finalDesc };
                
                const summary = `
📝 **Ringkasan Transaksi**
💰 Jumlah: **Rp ${state.amt.toLocaleString('id-ID')}**
📂 Kategori: **${state.cat}**
📝 Catatan: **${finalDesc}**

Klik simpan di bawah:
                `;
                bot.sendMessage(chatId, summary, {
                    reply_markup: {
                        inline_keyboard: [[{ text: '✅ Simpan Sekarang', callback_data: JSON.stringify({ a: 'final_save' }) }]]
                    },
                    parse_mode: 'Markdown'
                });
                return;
            }

            // 3. Edit Amount (OCR or Manual Flow)
            if (state.type === 'edit_amt') {
                const newAmt = parseInt(text.replace(/\D/g, ''));
                if (!isNaN(newAmt)) {
                    userState[chatId] = { ...state, type: 'wait_confirm', amt: newAmt };
                    bot.sendMessage(chatId, `Nominal diubah menjadi **Rp ${newAmt.toLocaleString('id-ID')}**.`, {
                        reply_markup: {
                            inline_keyboard: [[{
                                text: '✅ Lanjut Simpan',
                                callback_data: JSON.stringify({ a: 'final_save' })
                            }]]
                        },
                        parse_mode: 'Markdown'
                    });
                }
                return;
            }

            // 4. Edit Description (OCR Flow)
            if (state.type === 'edit_desc') {
                const newDesc = text.trim();
                userState[chatId] = { ...state, type: 'wait_confirm', desc: newDesc };
                bot.sendMessage(chatId, `Deskripsi diubah menjadi: **${newDesc}**.`, {
                    reply_markup: {
                        inline_keyboard: [[{
                            text: '✅ Lanjut Simpan',
                            callback_data: JSON.stringify({ a: 'final_save' })
                        }]]
                    },
                    parse_mode: 'Markdown'
                });
                return;
            }
        }
    });

    // /start - Menu Utama
    bot.onText(/\/start/, (msg) => {
        if (!isAuthorized(msg)) return;
        delete userState[msg.chat.id];
        const welcomeMessage = `
🏦 **Selamat Datang di Finance Bot!**

Gunakan tombol di bawah untuk input cepat atau kirim foto struk.
        `;
        const opts = {
            parse_mode: 'Markdown',
            reply_markup: {
                keyboard: [
                    ['➕ Pemasukan', '➖ Pengeluaran'],
                    ['❓ Bantuan']
                ],
                resize_keyboard: true,
                persistent: true
            }
        };
        bot.sendMessage(msg.chat.id, welcomeMessage, opts);
    });

    // /help
    bot.onText(/\/help/, (msg) => {
        if (!isAuthorized(msg)) return;
        delete userState[msg.chat.id]; // Clear state
        const helpMessage = `
🤖 **Finance Bot Help**

**1. Input Cepat (Tombol):**
Klik /start lalu pilih **Pemasukan** atau **Pengeluaran**. Ikuti langkahnya!

**2. Scan Struk (Foto):**
Kirim foto struk, saya akan baca otomatis. Anda bisa edit jumlah, kategori, atau deskripsi sebelum simpan.

**3. Manual (Perintah):**
\`/in 50000 Gaji\`
\`/out 20000 Makanan\`
        `;
        bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: 'Markdown' });
    });

    // Helper function to parse date
    const parseDate = (dateStr) => {
        if (!dateStr) return new Date();
        
        // Support DD/MM/YYYY or DD-MM-YYYY
        const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
        const match = dateStr.match(datePattern);
        
        if (match) {
            const day = parseInt(match[1]);
            const month = parseInt(match[2]) - 1; // JS months are 0-indexed
            const year = parseInt(match[3]);
            return new Date(year, month, day);
        }
        
        return new Date(); // Default to today if parsing fails
    };

    // /in & /out - Updated to support optional date AND optional description
    // Updated Regex: \/(in|out)\s+(\d+)\s+(\S+)(?:\s+(.+))?
    // Explanation: (\S+) is category, then optional space and rest of message
    bot.onText(/\/(in|out)\s+(\d+)\s+(\S+)(?:\s+(.+))?/, async (msg, match) => {
        if (!isAuthorized(msg)) return;

        const type = match[1] === 'in' ? 'income' : 'expense';
        const amount = parseInt(match[2]);
        const category = match[3];
        const restOfMessage = match[4] ? match[4].trim() : "";

        console.log(`[BOT] Command: ${type}, Amt: ${amount}, Cat: ${category}, Rest: ${restOfMessage}`);

        // Try to extract date from end of message
        let description = restOfMessage;
        let transactionDate = new Date();

        if (restOfMessage) {
            const words = restOfMessage.split(' ');
            const lastWord = words[words.length - 1];
            const datePattern = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/;
            
            if (datePattern.test(lastWord)) {
                transactionDate = parseDate(lastWord);
                description = words.slice(0, -1).join(' ');
            }
        }

        try {
            const result = await transactionService.createTransaction({
                user_id: appUserId, // Use configured User ID
                date: transactionDate,
                type: type,
                category: category,
                amount: amount,
                description: description || `Input via Telegram`,
                payment_method: 'Cash',
                account: 'Cash Account',
                status: 'done'
            });

            const formattedDate = transactionDate.toLocaleDateString('id-ID');
            bot.sendMessage(msg.chat.id, `✅ **Transaction Saved!**\nDate: ${formattedDate}\nType: ${type}\nCategory: ${category}\nAmount: Rp ${amount.toLocaleString('id-ID')}\nDesc: ${description || 'Input via Telegram'}`, { parse_mode: 'Markdown' });

        } catch (error) {
            console.error("Bot Transaction Error:", error);
            bot.sendMessage(msg.chat.id, `❌ Failed to save transaction: ${error.message}`);
        }
    });

    // Incomplete command helper
    bot.onText(/\/(in|out)$/, (msg) => {
        if (!isAuthorized(msg)) return;
        delete userState[msg.chat.id];
        bot.sendMessage(msg.chat.id, "⚠️ Format salah. Gunakan:\n`/out 50000 Makanan Deskripsi`", { parse_mode: 'Markdown' });
    });

    // photo handler - use Buttons instead of copy-paste instructions
    bot.on('photo', async (msg) => {
        if (!isAuthorized(msg)) return;
        delete userState[msg.chat.id];

        try {
            bot.sendMessage(msg.chat.id, "⏳ Memproses struk... (OCR)");

            const photo = msg.photo[msg.photo.length - 1];
            const fileLink = await bot.getFileLink(photo.file_id);
            const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(response.data);

            const ocrResult = await ocrService.parseReceipt(imageBuffer);
            
            const sanitizedText = ocrResult.text.replace(/[`*_]/g, ' ').substring(0, 150);
            
            // Store results in state to avoid large callback_data
            userState[msg.chat.id] = { 
                type: 'wait_confirm', 
                amt: ocrResult.amount, 
                cat: ocrResult.category, 
                desc: ocrResult.description,
                t: 'expense' 
            };

            const statusMsg = `
🧾 **Struk Terdeteksi!**
**Hasil Text:**
\`${sanitizedText}...\`

**Data Transaksi:**
💰 Jumlah: **Rp ${ocrResult.amount.toLocaleString('id-ID')}**
📂 Kategori: **${ocrResult.category}**
📝 Deskripsi: **${ocrResult.description}**

Apakah sudah benar? Klik simpan atau edit jika ada yang salah.
            `;

            const opts = {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✅ Ya, Simpan', callback_data: JSON.stringify({ a: 'final_save' }) }],
                        [
                            { text: '💰 Ubah Nominal', callback_data: JSON.stringify({ a: 'edit_amt' }) },
                            { text: '📂 Ubah Kategori', callback_data: JSON.stringify({ a: 'edit_cat' }) }
                        ],
                        [
                            { text: '📝 Ubah Deskripsi', callback_data: JSON.stringify({ a: 'edit_desc' }) },
                            { text: '❌ Abaikan', callback_data: JSON.stringify({ a: 'ignore' }) }
                        ]
                    ]
                }
            };
            bot.sendMessage(msg.chat.id, statusMsg, opts);
        } catch (error) {
            console.error("Bot OCR Error:", error);
            bot.sendMessage(msg.chat.id, "❌ Gagal memproses gambar.");
        }
    });

    bot.on('callback_query', async (query) => {
        const chatId = query.message.chat.id;
        try {
            const data = JSON.parse(query.data);
            const state = userState[chatId];

            if (data.a === 'help') {
                bot.answerCallbackQuery(query.id);
                bot.sendMessage(chatId, "Bantuan:\n- Gunakan tombol untuk input manual.\n- Kirim foto struk untuk input otomatis.\n- Gunakan perintah /start untuk ke menu utama.");
                return;
            }

            // --- MANUAL FLOW BUTTONS ---
            if (data.a === 'btn_in' || data.a === 'btn_out') {
                bot.answerCallbackQuery(query.id);
                userState[chatId] = { type: 'wait_amt', t: data.a === 'btn_in' ? 'income' : 'expense' };
                bot.sendMessage(chatId, `Silakan ketik **Nominal** ${data.a === 'btn_in' ? 'pemasukan' : 'pengeluaran'}:`);
                return;
            }

            if (data.a === 'set_cat') {
                bot.answerCallbackQuery(query.id);
                if (!state) return;
                userState[chatId] = { ...state, type: 'wait_desc', cat: data.cat };
                bot.sendMessage(chatId, `📂 Kategori: **${data.cat}**\n\nTerakhir, ketik **Deskripsi** singkat (atau ketik \`skip\`):`, { parse_mode: 'Markdown' });
                return;
            }

            // --- COMMON & OCR ACTIONS ---
            if (data.a === 'ignore') {
                delete userState[chatId];
                bot.answerCallbackQuery(query.id, { text: "Dibatalkan." });
                bot.editMessageText("❌ Transaksi dibatalkan.", { chat_id: chatId, message_id: query.message.message_id });
                return;
            }

            if (data.a === 'final_save') {
                if (!state) {
                    bot.answerCallbackQuery(query.id, { text: "Sesi kadaluarsa." });
                    return;
                }
                bot.answerCallbackQuery(query.id, { text: "Menyimpan..." });
                await transactionService.createTransaction({
                    user_id: appUserId,
                    date: new Date(),
                    type: state.t,
                    category: state.cat,
                    amount: state.amt,
                    description: state.desc || "Input via Bot",
                    payment_method: 'Cash',
                    account: 'Cash Account',
                    status: 'done'
                });
                delete userState[chatId];
                bot.editMessageText(`✅ **Tersimpan!**\n💰 Rp ${state.amt.toLocaleString('id-ID')}\n📂 ${state.cat}\n📝 ${state.desc || '-'}`, {
                    chat_id: chatId,
                    message_id: query.message.message_id,
                    parse_mode: 'Markdown'
                });
            }

            if (data.a === 'edit_amt') {
                bot.answerCallbackQuery(query.id);
                if (!state) return;
                userState[chatId] = { ...state, type: 'edit_amt' };
                bot.sendMessage(chatId, `Ketik nominal baru untuk **${state.cat}**:`);
            }

            if (data.a === 'edit_cat') {
                bot.answerCallbackQuery(query.id);
                if (!state) return;
                const categories = ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Tagihan', 'Lainnya'];
                const buttons = categories.map(c => ([{
                    text: c,
                    callback_data: JSON.stringify({ a: 'final_save_cat', cat: c })
                }]));
                bot.sendMessage(chatId, `Pilih kategori baru:`, { reply_markup: { inline_keyboard: buttons } });
            }

            if (data.a === 'final_save_cat') {
                if (!state) return;
                state.cat = data.cat;
                bot.answerCallbackQuery(query.id, { text: "Kategori diubah." });
                // We could just save or ask to confirm. Let's save for faster flow.
                await transactionService.createTransaction({
                    user_id: appUserId,
                    date: new Date(),
                    type: state.t,
                    category: state.cat,
                    amount: state.amt,
                    description: state.desc || "Input via Bot",
                    payment_method: 'Cash',
                    account: 'Cash Account',
                    status: 'done'
                });
                delete userState[chatId];
                bot.sendMessage(chatId, `✅ **Tersimpan!**\n💰 Rp ${state.amt.toLocaleString('id-ID')}\n📂 ${state.cat}\n📝 ${state.desc || '-'}`);
            }

            if (data.a === 'edit_desc') {
                bot.answerCallbackQuery(query.id);
                if (!state) return;
                userState[chatId] = { ...state, type: 'edit_desc' };
                bot.sendMessage(chatId, `Ketik deskripsi baru untuk **Rp ${state.amt.toLocaleString('id-ID')}**:`);
            }

        } catch (error) {
            console.error("Callback Error:", error);
            bot.answerCallbackQuery(query.id, { text: "Error." });
        }
    });

    bot.on('polling_error', (error) => {
        console.error("Telegram Polling Error:", error.code);
    });
};

module.exports = { init, processUpdate };
