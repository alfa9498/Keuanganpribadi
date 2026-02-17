import React, { useState } from "react";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { FormField } from "../molecules/FormField";
import { API_URL } from "../../config/api";

export const ForgotPasswordOrganism = ({ onSwitchToLogin, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message);
        setTimeout(() => {
          // Navigate to Verify OTP
          onSuccess(formData.email);
        }, 1500);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6 md:mb-8">
        <div className="inline-flex items-center justify-center p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 mb-3">
          <div className="text-amber-500 font-black text-xl tracking-tighter">
            FinVeda
          </div>
        </div>
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
          Lupa Password?
        </h2>
        <p className="text-slate-400 mt-1 text-xs">
          Masukkan Email dan WhatsApp untuk verifikasi
        </p>
      </div>

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl mb-6 text-sm text-center font-medium">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-6 text-sm text-center font-medium animate-pulse">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Email Terdaftar
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@anda.com"
            required
            className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 transition-all text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
            No. WhatsApp
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="0812..."
            required
            className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 transition-all text-xs"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-sky-500/20 transition-all active:scale-95"
            disabled={loading}
          >
            {loading ? "Mengirim OTP..." : "Kirim Kode OTP"}
          </Button>

          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-slate-500 font-bold hover:text-white transition-colors text-[10px] uppercase tracking-widest py-2"
          >
            Kembali ke Login
          </button>
        </div>
      </form>
    </div>
  );
};
