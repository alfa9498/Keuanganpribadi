/**
 * Income Categories Configuration
 *
 * Structure: Flat list (no grouping)
 * Total: 10 items
 */

export const INCOME_CATEGORIES = [
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

/**
 * Get all income categories
 * @returns {string[]} Array of income category names
 */
export const getIncomeCategories = () => {
  return INCOME_CATEGORIES;
};
