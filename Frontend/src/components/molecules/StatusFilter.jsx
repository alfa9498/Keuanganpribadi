import React from "react";
import { CheckCircle2 } from "lucide-react";
import { BaseFilterDropdown } from "./BaseFilterDropdown";

export const StatusFilter = ({ currentStatus, onStatusChange }) => {
  const options = [
    { label: "Selesai (Done)", value: "done" },
    { label: "Tertunda (Pending)", value: "pending" },
  ];

  return (
    <BaseFilterDropdown
      value={currentStatus}
      onChange={onStatusChange}
      options={options}
      placeholder="Semua Status"
      icon={CheckCircle2}
    />
  );
};
