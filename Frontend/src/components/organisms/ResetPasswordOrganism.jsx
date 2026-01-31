import React, { useState } from "react";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { FormField } from "../molecules/FormField";
import { API_URL } from "../../config/api";

export const ResetPasswordOrganism = ({ email, otp, onSuccess }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      return setError("Password tidak cocok!");
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword: password }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Password berhasil diubah, silakan login.");
        onSuccess();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Gagal mereset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-4">
          <div className="text-emerald-500 font-black text-2xl tracking-tighter">
            FinVeda
          </div>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">
          Reset Password
        </h2>
        <p className="text-slate-400 mt-2 text-sm">
          Masukkan password baru Anda yang aman
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
            Password Baru
          </label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 transition-all text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Konfirmasi Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 transition-all text-sm"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-sky-500/20 transition-all active:scale-95 mt-4"
          disabled={loading}
        >
          {loading ? "Menyimpan..." : "Simpan Password Baru"}
        </Button>
      </form>
    </div>
  );
};
