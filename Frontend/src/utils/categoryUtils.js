/**
 * Normalizes category names to maintain consistency across the app.
 * Maps English/OCR/External terms to standard Indonesian system categories.
 *
 * @param {string} cat - The raw category name
 * @returns {string} The normalized category name
 */
export const normalizeCategory = (cat) => {
  if (!cat) return "Lainnya";

  const lower = cat.toLowerCase().trim();

  // Mapping logic
  if (
    lower === "traveling" ||
    lower === "travel" ||
    lower === "holiday" ||
    lower === "jalan"
  )
    return "Jalan-jalan";

  if (
    lower === "food" ||
    lower === "dining" ||
    lower === "makan" ||
    lower === "minum"
  )
    return "Makan & Minum";

  if (lower === "shopping" || lower === "belanja") return "Shopping";

  if (
    lower === "transport" ||
    lower === "gas" ||
    lower === "bensin" ||
    lower === "transportasi"
  )
    return "Transportasi";

  if (lower === "bills" || lower === "utilities" || lower === "tagihan")
    return "Tagihan";

  if (
    lower === "health" ||
    lower === "medical" ||
    lower === "obat" ||
    lower === "kesehatan"
  )
    return "Kesehatan";

  if (lower === "entertainment" || lower === "leisure" || lower === "hiburan")
    return "Hiburan";

  // If no match found, capitalization cleanup
  // (Optional: handle case where it's already a standard Indonesian cat but with weird casing)
  return cat;
};
