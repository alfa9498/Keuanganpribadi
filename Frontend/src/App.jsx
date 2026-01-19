import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { LoginFormOrganism } from './components/organisms/LoginFormOrganism';
import { RegisterFormOrganism } from './components/organisms/RegisterFormOrganism';
import { DashboardOrganism } from './components/organisms/DashboardOrganism';
import { AccountDashboardOrganism } from './components/organisms/AccountDashboardOrganism';
import { TransactionFormOrganism } from './components/organisms/TransactionFormOrganism';
import { TransactionListOrganism } from './components/organisms/TransactionListOrganism';
import { ReportDashboardOrganism } from './components/organisms/ReportDashboardOrganism';
import { ForgotPasswordOrganism } from './components/organisms/ForgotPasswordOrganism';
import { VerifyOtpOrganism } from './components/organisms/VerifyOtpOrganism';
import { ResetPasswordOrganism } from './components/organisms/ResetPasswordOrganism';
import { MainLayoutTemplate } from './components/templates/MainLayoutTemplate';

import { NotificationProvider } from './context/NotificationContext';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('login'); // Default to login
  const [filterRange, setFilterRange] = useState('30D');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAccount, setFilterAccount] = useState('');

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');

  useEffect(() => {
    // Check for user session on mount
    const checkSession = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/me`, {
          credentials: 'include'
        });
        if (response.ok) {
          const result = await response.json();
          setUser(result.user);
          setActiveTab('dashboard');
        }
      } catch (err) {
        console.error("Session check failed", err);
      }
    };
    checkSession();
  }, []);

  // Real-time Update Listener
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('🔌 Connected to Real-time Sync Server');
    });

    socket.on('transaction_updated', (data) => {
      console.log('📢 Real-time Update Received:', data);
      // Notify all components by dispatching a custom event
      window.dispatchEvent(new CustomEvent('transaction_updated', { detail: data }));
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
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => document.addEventListener(event, resetTimer));

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        events.forEach(event => document.removeEventListener(event, resetTimer));
      };
    }
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error("Logout failed", err);
    }
    setUser(null);
    setActiveTab('login');
  };

  const handleRegisterSuccess = () => {
    setActiveTab('login');
  };

  if (!user) {
    return (
      <NotificationProvider>
        <div className="min-h-screen bg-slate-100 font-inter flex flex-col justify-center py-10 px-4">
          {activeTab === 'register' ? (
            <RegisterFormOrganism
              onRegisterSuccess={handleRegisterSuccess}
              onSwitchToLogin={() => setActiveTab('login')}
            />
          ) : activeTab === 'login' ? (
            <LoginFormOrganism
              onLoginSuccess={handleLogin}
              onSwitchToRegister={() => setActiveTab('register')}
              onForgotPassword={() => setActiveTab('forgot-password')}
            />
          ) : null}

          {activeTab === 'forgot-password' && (
            <ForgotPasswordOrganism
              onSwitchToLogin={() => setActiveTab('login')}
              onSuccess={(email) => {
                setResetEmail(email);
                setActiveTab('verify-otp');
              }}
            />
          )}

          {activeTab === 'verify-otp' && (
            <VerifyOtpOrganism
              email={resetEmail}
              onBack={() => setActiveTab('forgot-password')}
              onSuccess={(otp) => {
                setResetOtp(otp);
                setActiveTab('reset-password');
              }}
            />
          )}

          {activeTab === 'reset-password' && (
            <ResetPasswordOrganism
              email={resetEmail}
              otp={resetOtp}
              onSuccess={() => setActiveTab('login')}
            />
          )}
        </div>
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
        {activeTab === 'dashboard' && (
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
        {activeTab === 'transaction-list' && <TransactionListOrganism user={user} />}
        {activeTab === 'transaction-new' && <TransactionFormOrganism user={user} setSection={setActiveTab} onSuccess={() => setActiveTab('transaction-list')} />}
        {activeTab === 'filter' && <ReportDashboardOrganism user={user} />}
        {activeTab === 'accounts' && <AccountDashboardOrganism user={user} />}
      </MainLayoutTemplate>
    </NotificationProvider>
  );
}

export default App;
