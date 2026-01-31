import React from "react";
import { Tag, X } from "lucide-react";

export const CategoryFilter = ({ currentCategory, onCategoryChange }) => {
  // Categories should ideally come from a shared config, but for now we match TransactionForm
  const expenseCategories = {
    Makanan: ["Makanan", "Makan & Minum", "Sarapan", "Jajan Harian"],
    Transportasi: [
      "Transportasi",
      "Transport Harian",
      "Bensin",
      "Parkir",
      "Ojol / Taksi Online",
      "pengeluaran Pulang",
    ],
    Tagihan: [
      "Tagihan",
      "Listrik",
      "Internet",
      "Pulsa",
      "Air",
      "Tagihan Internet",
      "Biaya Admin",
    ],
    Belanja: [
      "Belanja",
      "Belanja Bulanan",
      "Shopping",
      "shopee",
      "Laundry",
      "Marketplace (Shopee, dll)",
    ],
    Hiburan: ["Hiburan", "Nongkrong", "Jalan-jalan"],
    Kesehatan: ["Kesehatan", "Berobat", "Obat", "BPJS / Asuransi"],
    Pendidikan: ["Pendidikan", "Sekolah", "Kursus", "Buku / Alat Tulis"],
    "Orang Tua": [
      "Orang Tua",
      "Orang tua aa",
      "Orang tua neng",
      "Listrik Orang Tua",
      "Pulsa Orang Tua",
    ],
    Hadiah: ["Hadiah", "Hadiah / Acara", "Acara", "Ulang Tahun", "Nikahan"],
    Keuangan: [
      "Keuangan",
      "Tabungan",
      "Investasi",
      "Hutang",
      "Piutang",
      "Tarik Tunai",
      "Cicilan / Hutang",
      "Tabungan anak",
      "Tabung Kita",
    ],
    Sewa: ["Sewa", "mobil", "motor", "kontrakan", "kosan"],
    Lainnya: ["Lainnya"],
  };

  const incomeCategories = [
    "Gaji",
    "Bonus",
    "Hadiah",
    "Penjualan",
    "Investasi",
    "Bunga Bank",
    "Saldo Awal",
    "Piutang",
    "Hutang",
    "Lainnya",
  ];

  const allCategories = [
    ...Object.values(expenseCategories).flat(),
    ...incomeCategories,
  ];

  // Remove duplicates
  const uniqueCategories = [...new Set(allCategories)].sort();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative group w-full">
        <select
          value={currentCategory || ""}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="appearance-none bg-white text-slate-700 text-sm font-bold py-2.5 pl-10 pr-10 rounded-2xl border border-slate-200 hover:border-finance-primary/50 focus:outline-none focus:ring-4 focus:ring-finance-primary/10 transition-all cursor-pointer w-full md:min-w-[160px] shadow-sm hover:shadow-md"
        >
          <option value="">Semua Kategori</option>
          <optgroup
            label="Pemasukan"
            className="bg-slate-50 text-emerald-600 font-bold py-2 uppercase tracking-tighter text-[10px]"
          >
            {incomeCategories.map((cat) => (
              <option
                key={`in-${cat}`}
                value={cat}
                className="text-slate-700 font-medium"
              >
                {cat}
              </option>
            ))}
          </optgroup>

          <optgroup
            label="Pengeluaran"
            className="bg-slate-50 text-amber-600 font-bold py-2 uppercase tracking-tighter text-[10px]"
          >
            {Object.keys(expenseCategories).map((group) => (
              <option
                key={`ex-${group}`}
                value={group}
                className="text-slate-700 font-medium"
              >
                {group}
              </option>
            ))}
          </optgroup>
        </select>
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-finance-primary transition-colors">
          <Tag size={16} />
        </div>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-hover:text-slate-500 transition-colors">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
};
