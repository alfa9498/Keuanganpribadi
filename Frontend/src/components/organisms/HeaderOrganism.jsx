import React, { useState, useRef, useEffect } from "react";
import { Menu, Bell, X, Calendar, SlidersHorizontal } from "lucide-react";
import { TimeFilter } from "../molecules/TimeFilter";
import { CategoryFilter } from "../molecules/CategoryFilter";
import { AccountFilter } from "../molecules/AccountFilter";
import { API_URL } from "../../config/api";

export const HeaderOrganism = ({
  user,
  toggleSidebar,
  onLogout,
  activeTab,
  filterRange,
  setFilterRange,
  filterCategory,
  setFilterCategory,
  filterAccount,
  setFilterAccount,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `${API_URL}/notifications/unread-count?user_id=${user.id}`,
        {
          credentials: "include",
        },
      );
      const result = await response.json();
      if (response.ok) {
        setNotificationCount(result.count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  // Fetch all notifications
  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `${API_URL}/notifications?user_id=${user.id}&limit=10`,
        {
          credentials: "include",
        },
      );
      const result = await response.json();
      if (response.ok) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT",
          credentials: "include",
        },
      );

      if (response.ok) {
        // Refresh notifications and count
        fetchNotifications();
        fetchUnreadCount();
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `${API_URL}/notifications/mark-all-read?user_id=${user.id}`,
        {
          method: "PUT",
          credentials: "include",
        },
      );

      if (response.ok) {
        fetchNotifications();
        fetchUnreadCount();
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // Format timestamp to relative time
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch on mount and when dropdown opens
  useEffect(() => {
    fetchUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  return (
    <header className="sticky top-0 z-20 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none shadow-sm pl-4 pr-6 py-3">
      <div className="flex flex-grow items-center justify-between">
        {/* Mobile Controls (Menu & Filter) */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-finance-primary hover:border-finance-primary/50 transition-all active:scale-95"
          >
            <Menu size={20} />
          </button>

          {activeTab === "dashboard" && (
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`p-2 rounded-xl border transition-all active:scale-95 ${showMobileFilters ? "bg-slate-900 border-slate-900 text-white shadow-lg" : "bg-white border-slate-200 text-slate-600"}`}
            >
              <SlidersHorizontal size={20} />
            </button>
          )}
        </div>

        {/* Header Title (Left/Center) */}
        <div className="flex-1 px-4 lg:px-8">
          {activeTab === "dashboard" ? (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                Dashboard Overview
              </h2>
              <p className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5 mt-0.5">
                <Calendar size={12} className="text-finance-primary" />
                {filterRange === "ALL"
                  ? "Data Seluruh Waktu"
                  : `Kinerja ${filterRange} Terakhir`}
              </p>
            </div>
          ) : activeTab === "filter" ? null : (
            <h2 className="text-xl font-bold text-slate-800 capitalize">
              {activeTab.replace("-", " ")}
            </h2>
          )}
        </div>

        {/* Right Side - Filters & Notification */}
        <div className="flex items-center gap-3">
          {/* Dashboard Filters */}
          {activeTab === "dashboard" && (
            <>
              {/* Desktop Filters */}
              <div className="hidden md:flex items-center gap-3 animate-fade-in mr-2">
                <CategoryFilter
                  currentCategory={filterCategory}
                  onCategoryChange={setFilterCategory}
                />
                <AccountFilter
                  currentAccount={filterAccount}
                  onAccountChange={setFilterAccount}
                />
                <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>
                <TimeFilter
                  currentRange={filterRange}
                  onRangeChange={setFilterRange}
                />
              </div>

              {/* Mobile Filters Dropdown/Overlay */}
              {showMobileFilters && (
                <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-4 flex flex-col gap-3 animate-slide-down md:hidden shadow-xl z-50">
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Kategori
                      </p>
                      <CategoryFilter
                        currentCategory={filterCategory}
                        onCategoryChange={setFilterCategory}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Akun
                      </p>
                      <AccountFilter
                        currentAccount={filterAccount}
                        onAccountChange={setFilterAccount}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Periode
                      </p>
                      <TimeFilter
                        currentRange={filterRange}
                        onRangeChange={setFilterRange}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="mt-2 w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm"
                  >
                    Selesai
                  </button>
                </div>
              )}
            </>
          )}

          {/* Notification Bell - Only show when there are notifications */}
          {notificationCount > 0 && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border-[0.5px] border-slate-200 bg-slate-50 hover:text-finance-primary hover:bg-slate-100 transition-colors"
              >
                <span className="absolute -top-0.5 right-0 z-1 h-2 w-2 rounded-full bg-red-500">
                  <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                </span>
                <Bell size={18} />
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-slate-200 animate-fade-in max-h-[500px] flex flex-col">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        Notifications
                      </h3>
                      <p className="text-xs text-slate-500">
                        {notificationCount} unread
                      </p>
                    </div>
                    {notificationCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-finance-primary hover:underline font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-slate-400 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group ${!notif.is_read ? "bg-blue-50/50" : ""}`}
                          onClick={() => !notif.is_read && markAsRead(notif.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-800 truncate">
                                  {notif.title}
                                </p>
                                {!notif.is_read && (
                                  <span className="h-2 w-2 rounded-full bg-finance-primary flex-shrink-0"></span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                {notif.message}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {formatTimeAgo(notif.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
