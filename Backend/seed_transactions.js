const db = require("./config/db");

const seedTransactions = async () => {
  // 1. Dapatkan user_id (Gunakan test@example.com jika ada, atau user pertama)
  const getUserQuery = "SELECT id FROM users LIMIT 1";

  db.query(getUserQuery, async (err, results) => {
    if (err || results.length === 0) {
      console.error(
        "❌ Tidak ada user ditemukan. Silakan jalankan seed_user.js dulu atau daftar akun.",
      );
      process.exit(1);
    }

    const userId = results[0].id;
    console.log(`✅ Menggunakan User ID: ${userId} untuk data dummy.`);

    // 2. Definisi Data Dummy
    const categories = {
      expense: [
        "Makanan",
        "Transportasi",
        "Hiburan",
        "Belanja",
        "Kesehatan",
        "Listrik",
        "Internet",
      ],
      income: ["Gaji", "Bonus", "Freelance", "Investasi"],
    };

    const accounts = ["Cash", "Bank Mandiri", "GoPay", "ShopeePay"];
    const paymentMethods = ["Cash", "Transfer", "QRIS", "Debit Card"];

    const transactions = [];
    const now = new Date();

    // Buat 50 transaksi dalam 30 hari terakhir
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date(now);
      date.setDate(now.getDate() - daysAgo);

      const isIncome = Math.random() > 0.7; // 30% income, 70% expense
      const type = isIncome ? "income" : "expense";
      const categoryList = categories[type];
      const category =
        categoryList[Math.floor(Math.random() * categoryList.length)];

      // Random amount
      let amount;
      if (isIncome) {
        amount = Math.floor(Math.random() * 5000000) + 1000000; // 1jt - 6jt
      } else {
        amount = Math.floor(Math.random() * 200000) + 10000; // 10rb - 210rb
      }

      const account = accounts[Math.floor(Math.random() * accounts.length)];
      const paymentMethod =
        paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const description = `${type === "income" ? "Pemasukan" : "Pengeluaran"} dummy ${category}`;

      transactions.push([
        userId,
        date.toISOString().split("T")[0],
        type,
        category,
        amount,
        description,
        paymentMethod,
        account,
      ]);
    }

    // 3. Insert ke Database
    const insertQuery = `
            INSERT INTO transactions 
            (user_id, date, type, category, amount, description, payment_method, account) 
            VALUES ?
        `;

    db.query(insertQuery, [transactions], (err, result) => {
      if (err) {
        console.error("❌ Gagal memasukkan data dummy:", err.message);
      } else {
        console.log(
          `✅ Berhasil memasukkan ${result.affectedRows} data transaksi dummy!`,
        );
        console.log("Grafik di dashboard sekarang seharusnya sudah muncul.");
      }
      process.exit(0);
    });
  });
};

seedTransactions();
