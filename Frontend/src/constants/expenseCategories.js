/**
 * Expense Categories Configuration
 *
 * Structure: Main Category -> Sub Categories
 * Total: 47 items across 5 main categories
 */

export const EXPENSE_CATEGORIES = {
  "Survival (Kebutuhan)": [
    // Makanan & Minuman
    "Makan & Minum",
    "Sarapan",
    "Jajan Harian",

    // Transportasi
    "Bensin",
    "Parkir",
    "Ojol / Taksi Online",
    "Transport Pulang",

    // Tagihan Rutin
    "Listrik",
    "Internet",
    "Pulsa",
    "Air",
    "Biaya Admin",

    // Kesehatan
    "Berobat",
    "Obat",
    "BPJS / Asuransi",

    // Kebutuhan Rumah Tangga
    "Belanja Bulanan",
    "Laundry",

    // Tempat Tinggal
    "Kontrakan",
    "Kosan",

    // Kebutuhan Orang Tua
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
    // Saving & Investment
    "Tabungan Pribadi",
    "Tabungan Anak",
    "Tabung Keluarga",
    "Investasi",

    // Hutang & Cicilan
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

/**
 * Get all main category groups
 * @returns {string[]} Array of main category names
 */
export const getExpenseGroups = () => {
  return Object.keys(EXPENSE_CATEGORIES);
};

/**
 * Get sub-categories for a specific main category
 * @param {string} mainCategory - Main category name
 * @returns {string[]} Array of sub-category names
 */
export const getExpenseSubCategories = (mainCategory) => {
  return EXPENSE_CATEGORIES[mainCategory] || [];
};

/**
 * Get all expense categories as flat array
 * @returns {string[]} Array of all sub-category names
 */
export const getAllExpenseCategories = () => {
  return Object.values(EXPENSE_CATEGORIES).flat();
};
