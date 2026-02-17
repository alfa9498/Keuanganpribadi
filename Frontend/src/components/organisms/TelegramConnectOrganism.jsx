import React, { useState, useEffect } from "react";
import {
  Send,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Copy,
  MessageSquare,
} from "lucide-react";
import { API_URL } from "../../config/api";

export const TelegramConnectOrganism = ({ user }) => {
  const [linkData, setLinkData] = useState(null);
  const [verificationCode, setVerificationCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const isConnected = !!user?.telegramChatId;

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Link
      const linkRes = await fetch(`${API_URL}/telegram-link`, {
        credentials: "include",
      });
      const linkJson = await linkRes.json();
      setLinkData(linkJson);

      // Fetch Code
      const codeRes = await fetch(`${API_URL}/telegram-verification-code`, {
        credentials: "include",
      });
      const codeJson = await codeRes.json();
      setVerificationCode(codeJson.verificationCode);
    } catch (err) {
      console.error("Failed to fetch Telegram link", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isConnected) {
      fetchData();
    }
  }, [isConnected]);

  const handleCopy = () => {
    navigator.clipboard.writeText(verificationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading && !isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-12 h-12 text-sky-500 animate-spin mb-4" />
        <p className="text-slate-400 animate-pulse">
          Menyiapkan koneksi Telegram...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Header Section */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center p-3 bg-sky-500/10 rounded-3xl border border-sky-500/20 mb-4 group transition-all hover:scale-110">
          <Send className="w-10 h-10 text-sky-500 group-hover:rotate-12 transition-transform" />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
          Telegram <span className="text-sky-500">Bot Connection</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Hubungkan akun Anda dengan Telegram untuk mencatat transaksi lebih
          cepat melalui chat atau foto struk.
        </p>
      </div>

      {isConnected ? (
        /* Connected State */
        <div className="bg-slate-900/50 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 md:p-8 text-center animate-in fade-in zoom-in duration-500 shadow-2xl shadow-emerald-500/5">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-4 text-emerald-500">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Akun Berhasil Terhubung!
          </h2>
          <p className="text-emerald-400/80 mb-8 font-medium">
            Terhubung sebagai: @{user.telegramUsername || "User"}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-lg mx-auto">
            <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">
                Status
              </h4>
              <p className="text-white font-bold">Aktif & Siap Digunakan</p>
            </div>
            <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">
                Platform
              </h4>
              <p className="text-white font-bold">Telegram Official</p>
            </div>
          </div>

          <button
            onClick={() =>
              window.open(
                linkData?.url ||
                  `https://t.me/${process.env.REACT_APP_TELEGRAM_BOT_USERNAME}`,
                "_blank",
              )
            }
            className="mt-10 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-3 mx-auto"
          >
            <MessageSquare size={20} />
            Buka Telegram Chat
          </button>
        </div>
      ) : (
        /* Unconnected State */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Method 1: Magic Link */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative h-full bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-500 mb-4">
                <ExternalLink size={20} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Cara 1: Link Otomatis
              </h3>
              <p className="text-slate-400 text-xs mb-4 flex-1">
                Klik tombol di bawah ini untuk membuka bot Telegram dan
                hubungkan akun secara instan tanpa perlu ketik manual.
              </p>
              <button
                onClick={() => window.open(linkData?.url || "#", "_blank")}
                className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-sky-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Hubungkan Sekarang
                <ExternalLink size={14} />
              </button>
            </div>
          </div>

          {/* Method 2: Verification Code */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative h-full bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-4">
                <span className="font-black text-lg">#</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Cara 2: Kode Verifikasi
              </h3>
              <p className="text-slate-400 text-xs mb-4 flex-1">
                Jika Link di samping tidak terbuka, kirimkan kode verifikasi
                berikut ke bot kami secara manual.
              </p>

              <div className="w-full bg-slate-950/80 border border-white/5 rounded-2xl p-3 mb-2 flex items-center justify-between group/code">
                <span className="text-xl font-black text-white tracking-[0.2em] ml-2">
                  {verificationCode || "------"}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all active:scale-90"
                >
                  {copied ? (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  ) : (
                    <Copy size={20} />
                  )}
                </button>
              </div>
              <p className="text-[10px] font-bold text-rose-400/80 uppercase tracking-widest italic animate-pulse">
                Berlaku selama 5 menit
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer / Status Refresh */}
      {!isConnected && (
        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
            <RefreshCw size={14} />
            Koneksi akan terdeteksi otomatis setelah Anda mengirimkan kode.
          </p>
        </div>
      )}
    </div>
  );
};
