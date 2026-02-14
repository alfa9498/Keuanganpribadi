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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-inter transition-all duration-300">
      <div className="flex h-screen overflow-hidden">
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

        {/* Content Area */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {/* Header */}
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

          {/* Main Content */}
          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
