import React, { useState } from "react";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { FormField } from "../molecules/FormField";
import { API_URL } from "../../config/api";

export const VerifyOtpOrganism = ({ email, onSuccess, onBack }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const result = await response.json();

      if (response.ok) {
        onSuccess(otp); // Pass OTP to next step (Reset Password)
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Gagal verifikasi OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6 md:mb-8">
        <div className="inline-flex items-center justify-center p-2 bg-sky-500/10 rounded-xl border border-sky-500/20 mb-3">
          <div className="text-sky-500 font-black text-xl tracking-tighter">
            FinVeda
          </div>
        </div>
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
          Verifikasi OTP
        </h2>
        <p className="text-slate-400 mt-1 text-xs">
          Masukkan kode yang dikirim ke email
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-6 text-sm text-center font-medium animate-pulse">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 text-center block w-full">
            Kode OTP
          </label>
          <input
            type="text"
            name="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            required
            className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-5 py-3 text-white text-center text-2xl md:text-3xl font-black tracking-[0.5em] placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-sky-500/20 transition-all active:scale-95"
            disabled={loading}
          >
            {loading ? "Memverifikasi..." : "Verifikasi"}
          </Button>

          <button
            type="button"
            onClick={onBack}
            className="text-slate-500 font-bold hover:text-white transition-colors text-[10px] uppercase tracking-widest py-2"
          >
            Kembali
          </button>
        </div>
      </form>
    </div>
  );
};
