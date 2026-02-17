import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { FormField } from "../molecules/FormField";
import { useNotification } from "../../context/NotificationContext";
import { API_URL } from "../../config/api";

export const ResetPasswordOrganism = ({ email, otp, onSuccess }) => {
  const { showNotification } = useNotification();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        showNotification("Password berhasil diubah, silakan login.", "success");
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
      <div className="text-center mb-4 md:mb-6">
        <div className="inline-flex items-center justify-center p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 mb-3">
          <div className="text-emerald-500 font-black text-xl tracking-tighter">
            FinVeda
          </div>
        </div>
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
          Reset Password
        </h2>
        <p className="text-slate-400 mt-1 text-xs">
          Masukkan password baru Anda yang aman
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-6 text-sm text-center font-medium animate-pulse">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 transition-all text-xs pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Konfirmasi Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 transition-all text-xs pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-sky-500/20 transition-all active:scale-95 mt-2"
          disabled={loading}
        >
          {loading ? "Menyimpan..." : "Simpan Password"}
        </Button>
      </form>
    </div>
  );
};
