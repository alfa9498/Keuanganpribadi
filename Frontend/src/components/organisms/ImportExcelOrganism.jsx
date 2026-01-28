import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { FileUp, Table, Check, AlertCircle, Loader2, FileText, ClipboardList, Image as ImageIcon } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import * as pdfjs from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { API_URL } from '../../config/api';

// Set up worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export const ImportExcelOrganism = ({ user, onImportSuccess }) => {
    const formatDateForInput = (dateInput) => {
        if (!dateInput) return '';
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const ACCOUNTS = ['Main', 'BCA', 'BNI', 'BSI', 'Muamalat', 'Permata', 'Mandiri', 'BRI', 'Gopay', 'OVO', 'Dana', 'Bareksa', 'Treasury', 'Cash', 'Jago', 'SeaBank', 'ShopeePay', 'LinkAja', 'Flip'];
    const BANK_ALIASES = {
        'BANK CENTRAL ASIA': 'BCA',
        'BANK BCA': 'BCA',
        'BANK NEGARA INDONESIA': 'BNI',
        'BANK BNI': 'BNI',
        'BANK SYARIAH INDONESIA': 'BSI',
        'BANK BSI': 'BSI',
        'BANK RAKYAT INDONESIA': 'BRI',
        'BANK BRI': 'BRI',
        'BANK MANDIRI': 'Mandiri',
        'BANK PERMATA': 'Permata',
        'BANK PERMATA-ME': 'Permata',
        'BANK MUAMALAT': 'Muamalat',
        'BANK JAGO': 'Jago',
        'SEABANK': 'SeaBank'
    };

    const PERSONAL_NAMES = ['HARUN USMAN', 'NUNUNG STIAWATI'];

    const { showNotification } = useNotification();
    const [previewData, setPreviewData] = useState([]);
    const [existingTransactions, setExistingTransactions] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [importTargetAccount, setImportTargetAccount] = useState('Main');
    const [isLoading, setIsLoading] = useState(false);
    const [fileName, setFileName] = useState('');
    const [showRawPaste, setShowRawPaste] = useState(false);
    const [rawText, setRawText] = useState('');
    const [ocrProgress, setOcrProgress] = useState(0);

    useEffect(() => {
        if (user?.id) {
            fetch(`${API_URL}/transaction?user_id=${user.id}`)
                .then(res => res.json())
                .then(result => {
                    if (result.success) setExistingTransactions(result.data);
                })
                .catch(err => console.error("Error fetching existing tx:", err));
        }
    }, [user]);

    const parseExcelDate = (val) => {
        if (!val) return formatDateForInput(new Date());

        // Serial number from Excel
        if (typeof val === 'number') {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000));
            return formatDateForInput(date);
        }

        // String like DD/MM/YYYY or DD-MM-YYYY
        if (typeof val === 'string') {
            const cleaned = val.trim().replace(/\//g, '-');
            const parts = cleaned.split('-');
            if (parts.length === 3) {
                // Determine if it's DD-MM-YYYY or YYYY-MM-DD
                if (parts[0].length === 4) return cleaned; // YYYY-MM-DD
                const d = parts[0].padStart(2, '0');
                const m = parts[1].padStart(2, '0');
                const y = parts[2];
                // Handle 2-digit years
                const fullY = y.length === 2 ? `20${y}` : y;
                return `${fullY}-${m}-${d}`;
            }
        }

        return val;
    };

    const sanitizeAmount = (val) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            // Fix OCR common misreadings: O->0, I->1, l->1, S->5, B->8
            let cleaned = val.toUpperCase().trim()
                .replace(/O/g, '0')
                .replace(/[Il]/g, '1')
                .replace(/S/g, '5')
                .replace(/B/g, '8');

            // Remove Rp, spaces, and other non-numeric chars except . and , and - and +
            cleaned = cleaned.replace(/[^\d.,\-+]/g, '');
            if (!cleaned) return 0;

            // Intelligent separator detection
            if (cleaned.includes('.') && cleaned.includes(',')) {
                // Both exist. The one that appears last or is at the correct position is the decimal.
                const lastDot = cleaned.lastIndexOf('.');
                const lastComma = cleaned.lastIndexOf(',');

                if (lastDot > lastComma) {
                    // Dot is decimal (US Style: 1,500.00)
                    cleaned = cleaned.replace(/,/g, '');
                } else {
                    // Comma is decimal (ID Style: 1.500,00)
                    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
                }
            } else if (cleaned.includes(',')) {
                const parts = cleaned.split(',');
                // If last part is length 3, comma is likely a thousand separator
                if (parts[parts.length - 1].length === 3 || parts.length > 2) {
                    cleaned = cleaned.replace(/,/g, '');
                } else {
                    cleaned = cleaned.replace(',', '.');
                }
            } else if (cleaned.includes('.')) {
                const parts = cleaned.split('.');
                // If last part is length 3, dot is likely a thousand separator
                if (parts[parts.length - 1].length === 3 || parts.length > 2) {
                    cleaned = cleaned.replace(/\./g, '');
                }
            }

            const result = parseFloat(cleaned);
            return isNaN(result) ? 0 : result;
        }
        return 0;
    };

    const AUTO_CATEGORY_MAP = {
        'GO-PAY': 'Transportasi',
        'GOPAY': 'Transportasi',
        'GRAB': 'Transportasi',
        'OVO': 'Transportasi',
        'KRL': 'Transportasi',
        'BENSIN': 'Transportasi',
        'PERTAMINA': 'Transportasi',
        'SHELL': 'Transportasi',
        'VIVO': 'Transportasi',
        'SHOPEE': 'Belanja',
        'TOKOPEDIA': 'Belanja',
        'BLIBLI': 'Belanja',
        'LAZADA': 'Belanja',
        'TIKTOK': 'Belanja',
        'ALFAMART': 'Makanan',
        'INDOMARET': 'Makanan',
        'FOOD': 'Makanan',
        'WARUNG': 'Makanan',
        'RESTORAN': 'Makanan',
        'CAFE': 'Makanan',
        'KOPI': 'Makanan',
        'MCD': 'Makanan',
        'KFC': 'Makanan',
        'PLN': 'Tagihan',
        'LISTRIK': 'Tagihan',
        'INTERNET': 'Tagihan',
        'TELKOM': 'Tagihan',
        'PULSA': 'Tagihan',
        'BPJS': 'Kesehatan',
        'APOTEK': 'Kesehatan',
        'RUMAH SAKIT': 'Kesehatan',
        'DR.': 'Kesehatan',
        'KURSUS': 'Pendidikan',
        'SEKOLAH': 'Pendidikan',
        'BUKU': 'Pendidikan',
        'INVESTASI': 'Keuangan',
        'PROFIT': 'Keuangan',
        'DIVIDEN': 'Keuangan',
        'SALDO AWAL': 'Saldo Awal',
        'TRANSFER DARI': 'income', // Special marker
        'GAJI': 'Gaji',
        'BONUS': 'Bonus',
        'FLIP': 'transfer',
        'PLP': 'transfer',
        'BI-FAST': 'transfer',
        'OY!': 'transfer',
        'TELKOMSEL': 'Tagihan',
        'XL': 'Tagihan',
        'INDOSAT': 'Tagihan',
        'ADMIN': 'Biaya Admin',
        'BIAYA': 'Biaya Admin',
        'BUNGA': 'Bunga Bank',
        'PAJAK': 'Pajak / Biaya'
    };

    const detectCategory = (description) => {
        if (!description) return { name: 'Lainnya', auto: false, isTransfer: false };
        const upperDesc = description.toUpperCase();

        // 1. Expand search using Bank Aliases
        let matchedBank = null;
        for (const [alias, realName] of Object.entries(BANK_ALIASES)) {
            if (upperDesc.includes(alias)) {
                matchedBank = realName;
                break;
            }
        }

        // 2. Find target account from the list
        const otherAccount = matchedBank || ACCOUNTS.find(acc =>
            acc.toUpperCase() !== importTargetAccount.toUpperCase() &&
            upperDesc.includes(acc.toUpperCase())
        );

        // High-confidence internal transfer keywords
        const internalKeywords = ['FLIP', 'PLP', 'BI-FAST', 'OY!', 'BIF', 'TRF BIFAST'];
        const isInternalKW = internalKeywords.some(kw => upperDesc.includes(kw));

        // 3. Type Suggestion based on keywords (Super important for ambiguous statements)
        let typeSuggestion = null;
        const isOutgoing = upperDesc.includes(' KE ') || upperDesc.includes(' KE:') || upperDesc.includes(' TO ') || upperDesc.includes(' PAYMENT ') || upperDesc.includes(' PEMBAYARAN ') || upperDesc.includes(' QRIS ');
        const isIncoming = upperDesc.includes(' DARI ') || upperDesc.includes(' DARI:') || upperDesc.includes(' FROM ') || upperDesc.includes(' MASUK ') || upperDesc.includes(' BUNGA ') || upperDesc.includes(' KREDITUR ') || upperDesc.includes(' PB DARI ') || upperDesc.includes(' SALDO AWAL ');

        if (isIncoming) {
            typeSuggestion = 'income';
        } else if (isOutgoing) {
            typeSuggestion = 'expense';
        }

        // 4. Determine if it's REALLY an internal move
        let isTransfer = false;
        if (otherAccount) {
            const isTransferContext = upperDesc.includes('TRF') || upperDesc.includes('TF') || upperDesc.includes('TRANSFER') || upperDesc.includes('TRSF') || upperDesc.includes('PB DARI');
            const myName = (user?.full_name?.toUpperCase()) || '';
            const hasMyName = (myName && upperDesc.includes(myName)) || PERSONAL_NAMES.some(n => upperDesc.includes(n));

            // If it's a transfer context and a known account or user name is involved, it's likely internal
            if (isTransferContext || hasMyName || !isOutgoing) {
                isTransfer = true;
            }
        } else if (isInternalKW && !upperDesc.includes('QRIS') && !upperDesc.includes('-')) {
            isTransfer = true;
        }

        // 5. Category Map
        for (const [key, cat] of Object.entries(AUTO_CATEGORY_MAP)) {
            if (upperDesc.includes(key)) {
                return {
                    name: cat === 'income' ? 'Lainnya' : (cat === 'transfer' ? 'Transfer' : cat),
                    auto: true,
                    isTransfer,
                    toAccount: otherAccount || '',
                    typeSuggestion
                };
            }
        }

        const genericKeywords = ['TRSF', 'TRANSFER', 'TF KE', 'TF DARI', 'QRIS', 'PAYMENT', 'TRF'];
        const isGeneric = genericKeywords.some(kw => upperDesc.includes(kw));

        if (isGeneric || isTransfer) {
            return { name: 'Transfer', auto: true, isTransfer, toAccount: otherAccount || '', typeSuggestion };
        }

        return { name: 'Lainnya', auto: false, isTransfer: false, typeSuggestion };
    };

    const isDuplicate = (date, amount) => {
        return existingTransactions.some(tx => {
            const txDate = formatDateForInput(tx.date);
            return txDate === date && Math.abs(parseFloat(tx.amount)) === Math.abs(parseFloat(amount));
        });
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.name.toLowerCase().endsWith('.pdf')) {
            handlePdfUpload(file);
        } else if (file.type.startsWith('image/')) {
            handleImageUpload(file);
        } else {
            handleFileUpload(file);
        }
    };

    const handleImageUpload = async (file) => {
        setFileName(file.name);
        setIsLoading(true);
        setOcrProgress(0);
        showNotification("Mulai memindai gambar... Mohon tunggu sebentar.", "info");

        let worker = null;
        try {
            worker = await Tesseract.createWorker({
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setOcrProgress(Math.round(m.progress * 100));
                    }
                }
            });

            await worker.loadLanguage('ind+eng');
            await worker.initialize('ind+eng');

            const { data: { text } } = await worker.recognize(file);

            if (!text || text.trim().length === 0) {
                throw new Error("Tidak ada tulisan yang terdeteksi di gambar.");
            }

            processRawText(text);
        } catch (error) {
            console.error("OCR Error Detailed:", error);
            const msg = error.message?.includes("network")
                ? "Gagal mengunduh data OCR (Internet lambat). Silakan coba lagi atau gunakan Tempel Teks."
                : `Gagal membaca gambar: ${error.message || "Pastikan gambar cukup terang dan jelas."}`;
            showNotification(msg, "error");
            setShowRawPaste(true);
        } finally {
            if (worker) await worker.terminate();
            setIsLoading(false);
            setOcrProgress(0);
        }
    };

    const handlePdfUpload = async (file) => {
        setFileName(file.name);
        setIsLoading(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjs.getDocument(arrayBuffer).promise;
            let fullText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(" ");
                fullText += pageText + "\n";
            }

            processRawText(fullText);
        } catch (error) {
            console.error("PDF Parsing Error:", error);
            if (error.name === 'PasswordException') {
                showNotification("PDF diproteksi password! Sistem tidak bisa membukanya langsung. Silakan gunakan cara 'Tempel Teks Manual' di bawah.", "warning");
                setShowRawPaste(true);
            } else {
                showNotification("Gagal membaca file PDF. Silakan coba mode Tempel Teks.", "error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const processRawText = (text) => {
        try {
            setRawText(text); // Save raw text to textarea for user review
            const newSelectedIds = new Set();
            const results = [];
            const cleanText = text.replace(/[\r\n]+/g, '   ').replace(/[ ]{2,}/g, '   ');

            // Regex patterns for common Indonesian Bank PDFs
            const months = {
                JAN: '01', FEB: '02', MAR: '03', APR: '04', MEI: '05', MAY: '05', JUN: '06',
                JUL: '07', AGU: '08', AUG: '08', SEP: '09', OKT: '10', OCT: '10', NOV: '11', DES: '12', DEC: '12',
                AGS: '08', MEY: '05', AUGUST: '08',
                JANUARI: '01', FEBRUARI: '02', MARET: '03', APRIL: '04', JUNI: '06', JULI: '07', AGUSTUS: '08', SEPTEMBER: '09', OKTOBER: '10', NOVEMBER: '11', DESEMBER: '12'
            };
            const year = new Date().getFullYear();

            // BNI: 15-SEP-2024 (newline) KETERANGAN (newline) 1,000,000.00 (newline) Cr
            // Sign variations handled: Cr, CR, C1, Dr, DR, D8, O1
            const bniPattern = /(\d{1,2})[-\/]([A-Z,a-z]{3})[-\/](\d{2,4})?\s+([\d: ]{5,8}?)?\s*(.+?)\s+([\d,.]+)\s+([CDO][rR18])/gi;

            // BCA: 20/07 (newline) KETERANGAN (newline) CR (newline) 1,000,000.00
            // Sign variations handled: DB, D8, CR, C1, O1
            const bcaPattern = /(\d{1,2}[\/\d]{3,5})\s+([A-Z0-9.\/ ]{3,})?\s*([CDO][BR18])\s+([\d,.]+)/gi;

            // Generic fallback: Date Desc Amount
            const genericPattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\s+(.+?)\s+(-?[\d,.]+)/g;

            let match;
            let index = 0;

            const selectedAccUpper = importTargetAccount?.toUpperCase() || '';
            const isBSITarget = selectedAccUpper.includes('BSI');
            const isBCATarget = selectedAccUpper.includes('BCA');
            const isBNITarget = selectedAccUpper.includes('BNI');
            const isPermataTarget = selectedAccUpper.includes('PERMATA');

            // Determine if we should force a specific source tag for all matches
            let forcedSource = null;
            if (isBSITarget) forcedSource = 'BSI';
            else if (isBCATarget) forcedSource = 'BCA';
            else if (isBNITarget) forcedSource = 'BNI';
            else if (isPermataTarget) forcedSource = 'Permata';

            // 1. Specialized BSI Pattern - Run if BSI target or exploring
            if (isBSITarget || (!isBCATarget && !isBNITarget && !isPermataTarget)) {
                const bsiPattern = /(\d{1,2})\s+([A-Z,a-z]{3,})\s+(\d{4})\s*[ \d:]{0,10}?\s*(.+?)\s+(Dana Keluar|Dana Masuk|Biaya)\s*[|]?\s*(.+?)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)/gi;
                while ((match = bsiPattern.exec(cleanText)) !== null) {
                    const [_, day, monStr, yr, prefixDesc, dir, desc, debStr, creStr, balStr] = match;
                    const month = months[monStr.toUpperCase()] || '01';
                    const date = `${yr}-${month}-${day.padStart(2, '0')}`;
                    const debit = sanitizeAmount(debStr);
                    const credit = sanitizeAmount(creStr);
                    const amount = (dir.includes('Masuk') || credit > 0) ? credit : debit;
                    const type = (dir.includes('Masuk') || credit > 0) ? 'income' : 'expense';
                    const fullDesc = `${prefixDesc.trim()} ${desc.trim()}`.replace(/\s+/g, ' ');
                    results.push(createMappedItem(index++, date, fullDesc, amount, type, forcedSource || 'BSI'));
                }
            }

            // 2. BNI Specialized
            if (isBNITarget || (!isBSITarget && !isBCATarget && !isPermataTarget)) {
                const bniPatternLocal = /(\d{1,2})[-\/]([A-Z,a-z]{3})[-\/](\d{2,4})?\s+([\d: ]{5,8}?)?\s*(.+?)\s+([\d,.]+)\s+([CDO][rR18])/gi;
                while ((match = bniPatternLocal.exec(cleanText)) !== null) {
                    const [_, day, monStr, yrPart, time, desc, amtStr, sign] = match;
                    const month = months[monStr.toUpperCase()] || '01';
                    const yr = yrPart ? (yrPart.length === 2 ? `20${yrPart}` : yrPart) : year;
                    const date = `${yr}-${month}-${day.padStart(2, '0')}`;
                    const amount = sanitizeAmount(amtStr);
                    const signUpper = sign.toUpperCase();
                    const type = (signUpper.startsWith('C') || signUpper === 'O1') ? 'income' : 'expense';
                    const result = createMappedItem(index++, date, desc.trim(), amount, type, forcedSource || 'BNI');
                    if (result) results.push(result);
                }
            }

            // 3. Permata Bank
            if (isPermataTarget || (!isBSITarget && !isBCATarget && !isBNITarget)) {
                const permataPatternLocal = /(\d{1,2})\s+([A-Z,a-z]{3,})\s+(\d{4})\s+(.+?)\s+Rp\s+([\d,.]+)/gi;
                while ((match = permataPatternLocal.exec(cleanText)) !== null) {
                    const [_, day, monStr, yr, desc, amtStr] = match;
                    const date = `${yr}-${months[monStr.toUpperCase()] || '01'}-${day.padStart(2, '0')}`;
                    const amount = sanitizeAmount(amtStr);
                    const descUpper = desc.trim().toUpperCase();
                    let type = 'expense';
                    if (descUpper.includes('MASUK') || descUpper.includes('DARI') || descUpper.includes('BUNGA') || descUpper.includes('PB DARI') || descUpper.includes('KREDITUR')) {
                        type = 'income';
                    }
                    results.push(createMappedItem(index++, date, desc.trim(), amount, type, forcedSource || 'Permata'));
                }
            }

            // 4. BCA Specialized Patterns
            if (isBCATarget || (!isBSITarget && !isBNITarget && !isPermataTarget)) {
                const bcaMobilePatternLocal = /(\d{1,2}\/\d{1,2})\s+(.+?)\s+([\d,.]+)\s+(DB|CR)/gi;
                while ((match = bcaMobilePatternLocal.exec(cleanText)) !== null) {
                    const [_, dateStr, desc, amtStr, sign] = match;
                    const [dPart, mPart] = dateStr.split('/');
                    const date = `${year}-${mPart.padStart(2, '0')}-${dPart.padStart(2, '0')}`;
                    const amount = sanitizeAmount(amtStr);
                    const type = sign.toUpperCase() === 'CR' ? 'income' : 'expense';
                    results.push(createMappedItem(index++, date, desc.trim(), amount, type, forcedSource || 'BCA'));
                }

                const bcaPatternLocal = /(\d{1,2}[\/\d]{3,5})\s+([A-Z0-9.\/ ]{3,})?\s*([CDO][BR18])\s+([\d,.]+)/gi;
                while ((match = bcaPatternLocal.exec(cleanText)) !== null) {
                    const [_, dateStr, desc, sign, amtStr] = match;
                    const dPart = dateStr.includes('/') ? dateStr.split('/')[0] : dateStr.match(/^\d{1,2}/)[0];
                    const mPart = dateStr.includes('/') ? dateStr.split('/')[1] : dateStr.match(/\d{1,2}$/)[0];
                    const date = `${year}-${mPart.padStart(2, '0')}-${dPart.padStart(2, '0')}`;
                    const amount = sanitizeAmount(amtStr);
                    const signUpper = sign.toUpperCase();
                    const type = (signUpper.startsWith('C') || signUpper === 'O1') ? 'income' : 'expense';
                    results.push(createMappedItem(index++, date, (desc || 'Transaksi BCA').trim(), amount, type, forcedSource || 'BCA'));
                }
            }

            // 5. Mobile App Fallback (General)
            const appPatternLocal = /(\d{1,2})\s+([A-Z,a-z]{3})\s+(\d{4})(?:\s+[\d: ]{5,10}(?:\s+WIB)?)?\s+(.+?)\s+([+-]?[\d,.]+)\s+[\d,.]+/gi;
            while ((match = appPatternLocal.exec(cleanText)) !== null) {
                const [_, day, monStr, yr, desc, amtStr] = match;
                const date = `${yr}-${months[monStr.toUpperCase()] || '01'}-${day.padStart(2, '0')}`;
                const amtRaw = sanitizeAmount(amtStr);
                const amount = Math.abs(amtRaw);
                const type = amtRaw < 0 ? 'expense' : 'income';
                results.push(createMappedItem(index++, date, desc.trim(), amount, type, forcedSource || 'Mobile App'));
            }

            // 6. Generic last resort
            const genericPatternLocal = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\s+(.+?)\s+(-?[\d,.]+)/g;
            while ((match = genericPatternLocal.exec(cleanText)) !== null) {
                const [_, dateRaw, desc, amtRaw] = match;
                const date = parseExcelDate(dateRaw);
                const amt = sanitizeAmount(amtRaw);
                const type = amt < 0 ? 'expense' : 'income';
                results.push(createMappedItem(index++, date, desc, Math.abs(amt), type, forcedSource || 'General'));
            }

            // Try Generic pattern
            while ((match = genericPattern.exec(cleanText)) !== null) {
                const [_, dateRaw, desc, amtRaw] = match;
                const date = parseExcelDate(dateRaw);
                const amt = sanitizeAmount(amtRaw);
                const type = amt < 0 ? 'expense' : 'income';

                results.push(createMappedItem(index++, date, desc, Math.abs(amt), type));
            }

            const finalResults = results.filter(r => r !== null && r.amount > 0);

            // Minimal deduplication: only if EVERYTHING is exactly the same (including ID)
            // But we keep them separate if they came from different matches to be safe.
            const seen = new Set();
            const uniqueResults = [];

            finalResults.forEach(r => {
                const key = `${r.date}-${r.amount}-${r.description}-${r.type}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueResults.push(r);
                } else if (r.description.includes('Transaksi BCA') || r.description.includes('Mutasi')) {
                    // If it's a very generic description, allow duplicates 
                    uniqueResults.push(r);
                }
            });

            uniqueResults.forEach(item => {
                if (!item.isDuplicate) newSelectedIds.add(item.id);
            });

            setPreviewData(uniqueResults);
            setSelectedIds(newSelectedIds);
            if (uniqueResults.length > 0) {
                showNotification(`Berhasil mendeteksi ${uniqueResults.length} transaksi dari teks!`, 'success');
            } else {
                showNotification("Tidak ada transaksi yang terdeteksi. Silakan periksa hasil scan teks di bawah.", "warning");
                setShowRawPaste(true);
            }
        } catch (error) {
            console.error("Process Text Error:", error);
            showNotification("Terjadi kesalahan saat mengolah teks. Silakan periksa formatnya.", "error");
        }
    };

    const createMappedItem = (index, date, description, amount, type, source) => {
        if (!date || amount === 0) return null;

        const detected = detectCategory(description);
        let finalType = type;
        let toAccount = '';

        // Override type if we have a strong suggestion from keywords (useful for Permata/BSI)
        if (detected.typeSuggestion && (type === 'expense' || type === 'income')) {
            finalType = detected.typeSuggestion;
        }

        if (detected.isTransfer) {
            finalType = 'transfer';
            toAccount = detected.toAccount || '';
        }

        const duplicateRow = isDuplicate(date, amount);
        const itemId = `row-pdf-${index}`;

        return {
            id: itemId,
            date: date,
            type: finalType,
            category: detected.name,
            isAuto: detected.auto,
            isDuplicate: duplicateRow,
            amount: amount,
            description: description,
            payment_method: finalType === 'transfer' ? 'Internal / Balance' : 'Transfer',
            account: importTargetAccount,
            to_account: toAccount,
            status: 'done',
            source: source || 'Manual'
        };
    };

    const handleFileUpload = (file) => {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary', cellDates: false });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];

            // Try to find the header row by looking for keywords
            const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
            let headerRowIndex = 0;
            const headerKeywords = ['tanggal', 'date', 'keterangan', 'description', 'mutasi', 'amount', 'db', 'cr'];

            for (let i = 0; i < Math.min(rawData.length, 15); i++) {
                const row = rawData[i];
                if (row && row.some(cell => cell && headerKeywords.some(kw => cell.toString().toLowerCase().includes(kw)))) {
                    headerRowIndex = i;
                    break;
                }
            }

            // Refetch with proper header
            const data = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex, defval: "" });
            const newSelectedIds = new Set();

            const mappedData = data.map((row, index) => {
                const getVal = (possibleKeys) => {
                    const rowKeys = Object.keys(row);
                    for (const pKey of possibleKeys) {
                        const match = rowKeys.find(rk => rk.trim().toLowerCase() === pKey.toLowerCase());
                        if (match) return row[match];
                    }
                    return null;
                };

                const rawDate = getVal(['Date', 'Tanggal', 'Tgl']);
                const date = parseExcelDate(rawDate);
                const rawDesc = getVal(['Description', 'Keterangan', 'Uraian', 'Notes']) || '';

                // Identify amount and type (Income/Expense)
                let amount = 0;
                let type = 'expense';

                // Try "Mutasi" format (BCA style: DB/CR in different columns or signs)
                const rawMutasi = getVal(['Mutasi', 'Amount', 'Jumlah', 'Nominal']);
                const rawDb = getVal(['DB', 'Debet', 'Keluar', 'Pengeluaran']);
                const rawCr = getVal(['CR', 'Kredit', 'Masuk', 'Pemasukan']);

                if (rawDb && sanitizeAmount(rawDb) > 0) {
                    amount = sanitizeAmount(rawDb);
                    type = 'expense';
                } else if (rawCr && sanitizeAmount(rawCr) > 0) {
                    amount = sanitizeAmount(rawCr);
                    type = 'income';
                } else if (rawMutasi) {
                    const amt = sanitizeAmount(rawMutasi);
                    amount = Math.abs(amt);
                    // Check if there's a sign column or if it's already negative
                    const sign = getVal(['D/C', 'Sign', 'Type']);
                    if (sign && sign.toString().toUpperCase() === 'CR') type = 'income';
                    else if (sign && sign.toString().toUpperCase() === 'DB') type = 'expense';
                    else if (amt < 0) type = 'expense';
                    else if (rawDesc.toUpperCase().includes('CR')) type = 'income'; // Fallback
                    else type = 'expense';
                }

                // Detect logic
                const detected = detectCategory(rawDesc);
                const explicitCategory = getVal(['Category', 'Kategori']);
                const finalAccount = getVal(['Account', 'Akun']) || importTargetAccount;

                let finalType = type;
                let toAccount = '';

                if (detected.isTransfer) {
                    finalType = 'transfer';
                    toAccount = detected.toAccount || '';
                }

                const duplicateRow = isDuplicate(date, amount);
                const itemId = `row-${index}`;

                // Auto-select if NOT duplicate
                if (!duplicateRow && amount > 0) newSelectedIds.add(itemId);

                return {
                    id: itemId,
                    date: date,
                    type: finalType,
                    category: explicitCategory || detected.name,
                    isAuto: !explicitCategory && detected.auto,
                    isDuplicate: duplicateRow,
                    amount: amount,
                    description: rawDesc,
                    payment_method: getVal(['Payment Method', 'Metode Pembayaran']) || (finalType === 'transfer' ? 'Internal / Balance' : (type === 'income' ? 'Transfer' : 'Cash')),
                    account: finalAccount,
                    to_account: toAccount,
                    status: 'done'
                };
            }).filter(item => item.amount > 0); // Ignore empty or zero transactions

            setPreviewData(mappedData);
            setSelectedIds(newSelectedIds);
        };
        reader.readAsBinaryString(file);
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === previewData.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(previewData.map(d => d.id)));
        }
    };

    const updatePreviewItem = (id, key, value) => {
        setPreviewData(prev => prev.map(item =>
            item.id === id ? { ...item, [key]: value } : item
        ));
    };

    const handleImport = async () => {
        const toImport = previewData.filter(item => selectedIds.has(item.id));
        if (toImport.length === 0) {
            showNotification("Pilih setidaknya satu transaksi untuk diimport.", "warning");
            return;
        }

        if (!user?.id) {
            showNotification("Sesi login tidak valid. Silakan login ulang.", "error");
            return;
        }

        setIsLoading(true);
        let successCount = 0;
        let failCount = 0;

        try {
            for (const item of toImport) {
                const payload = { ...item, user_id: user.id };
                delete payload.id;
                delete payload.isAuto;
                delete payload.isDuplicate;

                try {
                    const response = await fetch(`${API_URL}/transaction`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        successCount++;
                    } else {
                        const errData = await response.json();
                        console.error('Row fail:', errData);
                        failCount++;
                    }
                } catch (rowErr) {
                    console.error('Row network error:', rowErr);
                    failCount++;
                }
            }

            if (successCount > 0) {
                showNotification(`Berhasil mengimpor ${successCount} transaksi!${failCount > 0 ? ` (${failCount} gagal)` : ''}`, 'success');
                if (onImportSuccess) onImportSuccess();
                setPreviewData([]);
                setFileName('');
                setSelectedIds(new Set());
            } else {
                showNotification("Gagal mengimpor transaksi. Coba lagi nanti atau hubungi support.", "error");
            }
        } catch (error) {
            console.error('Import process error:', error);
            showNotification('Terjadi gangguan saat proses import.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 space-y-4">
                        <label className="block text-sm font-bold text-slate-700">1. Mau import ke Rekening mana?</label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {ACCOUNTS.map(acc => (
                                <button
                                    key={acc}
                                    onClick={() => setImportTargetAccount(acc)}
                                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${importTargetAccount === acc
                                        ? 'bg-finance-primary text-white border-finance-primary shadow-lg shadow-finance-primary/20'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    {acc}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-px h-20 bg-slate-200 hidden md:block"></div>

                    <div className="flex-1 w-full">
                        <label className="block text-sm font-bold text-slate-700 mb-2">2. Upload File (PDF/Excel)</label>
                        <div className="flex flex-col gap-2">
                            <div
                                className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-white hover:bg-slate-50 transition-colors cursor-pointer group"
                                onClick={() => document.getElementById('excel-upload').click()}
                            >
                                <div className="flex gap-2 mb-2">
                                    <FileUp size={24} className="text-slate-400 group-hover:text-finance-primary transition-colors" />
                                    <FileText size={24} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    <ImageIcon size={24} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                </div>
                                <div className="text-center">
                                    <span className="text-xs font-semibold text-slate-500 block">{fileName || 'Klik untuk upload PDF, Foto, atau Excel'}</span>
                                    {isLoading && ocrProgress > 0 && (
                                        <div className="mt-2 w-48 bg-slate-100 rounded-full h-1.5 overflow-hidden mx-auto">
                                            <div
                                                className="bg-emerald-500 h-full transition-all duration-300"
                                                style={{ width: `${ocrProgress}%` }}
                                            ></div>
                                        </div>
                                    )}
                                    {isLoading && (
                                        <span className="text-[10px] text-finance-primary font-bold mt-1 block animate-pulse">
                                            {ocrProgress > 0 ? `Memindai: ${ocrProgress}%` : 'Menyiapkan mesin...'}
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    id="excel-upload"
                                    className="hidden"
                                    accept=".pdf, .xlsx, .xls, .csv, image/*"
                                    onChange={handleFileSelect}
                                    disabled={isLoading}
                                />
                            </div>

                            <button
                                onClick={() => setShowRawPaste(!showRawPaste)}
                                className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                <ClipboardList size={14} />
                                {showRawPaste ? 'Tutup Pilihan Tempel' : 'Atau Tempel Teks Manual'}
                            </button>
                        </div>
                    </div>
                </div>

                {showRawPaste && (
                    <div className="mt-6 pt-6 border-t border-slate-200 animate-slide-up">
                        <div className="flex items-center gap-2 mb-3">
                            <h6 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
                                <ClipboardList size={14} /> Tempel Teks Mutasi BNI/BCA
                            </h6>
                            <span className="text-[10px] bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded font-black border border-rose-100 uppercase tracking-tighter">
                                Solusi PDF Password
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-3 italic">Buka PDF-nya, masukkan password, lalu <b>pilih/blok semua teks tabel mutasi</b>, copy, dan tempel di kotak bawah ini.</p>
                        <textarea
                            className="w-full min-h-[250px] p-4 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-finance-primary/20 focus:border-finance-primary outline-none transition-all placeholder:text-slate-300 resize-y"
                            placeholder="Contoh BNI: 15-AUG-2024   TRANSFER DARI...   1.000.000,00   Cr"
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                        />
                        <div className="mt-3 flex justify-end">
                            <Button
                                size="sm"
                                onClick={() => processRawText(rawText)}
                                disabled={!rawText.trim()}
                                className="px-6 text-[10px] font-black uppercase"
                            >
                                Proses teks
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {previewData.length > 0 && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                <Table size={20} className="text-finance-primary" />
                            </div>
                            <div>
                                <h5 className="font-bold text-slate-800 text-sm">
                                    Preview Data ({previewData.length} baris)
                                </h5>
                                <p className="text-xs text-slate-500">{selectedIds.size} terpilih, duplikat dilewati.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={toggleSelectAll} variant="ghost" size="sm" className="text-xs font-bold text-slate-500">
                                {selectedIds.size === previewData.length ? 'Batal Semua' : 'Pilih Semua'}
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={isLoading || selectedIds.size === 0}
                                className="flex items-center gap-2 px-6 shadow-lg shadow-finance-primary/20"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                Import {selectedIds.size} Transaksi
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-[600px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-20">
                                <tr>
                                    <th className="py-3 px-4 w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.size === previewData.length && previewData.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded border-slate-300 text-finance-primary focus:ring-finance-primary"
                                        />
                                    </th>
                                    <th className="py-3 px-4 font-bold uppercase text-[9px] tracking-widest">Tgl</th>
                                    <th className="py-3 px-4 font-bold uppercase text-[9px] tracking-widest">Type</th>
                                    <th className="py-3 px-4 font-bold uppercase text-[9px] tracking-widest">Kategori / Akun Tujuan</th>
                                    <th className="py-3 px-4 font-bold uppercase text-[9px] tracking-widest text-right">Nominal</th>
                                    <th className="py-3 px-4 font-bold uppercase text-[9px] tracking-widest">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {previewData.map(item => (
                                    <tr
                                        key={item.id}
                                        className={`group hover:bg-slate-50/50 transition-colors ${item.isDuplicate ? 'bg-rose-50/20' : ''}`}
                                    >
                                        <td className="py-3 px-4 sticky left-0 bg-inherit z-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(item.id)}
                                                onChange={() => toggleSelect(item.id)}
                                                className="rounded border-slate-300 text-finance-primary focus:ring-finance-primary"
                                            />
                                        </td>
                                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap tabular-nums font-medium">{item.date}</td>
                                        <td className="py-3 px-4">
                                            <Badge variant={item.type === 'income' ? 'success' : item.type === 'transfer' ? 'info' : 'danger'} className="text-[8px] py-0.5 px-1.5 uppercase font-black tracking-tighter">
                                                {item.type}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter ${item.source === 'BCA' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        item.source === 'BNI' || item.source === 'BNI App' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                            item.source === 'BSI' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                item.source === 'Permata' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                                    'bg-slate-50 text-slate-500 border-slate-100'
                                                        }`}>
                                                        {item.source}
                                                    </span>
                                                </div>
                                                {item.type === 'transfer' ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Ke:</span>
                                                        <select
                                                            value={item.to_account}
                                                            onChange={(e) => updatePreviewItem(item.id, 'to_account', e.target.value)}
                                                            className="text-xs font-bold text-indigo-600 bg-indigo-50 border-none rounded py-0.5 px-1.5 focus:ring-1 focus:ring-indigo-300"
                                                        >
                                                            <option value="">Pilih Akun...</option>
                                                            {ACCOUNTS.map(acc => (
                                                                <option key={acc} value={acc}>{acc}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-slate-700 font-bold">{item.category}</span>
                                                        {item.isAuto && <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded font-black uppercase tracking-tighter border border-emerald-100">Auto</span>}
                                                    </div>
                                                )}
                                                {item.isDuplicate && (
                                                    <span className="text-[8px] text-rose-500 font-black uppercase flex items-center gap-1">
                                                        <AlertCircle size={10} /> Duplikat
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className={`py-3 px-4 text-right font-black tabular-nums ${item.type === 'income' ? 'text-emerald-600' : item.type === 'transfer' ? 'text-indigo-600' : 'text-slate-900'}`}>
                                            {item.type === 'expense' ? '-' : '+'}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.amount)}
                                        </td>
                                        <td className="py-3 px-4 text-slate-500 text-[11px] leading-tight max-w-[250px] truncate" title={item.description}>
                                            {item.description}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="bg-blue-50/50 p-4 rounded-xl flex gap-3 items-start border border-blue-100">
                <AlertCircle className="text-blue-500 mt-0.5 flex-shrink-0" size={18} />
                <div className="text-[10px] text-blue-700 leading-relaxed uppercase tracking-wider font-bold">
                    <p className="mb-1">Tips Import Pintar:</p>
                    <p className="text-blue-600/80 normal-case font-medium">Sistem otomatis mendeteksi <b>Flip, BI-FAST,</b> dan transfer antar rekening berdasarkan catatan (description). Jika deteksi salah, Bapak bisa ubah langsung di tabel preview sebelum simpan.</p>
                </div>
            </div>
        </div>
    );
};
