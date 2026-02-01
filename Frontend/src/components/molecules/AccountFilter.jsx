import React from "react";
import { Wallet } from "lucide-react";
import { BaseFilterDropdown } from "./BaseFilterDropdown";

export const AccountFilter = ({
  currentAccount,
  onAccountChange,
  accounts = [],
}) => {
  const options = accounts.map((acc) => ({
    label: acc.name,
    value: acc.name,
  }));

  return (
    <BaseFilterDropdown
      value={currentAccount}
      onChange={onAccountChange}
      options={options}
      placeholder="Semua Akun"
      icon={Wallet}
    />
  );
};
