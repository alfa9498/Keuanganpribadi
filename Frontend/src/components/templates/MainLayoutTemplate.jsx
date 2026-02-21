import React, { useState } from "react";
import { SidebarOrganism } from "../organisms/SidebarOrganism";
import { HeaderOrganism } from "../organisms/HeaderOrganism";

export const MainLayoutTemplate = ({
  children,
  user,
  activeTab,
  onTabChange,
  onLogout,
  filterRange,
  setFilterRange,
  filterCategory,
  setFilterCategory,
  filterAccount,
  setFilterAccount,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-inter transition-all duration-300">
      {/* Sidebar */}
      <SidebarOrganism
        activeTab={activeTab}
        onTabChange={onTabChange}
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isMinimized={isSidebarMinimized}
        setIsMinimized={setIsSidebarMinimized}
        onLogout={onLogout}
        user={user}
      />

      {/* Main Container - Strict Flex Column */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Header - Fixed Height, Top Sibling */}
        <div className="flex-none z-30 w-full relative">
          <HeaderOrganism
            user={user}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onLogout={onLogout}
            activeTab={activeTab}
            filterRange={filterRange}
            setFilterRange={setFilterRange}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterAccount={filterAccount}
            setFilterAccount={setFilterAccount}
          />
        </div>

        {/* Scrollable Content Area - Sibling below Header */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative w-full h-full">
          <main className="w-full h-full p-2 md:p-6 lg:p-10 mx-auto max-w-screen-2xl relative block">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
