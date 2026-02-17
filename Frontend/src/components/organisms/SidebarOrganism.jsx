import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Receipt,
  LineChart,
  LogOut,
  Menu,
  User,
  Settings,
  CreditCard,
  ChevronLeft,
  Target,
  Send,
  Tag,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "../atoms/ThemeToggle";

// Sidebar Item Component
// Sidebar Item Component
// Sidebar Item Component
const SidebarItem = ({
  item,
  activeTab,
  onTabChange,
  isOpen,
  toggleSidebar,
  isMinimized,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = item.icon;
  const isActive =
    activeTab === item.id ||
    (item.children && item.children.some((child) => child.id === activeTab));
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Expand on hover for Desktop (width >= 1024) regardless of minimized state
    // If minimized, it will show as floating menu
    if (window.innerWidth >= 1024 && item.children) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 1024 && item.children) {
      timeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 300);
    }
  };

  const handleClick = () => {
    if (item.children) {
      // On Desktop: Clicking should ensure it's open (in case it wasn't, or to confirm).
      // It should NOT toggle closed, because that conflicts with Hover behavior/expectations.
      // On Mobile: Toggle is necessary.
      if (window.innerWidth >= 1024) {
        setIsExpanded(true);
      } else {
        setIsExpanded(!isExpanded);
      }
    } else {
      onTabChange(item.id);
      if (window.innerWidth < 1024) toggleSidebar();
    }
  };

  return (
    <div
      className="mb-1 relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handleClick}
        title={isMinimized ? item.label : ""}
        className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all duration-200 group justify-between ${
          isActive && !item.children
            ? "bg-finance-primary text-white scale-[1.02] shadow-md shadow-finance-primary/20"
            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
        } ${isMinimized ? "justify-center px-0" : ""}`}
      >
        <div
          className={`flex items-center ${isMinimized ? "justify-center w-full" : ""}`}
        >
          <Icon
            size={18}
            className={`${!isMinimized ? "mr-3" : ""} ${isActive && !item.children ? "text-white" : "text-slate-500 group-hover:text-white"} transition-colors`}
          />
          {!isMinimized && (
            <span className="font-medium whitespace-nowrap text-sm">
              {item.label}
            </span>
          )}
        </div>
        {item.children &&
          !isMinimized &&
          (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
      </button>

      {/* Submenu */}
      {item.children && isExpanded && (
        <div
          className={
            !isMinimized
              ? "ml-9 mt-1 space-y-1 animate-fade-in-down"
              : "absolute left-[calc(100%+0.5rem)] top-0 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-left-2"
          }
        >
          {/* Header for minimized floating menu */}
          {isMinimized && (
            <div className="px-4 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800 mb-1">
              {item.label}
            </div>
          )}

          {item.children.map((child) => (
            <button
              key={child.id}
              onClick={(e) => {
                e.stopPropagation();
                onTabChange(child.id);
                if (window.innerWidth < 1024) toggleSidebar();
              }}
              className={`flex items-center w-full px-4 py-2 rounded-lg text-sm transition-colors duration-200 ${
                activeTab === child.id
                  ? "bg-finance-primary/10 text-finance-primary border-l-2 border-finance-primary scale-100 font-medium"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
              } ${!isMinimized && activeTab === child.id ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-l-2" : ""}`}
            >
              {child.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const SidebarOrganism = ({
  activeTab,
  onTabChange,
  isOpen,
  toggleSidebar,
  onLogout,
  user,
  isMinimized,
  setIsMinimized,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "accounts", label: "Accounts", icon: CreditCard },
    { id: "transaction-list", label: "Transactions", icon: Receipt },
    { id: "categories", label: "Categories", icon: Tag },
    { id: "planning", label: "Kakeibo Planning", icon: BookOpen },
    { id: "filter", label: "Reports", icon: LineChart },
    { id: "telegram", label: "Telegram Bot", icon: Send },
    { id: "guide", label: "Panduan", icon: HelpCircle },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isMinimized ? "w-20" : "w-60"} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white`}
      >
        {/* Logo */}
        <div
          className={`flex items-center p-5 border-b border-slate-200 dark:border-slate-800 transition-all duration-300 relative ${isMinimized ? "justify-center" : "justify-between"}`}
        >
          <div className="flex items-center gap-2">
            {!isMinimized ? (
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap overflow-hidden transition-all duration-300">
                Finance
                <span className="text-finance-primary uppercase italic text-lg ml-1">
                  App
                </span>
              </h1>
            ) : (
              <div className="bg-finance-primary w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-finance-primary/20">
                <span className="text-white font-black text-lg">F</span>
              </div>
            )}
            {!isMinimized && <ThemeToggle className="ml-1 scale-[0.7]" />}
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <Menu size={24} />
          </button>

          {/* Minimize Toggle (Desktop only) */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:border-slate-500 absolute -right-3.5 top-20 z-40 transition-all hover:scale-110 shadow-md"
          >
            {isMinimized ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={`px-3 py-4 space-y-0.5 transition-all duration-300 ${isMinimized ? "px-2" : ""}`}
        >
          {!isMinimized && (
            <p className="px-4 text-[9px] font-black text-slate-500/80 uppercase tracking-[0.2em] mb-3">
              Main Menu
            </p>
          )}
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              activeTab={activeTab}
              onTabChange={onTabChange}
              isOpen={isOpen}
              toggleSidebar={toggleSidebar}
              isMinimized={isMinimized}
            />
          ))}
        </nav>

        {/* Bottom Actions */}
        <div
          className={`absolute bottom-0 left-0 w-full p-3 border-t border-slate-200 dark:border-slate-800 transition-all duration-300 ${isMinimized ? "px-2" : ""}`}
        >
          {/* User Profile Section */}
          <div className="relative mb-3" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center w-full px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 ${isMinimized ? "justify-center" : ""}`}
            >
              <span
                className={`h-8 w-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-slate-200 dark:border-slate-700 shadow-inner`}
              >
                <img
                  src={
                    user?.gender === "female"
                      ? "/female-avatar.png"
                      : "/male-avatar.png"
                  }
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </span>
              {!isMinimized && (
                <>
                  <div className="ml-2.5 flex-1 text-left overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user?.fullName || "User"}
                    </p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate uppercase font-medium">
                      {user?.role || "Personal Account"}
                    </p>
                  </div>
                  <ChevronDown
                    size={12}
                    className={`text-slate-400 dark:text-slate-500 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                  />
                </>
              )}
            </button>

            {/* User Dropdown */}
            {showUserMenu && !isMinimized && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl py-2 border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <button className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 text-slate-600 dark:text-slate-300 transition-colors border-b border-slate-50 dark:border-slate-700/50 mb-1 pb-2">
                  <User size={16} className="text-slate-400" />
                  <span className="font-bold">Profile Details</span>
                </button>
                <button className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 text-slate-600 dark:text-slate-300 transition-colors">
                  <Settings size={16} className="text-slate-400" />
                  <span className="font-bold">Settings</span>
                </button>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            title={isMinimized ? "Logout" : ""}
            className={`flex items-center w-full px-4 py-2.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all duration-200 group ${isMinimized ? "justify-center px-0" : ""}`}
          >
            <LogOut
              size={18}
              className={`${!isMinimized ? "mr-3" : ""} group-hover:scale-110 transition-transform`}
            />
            {!isMinimized && (
              <span className="font-bold text-[13px]">Sign Out</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
