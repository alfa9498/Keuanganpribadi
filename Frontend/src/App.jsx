import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { LoginFormOrganism } from "./components/organisms/LoginFormOrganism";
import { RegisterFormOrganism } from "./components/organisms/RegisterFormOrganism";
import { DashboardOrganism } from "./components/organisms/DashboardOrganism";
import { AccountDashboardOrganism } from "./components/organisms/AccountDashboardOrganism";
import { TransactionFormOrganism } from "./components/organisms/TransactionFormOrganism";
import { TransactionListOrganism } from "./components/organisms/TransactionListOrganism";
import { ReportDashboardOrganism } from "./components/organisms/ReportDashboardOrganism";
import { ForgotPasswordOrganism } from "./components/organisms/ForgotPasswordOrganism";
import { VerifyOtpOrganism } from "./components/organisms/VerifyOtpOrganism";
import { ResetPasswordOrganism } from "./components/organisms/ResetPasswordOrganism";
import { TelegramConnectOrganism } from "./components/organisms/TelegramConnectOrganism";
import { MainLayoutTemplate } from "./components/templates/MainLayoutTemplate";
import { AuthContainer } from "./components/templates/AuthContainer";

import { NotificationProvider } from "./context/NotificationContext";
import { API_URL, SOCKET_URL } from "./config/api";

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("login"); // Default to login
  const [filterRange, setFilterRange] = useState("30D");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAccount, setFilterAccount] = useState("");

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");

  const checkSession = async () => {
    try {
      const response = await fetch(`${API_URL}/me`, {
        credentials: "include",
      });
      if (response.ok) {
        const result = await response.json();
        setUser(result.user);
      }
    } catch (err) {
      console.error("Session check failed", err);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // Expose checkSession to auto-refresh when clicking Telegram tab
  useEffect(() => {
    if (activeTab === "telegram") {
      checkSession();
    }
  }, [activeTab]);

  // Real-time Update Listener
  useEffect(() => {
    // Skip socket.io on Vercel (serverless doesn't support persistent websockets)
    if (window.location.hostname.endsWith(".vercel.app")) {
      console.log("ℹ️ Real-time Sync disabled in Vercel environment.");
      return;
    }

    const socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("🔌 Connected to Real-time Sync Server");
    });

    socket.on("transaction_updated", (data) => {
      console.log("📢 Real-time Update Received:", data);
      // Notify all components by dispatching a custom event
      window.dispatchEvent(
        new CustomEvent("transaction_updated", { detail: data }),
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Idle Timeout Logic (15 minutes)
  useEffect(() => {
    let timeoutId;
    const IDLE_TIME = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (user) {
        timeoutId = setTimeout(() => {
          console.log("Auto logout due to inactivity");
          handleLogout();
        }, IDLE_TIME);
      }
    };

    if (user) {
      // Set initial timer
      resetTimer();

      // Listen for user activity
      const events = [
        "mousedown",
        "mousemove",
        "keypress",
        "scroll",
        "touchstart",
      ];
      events.forEach((event) => document.addEventListener(event, resetTimer));

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        events.forEach((event) =>
          document.removeEventListener(event, resetTimer),
        );
      };
    }
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
    setActiveTab("dashboard");
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed", err);
    }
    setUser(null);
    setActiveTab("login");
  };

  const handleRegisterSuccess = () => {
    setActiveTab("login");
  };

  if (!user) {
    return (
      <NotificationProvider>
        <AuthContainer activeTab={activeTab}>
          {activeTab === "register" ? (
            <RegisterFormOrganism
              onRegisterSuccess={handleRegisterSuccess}
              onSwitchToLogin={() => setActiveTab("login")}
            />
          ) : activeTab === "login" ? (
            <LoginFormOrganism
              onLoginSuccess={handleLogin}
              onSwitchToRegister={() => setActiveTab("register")}
              onForgotPassword={() => setActiveTab("forgot-password")}
            />
          ) : activeTab === "forgot-password" ? (
            <ForgotPasswordOrganism
              onSwitchToLogin={() => setActiveTab("login")}
              onSuccess={(email) => {
                setResetEmail(email);
                setActiveTab("verify-otp");
              }}
            />
          ) : activeTab === "verify-otp" ? (
            <VerifyOtpOrganism
              email={resetEmail}
              onBack={() => setActiveTab("forgot-password")}
              onSuccess={(otp) => {
                setResetOtp(otp);
                setActiveTab("reset-password");
              }}
            />
          ) : activeTab === "reset-password" ? (
            <ResetPasswordOrganism
              email={resetEmail}
              otp={resetOtp}
              onSuccess={() => setActiveTab("login")}
            />
          ) : null}
        </AuthContainer>
      </NotificationProvider>
    );
  }

  return (
    <NotificationProvider>
      <MainLayoutTemplate
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        filterRange={filterRange}
        setFilterRange={setFilterRange}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterAccount={filterAccount}
        setFilterAccount={setFilterAccount}
      >
        {activeTab === "dashboard" && (
          <DashboardOrganism
            user={user}
            onLogout={handleLogout}
            filterRange={filterRange}
            setFilterRange={setFilterRange}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterAccount={filterAccount}
            setFilterAccount={setFilterAccount}
          />
        )}
        {activeTab === "transaction-list" && (
          <TransactionListOrganism
            user={user}
            filterRange={filterRange}
            setFilterRange={setFilterRange}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterAccount={filterAccount}
            setFilterAccount={setFilterAccount}
          />
        )}
        {activeTab === "transaction-new" && (
          <TransactionFormOrganism
            user={user}
            setSection={setActiveTab}
            onSuccess={() => setActiveTab("transaction-list")}
          />
        )}
        {activeTab === "filter" && <ReportDashboardOrganism user={user} />}
        {activeTab === "accounts" && <AccountDashboardOrganism user={user} />}
        {activeTab === "telegram" && <TelegramConnectOrganism user={user} />}
      </MainLayoutTemplate>
    </NotificationProvider>
  );
}

export default App;
