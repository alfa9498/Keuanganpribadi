const axios = require("axios");

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
    console.log("🔍 Starting OCR.space OCR processing...");
    const startTime = Date.now();

    // Get API key from environment
    const apiKey = process.env.OCR_SPACE_API_KEY || "K87899142388957"; // Free public key (limited)

    // Convert buffer to base64
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;

    // Call OCR.space API
    const formData = new URLSearchParams();
    formData.append("base64Image", base64Image);
    formData.append("language", "eng"); // English works well for Indonesian receipts
    formData.append("isOverlayRequired", "false");
    formData.append("detectOrientation", "true");
    formData.append("scale", "true");
    formData.append("OCREngine", "2"); // Engine 2 is more accurate

    const response = await axios.post(
      "https://api.ocr.space/parse/image",
      formData,
      {
        headers: {
          apikey: apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 30000, // 30 seconds timeout
      },
    );

    console.log(`✅ OCR completed in ${Date.now() - startTime}ms`);

    if (
      !response.data ||
      !response.data.ParsedResults ||
      response.data.ParsedResults.length === 0
    ) {
      console.log("⚠️ No text detected in image");
      return {
        category: "Lainnya",
        amount: 0,
        description: "Scan Struk (Tidak Terdeteksi)",
        text: "",
      };
    }

    const text = response.data.ParsedResults[0].ParsedText;
    console.log("📄 Raw OCR Text:", text);

    if (!text || text.trim().length === 0) {
      console.log("⚠️ Empty OCR result");
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
    console.error("❌ OCR Error:", error.message);
    if (error.response) {
      console.error("❌ OCR API Response:", error.response.data);
    }
    throw error;
  }
};

module.exports = { parseReceipt };
