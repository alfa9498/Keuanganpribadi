import React from "react";
import { Tag } from "lucide-react";
import { BaseFilterDropdown } from "./BaseFilterDropdown";

export const CategoryFilter = ({ currentCategory, onCategoryChange }) => {
  const expenseCategoriesList = {
    Makanan: ["Makanan", "Makan & Minum", "Sarapan", "Jajan Harian"],
    Transportasi: ["Transportasi", "Bensin", "Parkir", "Ojol / Taksi Online"],
    Tagihan: ["Tagihan", "Listrik", "Internet", "Pulsa", "Air", "Biaya Admin"],
    Belanja: ["Belanja", "Shopping", "shopee", "Laundry"],
    Hiburan: ["Hiburan", "Nongkrong", "Jalan-jalan"],
    Kesehatan: ["Kesehatan", "Berobat", "Obat", "BPJS / Asuransi"],
    Pendidikan: ["Pendidikan", "Sekolah", "Kursus", "Buku / Alat Tulis"],
    "Orang Tua": ["Orang Tua", "Listrik Orang Tua", "Pulsa Orang Tua"],
    Hadiah: ["Hadiah", "Acara", "Nikahan"],
    Keuangan: [
      "Keuangan",
      "Tabungan",
      "Investasi",
      "Hutang",
      "Piutang",
      "Tarik Tunai",
      "Cicilan / Hutang",
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

  const groups = [
    {
      label: "Pemasukan",
      options: incomeCategories.map((cat) => ({ label: cat, value: cat })),
    },
    {
      label: "Pengeluaran",
      options: Object.keys(expenseCategoriesList).map((cat) => ({
        label: cat,
        value: cat,
      })),
    },
  ];

  return (
    <BaseFilterDropdown
      value={currentCategory}
      onChange={onCategoryChange}
      groups={groups}
      placeholder="Semua Kategori"
      icon={Tag}
    />
  );
};
