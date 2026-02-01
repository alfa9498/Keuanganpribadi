import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { FormField } from "../molecules/FormField";
import { API_URL } from "../../config/api";

export const LoginFormOrganism = ({
  onLoginSuccess,
  onSwitchToRegister,
  onForgotPassword,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        // Backend login returns 'user', register returns 'data'. Handle both.
        onLoginSuccess(result.user || result.data);
      } else {
        setError(result.message || "Login failed");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6 md:mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-sky-500/10 rounded-2xl border border-sky-500/20 mb-4">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-10 h-10 object-contain"
            onError={(e) => (e.target.style.display = "none")}
          />
          <div className="text-sky-500 font-black text-2xl tracking-tighter">
            FinVeda
          </div>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          Welcome Back
        </h2>
        <p className="text-slate-400 mt-2 text-sm">
          Sign in to continue your financial journey
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl mb-6 text-sm text-center font-medium animate-pulse">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Email Address
          </label>
          <div className="relative group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@company.com"
              autoComplete="off"
              className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Password
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-[10px] font-black text-sky-500 hover:text-sky-400 uppercase tracking-widest transition-colors"
            >
              Forgot?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="off"
              className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 transition-all pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3 md:py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-sky-500/20 transition-all active:scale-95"
          disabled={loading}
        >
          {loading ? "Authenticating..." : "Sign In Now"}
        </Button>
      </form>

      <div className="mt-6 md:mt-10 text-center">
        <p className="text-slate-500 text-sm">
          New here?{" "}
          <button
            onClick={onSwitchToRegister}
            className="text-white font-black hover:text-sky-400 transition-colors"
          >
            Create an Account
          </button>
        </p>
      </div>
    </div>
  );
};
