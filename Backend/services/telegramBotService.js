const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const jwt = require("jsonwebtoken"); // Added for Deep Linking
const transactionService = require("./transactionService");
const ocrService = require("./ocrService");
const db = require("../config/db"); // Added DB connection
require("dotenv").config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Store verification codes temporarily (in production, use Redis)
const verificationCodes = new Map(); // Map<code, {userId, fullName, expires}>

let bot = null;

// External Trigger for Webhooks
const processUpdate = (body) => {
  if (!bot) {
    console.log("🏁 Initializing bot on-demand for update...");
    init();
  }

  console.log(
    "📨 Received Update from Telegram:",
    JSON.stringify(body, null, 2),
  );

  if (bot) {
    try {
      bot.processUpdate(body);
    } catch (err) {
      console.error("❌ Error processing update:", err);
    }
  } else {
    console.warn(
      "⚠️ Telegram Bot failed to initialize, cannot process update.",
    );
  }
};

const init = () => {
  console.log("🏁 Initializing Telegram Bot Service...");
  if (!token) {
    console.warn("⚠️ Telegram Bot Token not found in .env");
    return;
  }

  // Prevent re-initialization if already in memory
  if (bot && process.env.VERCEL === "1") {
    console.log("🤖 Bot already initialized.");
    return;
  }

  // Initialize Bot instance if not exists
  if (!bot) {
    bot = new TelegramBot(token, { polling: !process.env.VERCEL });
    console.log(
      `🤖 Telegram Bot instance created (Polling: ${!process.env.VERCEL})`,
    );
  }

  // Prefer dynamic VERCEL_URL for Preview deployments, unless WEBHOOK_URL is explicitly overriding for Production
  let webhookHost = null;
  if (process.env.VERCEL === "1") {
    // VERCEL_URL is provided by Vercel for each deployment
    webhookHost = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.WEBHOOK_URL;
  } else {
    webhookHost = process.env.WEBHOOK_URL;
  }

  if (webhookHost && process.env.VERCEL === "1") {
    const webhookUrl = `${webhookHost}/telegram-webhook`;
    console.log(`🤖 Setting/Ensuring Webhook: ${webhookUrl}`);
    bot
      .setWebHook(webhookUrl)
      .then((res) =>
        console.log("✅ Webhook Response:", res, "for URL:", webhookUrl),
      )
      .catch((err) => console.error("❌ Webhook Error:", err.message));
  } else if (!process.env.VERCEL) {
    console.log("🤖 Bot is running in Polling mode (Local)...");
  }

  // Set Bot Commands Menu
  bot.setMyCommands([
    { command: "/start", description: "Menu Utama" },
    { command: "/help", description: "Bantuan" },
    { command: "/in", description: "Input Pemasukan (Manual)" },
    { command: "/out", description: "Input Pengeluaran (Manual)" },
  ]);

  // Helper: Get User from Chat ID
  const getUser = async (chatId) => {
    try {
      const query = "SELECT * FROM users WHERE telegram_chat_id = ?";
      const [rows] = await db.promise().query(query, [chatId.toString()]);
      if (rows.length === 0) {
        console.log(`🔍 No user found for telegram_chat_id: ${chatId}`);
      }
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      console.error(`❌ DB Error in getUser(${chatId}):`, err.message);
      return null;
    }
  };

  // State for interactive sessions (e.g., editing amount)
  const userState = {};

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Skip if it's a command (handled by onText)
    if (text && text.startsWith("/")) return;

    // --- HANDLE VERIFICATION CODE INPUT (for linking) ---
    // This MUST be before auth check so unlinked users can link!
    if (text && /^\d{6}$/.test(text)) {
      console.log("🔢 Received potential verification code:", text);
      const codeData = verificationCodes.get(text);

      if (codeData && codeData.expires > Date.now()) {
        console.log("✅ Valid verification code found");
        try {
          // Clear any existing user with this chat ID to prevent Duplicate Entry
          await db
            .promise()
            .query(
              "UPDATE users SET telegram_chat_id = NULL WHERE telegram_chat_id = ?",
              [chatId.toString()],
            );

          const [result] = await db
            .promise()
            .query(
              "UPDATE users SET telegram_chat_id = ?, telegram_username = ? WHERE id = ?",
              [chatId.toString(), msg.from.username || null, codeData.userId],
            );
          console.log(
            "✅ Database updated via verification code, affected rows:",
            result.affectedRows,
          );

          verificationCodes.delete(text); // Remove used code

          bot.sendMessage(
            chatId,
            `✅ **Akun Berhasil Dihubungkan!**\n\nHalo ${codeData.fullName || "User"}, sekarang Anda bisa mencatat keuangan via Telegram!`,
            {
              parse_mode: "Markdown",
            },
          );

          // Show menu
          const linkedUser = await getUser(chatId);
          if (linkedUser) {
            const welcomeMessage = `\n🏦 **Halo, ${linkedUser.full_name}!**\n\nApa yang ingin Anda catat hari ini?\n        `;
            const opts = {
              parse_mode: "Markdown",
              reply_markup: {
                keyboard: [["➕ Pemasukan", "➖ Pengeluaran"], ["❓ Bantuan"]],
                resize_keyboard: true,
                persistent: true,
              },
            };
            bot.sendMessage(chatId, welcomeMessage, opts);
          }
          return;
        } catch (err) {
          console.error("❌ Error linking with verification code:", err);
          bot.sendMessage(
            chatId,
            "⚠️ Terjadi kesalahan saat menghubungkan akun. Silakan coba lagi.",
          );
          return;
        }
      } else if (codeData) {
        console.log("⏰ Verification code expired");
        bot.sendMessage(
          chatId,
          "⚠️ Kode verifikasi sudah kadaluarsa. Silakan request kode baru dari Web App.",
        );
        verificationCodes.delete(text);
        return;
      } else {
        console.log("❌ Invalid verification code:", text);
        // Don't return here - might be a transaction amount
        // Continue to auth check below
      }
    }

    // AUTH CHECK
    const user = await getUser(chatId);
    if (!user) {
      // User not linked and not a valid verification code
      return;
    }

    // --- HANDLE PERSISTENT KEYBOARD CLICKS ---
    if (text === "➕ Pemasukan") {
      userState[chatId] = { type: "wait_amt", t: "income", user };
      bot.sendMessage(chatId, "Silakan ketik **Nominal** pemasukan:");
      return;
    }
    if (text === "➖ Pengeluaran") {
      userState[chatId] = { type: "wait_amt", t: "expense", user };
      bot.sendMessage(chatId, "Silakan ketik **Nominal** pengeluaran:");
      return;
    }
    if (text === "❓ Bantuan") {
      bot.sendMessage(
        chatId,
        "Kirim foto struk atau klik tombol di bawah untuk input manual.",
      );
      return;
    }

    // State Machine Handling
    if (userState[chatId]) {
      const state = userState[chatId];

      // 1. Waiting for Amount (Manual Flow)
      if (state.type === "wait_amt") {
        const amt = parseInt(text.replace(/\D/g, ""));
        if (!isNaN(amt) && amt > 0) {
          userState[chatId] = { ...state, type: "wait_cat", amt };
          const categories = [
            "Makanan",
            "Transportasi",
            "Belanja",
            "Hiburan",
            "Tagihan",
            "Lainnya",
          ];
          const buttons = categories.reduce((acc, curr, i) => {
            if (i % 2 === 0)
              acc.push([
                {
                  text: curr,
                  callback_data: JSON.stringify({ a: "set_cat", cat: curr }),
                },
              ]);
            else
              acc[acc.length - 1].push({
                text: curr,
                callback_data: JSON.stringify({ a: "set_cat", cat: curr }),
              });
            return acc;
          }, []);

          bot.sendMessage(
            chatId,
            `💰 Nominal: **Rp ${amt.toLocaleString("id-ID")}**\n\nSekarang pilih **Kategori**:`,
            {
              reply_markup: { inline_keyboard: buttons },
              parse_mode: "Markdown",
            },
          );
        } else {
          bot.sendMessage(
            chatId,
            "⚠️ Masukkan angka nominal yang valid. (Contoh: 50000)",
          );
        }
        return;
      }

      // 2. Waiting for Description (Manual or OCR Edit)
      if (state.type === "wait_desc") {
        const desc = text.trim();
        const finalDesc = desc.toLowerCase() === "skip" ? "-" : desc;
        // Update state for confirmation
        userState[chatId] = { ...state, type: "wait_confirm", desc: finalDesc };

        const summary = `
📝 **Ringkasan Transaksi**
💰 Jumlah: **Rp ${state.amt.toLocaleString("id-ID")}**
📂 Kategori: **${state.cat}**
📝 Catatan: **${finalDesc}**

Klik simpan di bawah:
                `;
        bot.sendMessage(chatId, summary, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "✅ Simpan Sekarang",
                  callback_data: JSON.stringify({ a: "final_save" }),
                },
              ],
            ],
          },
          parse_mode: "Markdown",
        });
        return;
      }

      // 3. Edit Amount (OCR or Manual Flow)
      if (state.type === "edit_amt") {
        const newAmt = parseInt(text.replace(/\D/g, ""));
        if (!isNaN(newAmt)) {
          userState[chatId] = { ...state, type: "wait_confirm", amt: newAmt };
          bot.sendMessage(
            chatId,
            `Nominal diubah menjadi **Rp ${newAmt.toLocaleString("id-ID")}**.`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "✅ Lanjut Simpan",
                      callback_data: JSON.stringify({ a: "final_save" }),
                    },
                  ],
                ],
              },
              parse_mode: "Markdown",
            },
          );
        }
        return;
      }

      // 4. Edit Description (OCR Flow)
      if (state.type === "edit_desc") {
        const newDesc = text.trim();
        userState[chatId] = { ...state, type: "wait_confirm", desc: newDesc };
        bot.sendMessage(chatId, `Deskripsi diubah menjadi: **${newDesc}**.`, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "✅ Lanjut Simpan",
                  callback_data: JSON.stringify({ a: "final_save" }),
                },
              ],
            ],
          },
          parse_mode: "Markdown",
        });
        return;
      }
    }
  });

  // /start - Menu Utama & Deep Linking
  bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const rawPayload = match[1] || "";
    const payload = rawPayload.trim();

    console.log("🔍 /start received from chatId:", chatId);
    console.log("🔍 Raw payload:", rawPayload);
    console.log("🔍 Trimmed payload:", payload);
    console.log("🔍 Payload length:", payload.length);

    if (payload && payload.length > 0) {
      // Handle Linking
      console.log("🔗 Attempting to link account with JWT...");
      try {
        const decoded = jwt.verify(payload, JWT_SECRET);
        console.log("✅ JWT verified successfully:", decoded);
        const userId = decoded.id;

        // Clear any existing user with this chat ID to prevent Duplicate Entry
        await db
          .promise()
          .query(
            "UPDATE users SET telegram_chat_id = NULL WHERE telegram_chat_id = ?",
            [chatId.toString()],
          );

        // Update DB
        const [result] = await db
          .promise()
          .query(
            "UPDATE users SET telegram_chat_id = ?, telegram_username = ? WHERE id = ?",
            [chatId.toString(), msg.from.username || null, userId],
          );
        console.log("✅ Database updated, affected rows:", result.affectedRows);

        bot.sendMessage(
          chatId,
          `✅ **Akun Berhasil Dihubungkan!**\n\nHalo ${decoded.fullName || "User"}, sekarang Anda bisa mencatat keuangan via Telegram!`,
          {
            parse_mode: "Markdown",
          },
        );

        // Continue to show menu logic below...
      } catch (err) {
        console.error("❌ Linking Error:", err.message);
        console.error("❌ Full error:", err);
        bot.sendMessage(
          chatId,
          "⚠️ Link tidak valid atau sudah kadaluarsa. Silakan request link baru dari Web App.",
        );
        return;
      }
    } else {
      console.log("ℹ️ No payload provided, showing menu for existing user");
    }

    // Check Auth Status for Menu
    const user = await getUser(chatId);
    if (!user) {
      console.log("⚠️ User not found in DB for chatId:", chatId);
      bot.sendMessage(
        chatId,
        "⚠️ **Akun Belum Terhubung.**\nSilakan login ke Web App dan pilih menu 'Hubungkan Telegram' untuk mendapatkan akses.\n\nSilakan hubungkan akun Anda terlebih dahulu.",
        { parse_mode: "Markdown" },
      );
      return;
    }
    console.log("✅ User found:", user.full_name);

    delete userState[chatId];
    const welcomeMessage = `
🏦 **Halo, ${user.full_name}!**

Apa yang ingin Anda catat hari ini?
        `;
    const opts = {
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [["➕ Pemasukan", "➖ Pengeluaran"], ["❓ Bantuan"]],
        resize_keyboard: true,
        persistent: true,
      },
    };
    bot.sendMessage(chatId, welcomeMessage, opts);
  });

  // /help
  bot.onText(/\/help/, async (msg) => {
    const user = await getUser(msg.chat.id);
    if (!user) {
      bot.sendMessage(
        msg.chat.id,
        "Silakan hubungkan akun Anda terlebih dahulu.",
      );
      return;
    }

    delete userState[msg.chat.id]; // Clear state
    const helpMessage = `
🤖 **Panduan Bot Keuangan**

**1. Input Cepat (Tombol):**
Klik /start lalu pilih tombol menu.

**2. Scan Struk (Foto):**
Kirim foto struk -> Bot akan membaca detailnya.

**3. Manual (Perintah Langsung):**
\`/in [nominal] [kategori] [deskripsi]\`
\`/out [nominal] [kategori] [deskripsi]\`

Contoh:
\`/out 20000 Makanan Makan Siang\`
        `;
    bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: "Markdown" });
  });

  // Helper to parse date
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
    const match = dateStr.match(datePattern);
    if (match) {
      return new Date(match[3], match[2] - 1, match[1]);
    }
    return new Date();
  };

  // /in & /out
  bot.onText(/\/(in|out)\s+(\d+)\s+(\S+)(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const user = await getUser(chatId);
    if (!user) {
      bot.sendMessage(chatId, "⛔ Akun belum terhubung.", {
        reply_to_message_id: msg.message_id,
      });
      return;
    }

    const type = match[1] === "in" ? "income" : "expense";
    const amount = parseInt(match[2]);
    const category = match[3];
    const restOfMessage = match[4] ? match[4].trim() : "";

    let description = restOfMessage;
    let transactionDate = new Date(); // Default today

    // Check for date at the end
    if (restOfMessage) {
      const words = restOfMessage.split(" ");
      const lastWord = words[words.length - 1];
      if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(lastWord)) {
        transactionDate = parseDate(lastWord);
        description = words.slice(0, -1).join(" ");
      }
    }

    try {
      await transactionService.createTransaction({
        user_id: user.id, // Linked User ID
        date: transactionDate,
        type: type,
        category: category,
        amount: amount,
        description: description || `Input via Telegram`,
        payment_method: "Cash",
        account: "Cash Account",
        status: "done",
      });

      const formattedDate = transactionDate.toLocaleDateString("id-ID");
      bot.sendMessage(
        chatId,
        `✅ **Sukses!**\nTanggal: ${formattedDate}\nTipe: ${type}\nNominal: Rp ${amount.toLocaleString("id-ID")}`,
        { parse_mode: "Markdown" },
      );
    } catch (error) {
      console.error("Bot Transaction Error:", error);
      bot.sendMessage(chatId, `❌ Gagal menyimpan: ${error.message}`);
    }
  });

  // Handle Photos (OCR)
  bot.on("photo", async (msg) => {
    const chatId = msg.chat.id;
    const user = await getUser(chatId);
    if (!user) {
      bot.sendMessage(chatId, "⛔ Akun belum terhubung.");
      return;
    }

    delete userState[chatId];
    try {
      bot.sendMessage(chatId, "⏳ Membaca struk... (OCR)");

      const photo = msg.photo[msg.photo.length - 1];
      const fileLink = await bot.getFileLink(photo.file_id);
      const response = await axios.get(fileLink, {
        responseType: "arraybuffer",
      });

      const ocrResult = await ocrService.parseReceipt(
        Buffer.from(response.data),
      );

      // Save to state
      userState[chatId] = {
        type: "wait_confirm",
        amt: ocrResult.amount,
        cat: ocrResult.category,
        desc: ocrResult.description,
        t: "expense",
        user: user,
      };

      const statusMsg = `
🧾 **Hasil Scan Struk**
💰 Jumlah: **Rp ${ocrResult.amount.toLocaleString("id-ID")}**
📂 Kategori: **${ocrResult.category}**
📝 Deskripsi: **${ocrResult.description}**

Apakah data sudah benar?
            `;

      const opts = {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ Simpan",
                callback_data: JSON.stringify({ a: "final_save" }),
              },
            ],
            [
              {
                text: "💰 Ubah Rp",
                callback_data: JSON.stringify({ a: "edit_amt" }),
              },
              {
                text: "📂 Ubah Kat",
                callback_data: JSON.stringify({ a: "edit_cat" }),
              },
            ],
            [
              {
                text: "❌ Batal",
                callback_data: JSON.stringify({ a: "ignore" }),
              },
            ],
          ],
        },
      };
      bot.sendMessage(chatId, statusMsg, opts);
    } catch (error) {
      console.error("OCR Error:", error);
      bot.sendMessage(chatId, "❌ Gagal membaca gambar.");
    }
  });

  // Callback Query Handler
  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const data = JSON.parse(query.data);
    const state = userState[chatId];

    // Ensure User is still linked (paranoid check)
    const user = state?.user || (await getUser(chatId));
    if (!user) {
      bot.answerCallbackQuery(query.id, { text: "Auth Error" });
      return;
    }

    try {
      // General Actions
      if (data.a === "ignore") {
        delete userState[chatId];
        bot.answerCallbackQuery(query.id, { text: "Batal." });
        bot.deleteMessage(chatId, query.message.message_id);
        return;
      }

      // --- State-based Actions ---
      if (state) {
        if (data.a === "set_cat") {
          bot.answerCallbackQuery(query.id);
          userState[chatId] = { ...state, type: "wait_desc", cat: data.cat };
          bot.sendMessage(
            chatId,
            `📂 **${data.cat}** terpilih.\nKetik **Deskripsi** transaksi:`,
          );
          return;
        }

        if (data.a === "final_save") {
          bot.answerCallbackQuery(query.id, { text: "Menyimpan..." });
          await transactionService.createTransaction({
            user_id: user.id, // Linked User
            date: new Date(),
            type: state.t,
            category: state.cat,
            amount: state.amt,
            description: state.desc || "Bot Input",
            payment_method: "Cash",
            account: "Cash Account",
            status: "done",
          });
          delete userState[chatId];
          bot.editMessageText(
            `✅ **Tersimpan!**\n💰 Rp ${state.amt.toLocaleString("id-ID")}\n📂 ${state.cat}`,
            {
              chat_id: chatId,
              message_id: query.message.message_id,
              parse_mode: "Markdown",
            },
          );
          return;
        }

        // OCR / Editing branch
        if (data.a === "edit_amt") {
          bot.answerCallbackQuery(query.id);
          userState[chatId] = { ...state, type: "edit_amt" };
          bot.sendMessage(chatId, "Ketik nominal baru:");
          return;
        }
        if (data.a === "edit_cat") {
          bot.answerCallbackQuery(query.id);
          const cats = ["Makanan", "Transportasi", "Belanja", "Lainnya"];
          const buttons = cats.map((c) => [
            { text: c, callback_data: JSON.stringify({ a: "save_cat", c }) },
          ]);
          bot.sendMessage(chatId, "Pilih kategori:", {
            reply_markup: { inline_keyboard: buttons },
          });
          return;
        }
        if (data.a === "save_cat") {
          state.cat = data.c;
          bot.answerCallbackQuery(query.id, { text: "Updated" });
          // Go back to confirmation
          userState[chatId] = { ...state, type: "wait_confirm" };
          bot.sendMessage(
            chatId,
            `Kategori diubah: ${data.c}. Klik Simpan di pesan sebelumnya atau kirim pesan apapun untuk konfirmasi ulang.`,
          );
          // Ideally we should edit the original message but we might have lost reference easily if we sent new message.
          // For simplicity, let's just trigger save if they click save on the original message?
          // No the original message text won't update.
          // Let's re-send confirmation
          const statusMsg = `
Updated:
💰 Rp ${state.amt.toLocaleString("id-ID")}
📂 ${state.cat}
                    `;
          bot.sendMessage(chatId, statusMsg, {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "✅ Simpan",
                    callback_data: JSON.stringify({ a: "final_save" }),
                  },
                ],
              ],
            },
          });
        }
      }
    } catch (err) {
      console.error("Callback Error", err);
    }
  });

  bot.on("polling_error", (error) => {
    if (error.code === "ETELEGRAM" && error.message.includes("EFATAL")) {
      console.error("🛑 Critical Polling Error:", error.message);
    } else if (error.code === "EFATAL") {
      console.error("🛑 Fatal Error:", error.message);
    } else {
      console.warn("⚠️ Polling Error (Minor):", error.message);
    }
  });

  bot.on("webhook_error", (error) => {
    console.error("🛑 Webhook Error:", error.message);
  });

  console.log("✅ Telegram Bot Service successfully initialized.");
};

const stop = async () => {
  if (bot) {
    console.log("🛑 Stopping Telegram Bot...");
    try {
      if (bot.isPolling()) {
        await bot.stopPolling();
        console.log("✅ Polling stopped.");
      }
      if (process.env.VERCEL === "1") {
        await bot.deleteWebHook();
        console.log("✅ Webhook deleted.");
      }
      bot = null;
    } catch (err) {
      console.error("❌ Error during bot shutdown:", err.message);
    }
  }
};

module.exports = {
  init,
  stop,
  processUpdate,
  storeVerificationCode: (code, data) => {
    verificationCodes.set(code, data);
    console.log(`🔑 Verification code stored: ${code} for user ${data.userId}`);
    // Auto-cleanup after expiry
    setTimeout(
      () => {
        if (verificationCodes.has(code)) {
          verificationCodes.delete(code);
          console.log(`🗑️ Verification code expired and removed: ${code}`);
        }
      },
      5 * 60 * 1000,
    );
  },
};
