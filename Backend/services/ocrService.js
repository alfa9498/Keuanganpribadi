const Tesseract = require("tesseract.js");

const KEYWORD_MAPPING = {
  SPBU: "Transportasi",
  PERTAMINA: "Transportasi",
  SHELL: "Transportasi",
  PARKIR: "Transportasi",
  POS: "Transportasi",
  KELUAR: "Transportasi",
  STASIUN: "Transportasi",
  MOTOR: "Transportasi",
  MOBIL: "Transportasi",
  INDOMARET: "Belanja Bulanan",
  ALFAMART: "Belanja Bulanan",
  SUPERINDO: "Belanja Bulanan",
  HYPERMART: "Belanja Bulanan",
  TOKOPEDIA: "Belanja Online",
  SHOPEE: "Belanja Online",
  GOJEK: "Transportasi",
  GRAB: "Transportasi",
  PLN: "Tagihan",
  TELKOM: "Tagihan",
  PULSA: "Tagihan",
  RESTORAN: "Makanan",
  WARUNG: "Makanan",
  KAFE: "Makanan",
  COFFEE: "Makanan",
  STARBUCKS: "Makanan",
  MCDONALD: "Makanan",
  KFC: "Makanan",
  BENSIN: "Transportasi",
  PERTALITE: "Transportasi",
  PERTAMAX: "Transportasi",
};

const parseReceipt = async (imageBuffer) => {
  try {
    console.log("🔍 Starting Tesseract.js OCR processing...");
    const startTime = Date.now();

    // Call Tesseract OCR (supports Indonesian + English)
    const {
      data: { text },
    } = await Tesseract.recognize(
      imageBuffer,
      "ind+eng", // Indonesian + English
      {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`📊 OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      },
    );

    console.log(`✅ OCR completed in ${Date.now() - startTime}ms`);
    console.log("📄 Raw OCR Text:", text);

    if (!text || text.trim().length === 0) {
      console.log("⚠️ No text detected in image");
      return {
        category: "Lainnya",
        amount: 0,
        description: "Scan Struk (Tidak Terdeteksi)",
        text: "",
      };
    }

    // 1. Clean and Filter Text
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => {
        if (line.length < 3) return false;
        if (/^[^\w\s]+$/.test(line)) return false;
        return true;
      });

    const cleanText = lines.join("\n").toUpperCase();
    console.log("🧹 Cleaned OCR Text:", cleanText);

    // 2. Keyword Matching for Category
    let detectedCategory = "Lainnya";
    for (const [keyword, category] of Object.entries(KEYWORD_MAPPING)) {
      if (cleanText.includes(keyword)) {
        detectedCategory = category;
        console.log(
          `🏷️ Category detected: ${detectedCategory} (keyword: ${keyword})`,
        );
        break;
      }
    }

    // 3. Extract Merchant Name (Description)
    let detectedDescription = "Scan Struk";
    if (lines.length > 0) {
      const firstLine = lines[0].replace(/[`*_|]/g, "").trim();
      const totalKeywords = [
        "TOTAL",
        "JUMLAH",
        "BAYAR",
        "BIAYA",
        "PONDOK",
        "STASIUN",
      ];
      const isTotalLine = totalKeywords.some((k) =>
        firstLine.toUpperCase().includes(k),
      );

      if (!isTotalLine && firstLine.length > 3) {
        detectedDescription = firstLine;
      }
    }
    console.log(`📝 Description: ${detectedDescription}`);

    // 4. Extract Amount
    let detectedAmount = 0;
    const amountRegex = /(?:RP\.?\s?)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/i;

    for (const line of lines) {
      const cleanLine = line.toUpperCase().replace(/\s/g, "");
      if (
        cleanLine.includes("TOTAL") ||
        cleanLine.includes("JUMLAH") ||
        cleanLine.includes("BAYAR") ||
        cleanLine.includes("BIAYA") ||
        cleanLine.includes("NETTO")
      ) {
        const match = line.match(amountRegex);
        if (match) {
          const cleanNum = parseInt(match[1].replace(/[.,]/g, ""));
          if (!isNaN(cleanNum) && cleanNum > 0) {
            detectedAmount = cleanNum;
            console.log(
              `💰 Amount found: Rp ${detectedAmount.toLocaleString("id-ID")}`,
            );
            break;
          }
        }
      }
    }

    // Fallback: Search for any amount-like number
    if (detectedAmount === 0) {
      console.log("🔄 Trying fallback amount detection...");
      for (const line of lines) {
        const match = line.match(amountRegex);
        if (match) {
          const cleanNum = parseInt(match[1].replace(/[.,]/g, ""));
          if (!isNaN(cleanNum) && cleanNum > 500 && cleanNum < 10000000) {
            detectedAmount = cleanNum;
            console.log(
              `💰 Fallback amount: Rp ${detectedAmount.toLocaleString("id-ID")}`,
            );
            break;
          }
        }
      }
    }

    return {
      category: detectedCategory,
      amount: detectedAmount,
      description: detectedDescription,
      text: cleanText,
    };
  } catch (error) {
    console.error("❌ OCR Error:", error);
    throw error;
  }
};

module.exports = { parseReceipt };
