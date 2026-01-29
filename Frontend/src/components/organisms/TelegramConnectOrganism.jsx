import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { API_URL } from '../../config/api';

export const TelegramConnectOrganism = ({ user }) => {
    const [loading, setLoading] = useState(false);
    const [linkData, setLinkData] = useState(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const fetchLink = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/telegram-link`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                setLinkData(data);
            } else {
                setError(data.message || "Gagal mengambil link linking.");
            }
        } catch (err) {
            setError("Gagal menghubungi server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // If user not already linked (we don't check user.telegram_chat_id yet as it might be outdated in session)
        // Ideally we fetch updated profile, but let's just fetch link on mount for now.
        fetchLink();
    }, []);

    const handleCopy = () => {
        if (linkData?.url) {
            navigator.clipboard.writeText(linkData.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Integrasi Telegram</h2>
                    <p className="text-slate-500 mt-1">Hubungkan akun Anda dengan Bot Telegram untuk mencatat transaksi dengan cepat.</p>
                </div>
                <div className="h-12 w-12 bg-sky-100 rounded-full flex items-center justify-center text-sky-600">
                    <Send size={24} />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 md:p-8">
                    {user?.telegram_chat_id ? (
                        <div className="text-center py-8">
                            <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                                <CheckCircle size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Akun Terhubung!</h3>
                            <p className="text-slate-500 mt-2 max-w-md mx-auto">
                                Akun Telegram Anda <strong>@{user.telegram_username || 'User'}</strong> (ID: {user.telegram_chat_id}) sudah terhubung.
                            </p>
                            <button onClick={fetchLink} className="mt-6 text-sm text-slate-400 hover:text-finance-primary underline">
                                Link Ulang / Ganti Akun
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1 space-y-4">
                                <h3 className="text-lg font-bold text-slate-800">Cara Menghubungkan:</h3>
                                <ol className="space-y-3 list-decimal list-inside text-slate-600">
                                    <li>Klik tombol <strong>Hubungkan Telegram</strong> di bawah.</li>
                                    <li>Aplikasi Telegram akan terbuka.</li>
                                    <li>Klik tombol <strong>Start</strong> pada Bot.</li>
                                    <li>Selesai! Anda akan menerima notifikasi sukses.</li>
                                </ol>
                            </div>

                            <div className="flex-1 w-full max-w-sm">
                                {loading ? (
                                    <div className="h-40 bg-slate-50 rounded-xl flex items-center justify-center border border-dashed border-slate-300">
                                        <RefreshCw className="animate-spin text-slate-400" />
                                    </div>
                                ) : linkData ? (
                                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center space-y-4">
                                        <p className="text-sm text-slate-500 mb-2">Klik tombol di bawah ini:</p>
                                        <a 
                                            href={linkData.deepLink || linkData.url} 
                                            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                                        >
                                            <Send size={18} />
                                            Hubungkan Telegram
                                        </a>
                                        
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-slate-200"></div>
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-slate-50 px-2 text-slate-400">Atau copy link</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                readOnly 
                                                value={linkData.url}
                                                className="input-field text-xs bg-white"
                                            />
                                            <button 
                                                onClick={handleCopy}
                                                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500"
                                                title="Copy Link"
                                            >
                                                {copied ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-400">Link berlaku selama 5 menit.</p>
                                        <p className="text-xs text-amber-600 mt-2">💡 <strong>Tips:</strong> Jika tombol tidak berfungsi, copy link di atas dan paste di aplikasi Telegram Anda.</p>
                                    </div>
                                ) : (
                                    <div className="text-center text-red-500 text-sm">
                                        {error || "Gagal memuat link."}
                                        <button onClick={fetchLink} className="block mx-auto mt-2 underline">Coba Lagi</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Guides Section */}
             <div className="grid md:grid-cols-2 gap-6">
                <div className="card bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                    <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        💡 Input Cepat
                    </h3>
                    <p className="text-sm text-indigo-700 mb-4">Mencatat tanpa membuka aplikasi web.</p>
                    <div className="bg-white/80 p-3 rounded-lg text-xs font-mono text-slate-600 border border-indigo-100 shadow-sm">
                        /out 25000 Makan Siang
                    </div>
                </div>
                <div className="card bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                     <h3 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                        📸 Scan Struk
                    </h3>
                     <p className="text-sm text-emerald-700 mb-4">Kirim foto struk belanja, bot akan membacanya.</p>
                     <div className="flex gap-2">
                        <div className="h-8 w-6 bg-slate-200 rounded animate-pulse"></div>
                        <div className="text-xs text-slate-400 self-center">Sending photo...</div>
                     </div>
                </div>
             </div>
        </div>
    );
};
