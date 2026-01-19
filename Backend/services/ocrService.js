const Tesseract = require('tesseract.js');

const KEYWORD_MAPPING = {
    'SPBU': 'Transportasi',
    'PERTAMINA': 'Transportasi',
    'SHELL': 'Transportasi',
    'PARKIR': 'Transportasi',
    'POS': 'Transportasi',
    'KELUAR': 'Transportasi',
    'STASIUN': 'Transportasi',
    'MOTOR': 'Transportasi',
    'MOBIL': 'Transportasi',
    'INDOMARET': 'Belanja Bulanan',
    'ALFAMART': 'Belanja Bulanan',
    'SUPERINDO': 'Belanja Bulanan',
    'HYPERMART': 'Belanja Bulanan',
    'TOKOPEDIA': 'Belanja Online',
    'SHOPEE': 'Belanja Online',
    'GOJEK': 'Transportasi',
    'GRAB': 'Transportasi',
    'PLN': 'Tagihan',
    'TELKOM': 'Tagihan',
    'PULSA': 'Tagihan',
    'RESTORAN': 'Makanan',
    'WARUNG': 'Makanan',
    'KAFE': 'Makanan',
    'COFFEE': 'Makanan',
    'STARBUCKS': 'Makanan',
    'MCDONALD': 'Makanan',
    'KFC': 'Makanan',
    'PARKIR': 'Transportasi',
    'STASIUN': 'Transportasi',
    'BIAYA': 'Transportasi',
    'BENSIN': 'Transportasi',
    'PERTALITE': 'Transportasi',
    'PERTAMAX': 'Transportasi'
};

const parseReceipt = async (imageBuffer) => {
    try {
        console.log("Starting OCR processing (eng+ind)...");
        const result = await Tesseract.recognize(imageBuffer, 'eng+ind', {
            logger: m => {
                if (m.status === 'recognizing text' && Math.round(m.progress * 100) % 25 === 0) {
                    console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                }
            }
        });
        
        const rawText = result.data.text;
        console.log("Raw OCR Text:", rawText);

        // 1. Clean and Filter Text
        const lines = rawText.split('\n')
            .map(line => line.trim())
            .filter(line => {
                // Remove very short lines (mostly noise)
                if (line.length < 3) return false;
                // Remove lines that are just symbols/noise
                if (/^[^\w\s]+$/.test(line)) return false;
                return true;
            });

        const cleanText = lines.join('\n').toUpperCase();
        console.log("Cleaned OCR Text:", cleanText);

        // 2. Keyword Matching for Category
        let detectedCategory = 'Lainnya';
        for (const [keyword, category] of Object.entries(KEYWORD_MAPPING)) {
            if (cleanText.includes(keyword)) {
                detectedCategory = category;
                break;
            }
        }

        // 3. Extract Merchant Name (Description)
        // Usually the first 1-2 lines of a receipt are the store name
        let detectedDescription = 'Scan Struk';
        if (lines.length > 0) {
            // Take the first line as merchant name, but avoid total-related keywords
            const firstLine = lines[0].replace(/[`*_|]/g, '').trim();
            const totalKeywords = ['TOTAL', 'JUMLAH', 'BAYAR', 'BIAYA', 'PONDOK', 'STASIUN'];
            const isTotalLine = totalKeywords.some(k => firstLine.toUpperCase().includes(k));
            
            if (!isTotalLine && firstLine.length > 3) {
                detectedDescription = firstLine;
            }
        }

        // 4. Extract Amount
        let detectedAmount = 0;
        const amountRegex = /(?:RP\.?\s?)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/i;

        for (const line of lines) {
            const cleanLine = line.toUpperCase().replace(/\s/g, '');
            if (cleanLine.includes('TOTAL') || cleanLine.includes('JUMLAH') || cleanLine.includes('BAYAR') || cleanLine.includes('BIAYA') || cleanLine.includes('NETTO')) {
                const match = line.match(amountRegex);
                if (match) {
                    const cleanNum = parseInt(match[1].replace(/[.,]/g, ''));
                    if (!isNaN(cleanNum) && cleanNum > 0) {
                         detectedAmount = cleanNum;
                         break;
                    }
                }
            }
        }

        // Fallback: Search for any amount-like number near keywords if total not found
        if (detectedAmount === 0) {
            console.log("Trying fallback amount detection...");
            for (const line of lines) {
                const match = line.match(amountRegex);
                if (match) {
                    const cleanNum = parseInt(match[1].replace(/[.,]/g, ''));
                    if (!isNaN(cleanNum) && cleanNum > 500 && cleanNum < 10000000) {
                        detectedAmount = cleanNum;
                    }
                }
            }
        }
        
        return {
            category: detectedCategory,
            amount: detectedAmount,
            description: detectedDescription,
            text: cleanText
        };

    } catch (error) {
        console.error("OCR Error:", error);
        throw error;
    }
};

module.exports = { parseReceipt };
