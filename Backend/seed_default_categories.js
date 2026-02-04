const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: (process.env.DB_HOST || "localhost").trim(),
  user: (process.env.DB_USER || "root").trim(),
  password: (process.env.DB_PASSWORD || "").trim(),
  database: (process.env.DB_NAME || "myapp_db").trim(),
  port: parseInt(process.env.DB_PORT || "3306"),
  ssl:
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized: false,
          minVersion: "TLSv1.2",
        }
      : null,
};

// --- DATA DEFINITION (Mirrors Frontend Constants) ---

const EXPENSE_CATEGORIES = {
  "Survival (Kebutuhan)": [
    "Makan & Minum",
    "Sarapan",
    "Jajan Harian",
    "Bensin",
    "Parkir",
    "Ojol / Taksi Online",
    "Transport Pulang",
    "Listrik",
    "Internet",
    "Pulsa",
    "Air",
    "Biaya Admin",
    "Berobat",
    "Obat",
    "BPJS / Asuransi",
    "Belanja Bulanan",
    "Laundry",
    "Kontrakan",
    "Kosan",
    "Listrik Orang Tua",
    "Pulsa Orang Tua",
    "Kebutuhan Harian Orang Tua",
  ],
  "Optional (Keinginan)": [
    "Shopping",
    "Marketplace (Shopee, Tokopedia, dll)",
    "Hiburan",
    "Nongkrong",
    "Jalan-jalan",
  ],
  "Culture (Kultur)": ["Pendidikan", "Sekolah", "Kursus", "Buku / Alat Tulis"],
  "Financial (Keuangan)": [
    "Tabungan Pribadi",
    "Tabungan Anak",
    "Tabung Keluarga",
    "Investasi",
    "Bayar Cicilan",
    "Bayar Hutang",
    "Tagih Piutang",
  ],
  "Extra (Tak Terduga)": [
    "Hadiah",
    "Ulang Tahun",
    "Nikahan",
    "Acara Keluarga",
    "Darurat",
    "Lainnya",
  ],
};

const INCOME_CATEGORIES = [
  "Saldo Awal",
  "Gaji",
  "Bonus",
  "Hadiah",
  "Penjualan",
  "Investasi",
  "Bunga Bank",
  "Terima Piutang",
  "Pinjaman",
  "Lainnya",
];

// --- SEED LOGIC ---

async function seedCategories() {
  console.log("🌱 Starting Category Seed...");
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to database");

    // 1. Get All Users
    const [users] = await connection.query("SELECT id, email FROM users");
    console.log(`Found ${users.length} users to seed.`);

    for (const user of users) {
      console.log(`\nProcessing User: ${user.email} (ID: ${user.id})`);

      // Check if user already has categories to avoid duplicates
      const [existing] = await connection.query(
        "SELECT COUNT(*) as count FROM category_groups WHERE user_id = ?",
        [user.id],
      );

      if (existing[0].count > 0) {
        console.log(
          `   ⚠️ Categories already exist for user ${user.id} (${existing[0].count}). Skipping...`,
        );
        continue;
      } else {
        console.log(
          `   ℹ️ No categories found for user ${user.id}. seeding...`,
        );
      }

      // --- SEED EXPENSES ---
      for (const [groupName, subCategories] of Object.entries(
        EXPENSE_CATEGORIES,
      )) {
        // Create Main Group
        const [groupResult] = await connection.query(
          "INSERT INTO category_groups (user_id, name, type, is_default) VALUES (?, ?, ?, ?)",
          [user.id, groupName, "expense", true],
        );
        const groupId = groupResult.insertId;
        // console.log(`   + Group: ${groupName}`);

        // Create Sub Categories
        for (const catName of subCategories) {
          await connection.query(
            "INSERT INTO categories (user_id, group_id, name, type, is_default) VALUES (?, ?, ?, ?, ?)",
            [user.id, groupId, catName, "expense", true],
          );
        }
      }
      console.log("   ✅ Expense categories seeded.");

      // --- SEED INCOME ---
      for (const catName of INCOME_CATEGORIES) {
        await connection.query(
          "INSERT INTO categories (user_id, group_id, name, type, is_default) VALUES (?, NULL, ?, ?, ?)",
          [user.id, catName, "income", true],
        );
      }
      console.log("   ✅ Income categories seeded.");
    }

    console.log("\n🎉 ALL SEEDING COMPLETED SUCCESSFULLY!");
  } catch (error) {
    console.error("❌ Seed Failed:", error.message);
  } finally {
    if (connection) await connection.end();
    process.exit();
  }
}

seedCategories();
