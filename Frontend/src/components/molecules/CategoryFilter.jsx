import React from "react";
import { Tag } from "lucide-react";
import { BaseFilterDropdown } from "./BaseFilterDropdown";

export const CategoryFilter = ({ currentCategory, onCategoryChange, categories = { expense: [], income: [] } }) => {
  const groups = [
    {
      label: "Pemasukan",
      options: categories.income.map((cat) => ({ label: cat.name, value: cat.name })),
    },
    {
      label: "Pengeluaran",
      options: categories.expense.map((group) => ({
        label: group.name,
        value: group.name,
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
