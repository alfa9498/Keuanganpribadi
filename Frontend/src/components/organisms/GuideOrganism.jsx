import React, { useState } from "react";
import {
  BookOpen,
  CreditCard,
  Tag,
  PlusCircle,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Lightbulb,
  Smartphone,
  ShieldCheck,
  HelpCircle,
  Target,
} from "lucide-react";

export const GuideOrganism = () => {
  const [expandedSections, setExpandedSections] = useState([]);

  const toggleSection = (id) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const sections = [
    {
      id: "accounts",
      title: "1. Menambah Akun (Account)",
      icon: <CreditCard className="text-blue-500" size={24} />,
      content:
        "Akun adalah wadah penyimpanan uang Anda. Contoh: Kas Tunai, Bank Mandiri, atau GoPay.",
      steps: [
        "Buka menu Accounts di sidebar.",
        "Klik tombol + Add Account.",
        "Masukkan nama akun dan saldo saat ini.",
        "Simpan untuk mulai mengelola saldo tersebut.",
      ],
      color: "bg-blue-50",
    },
    {
      id: "categories",
      title: "2. Mengelola Kategori",
      icon: <Tag className="text-purple-500" size={24} />,
      content:
        "Kategori membantu Anda melihat ke mana uang pergi. Kami menggunakan sistem bertingkat.",
      steps: [
        "Expenses: Buat Grup (misal: Bulanan) lalu isi Sub-kategori (misal: Listrik).",
        "Income: Langsung buat kategori pemasukan (misal: Gaji).",
        "Kategori ini akan otomatis muncul saat Anda mencatat transaksi.",
      ],
      color: "bg-purple-50",
    },
    {
      id: "transactions",
      title: "3. Mencatat Transaksi",
      icon: <PlusCircle className="text-emerald-500" size={24} />,
      content:
        "Inti dari aplikasi ini adalah mencatat setiap uang masuk dan keluar.",
      steps: [
        "Klik tombol + Transaksi di dashboard atau tombol tambah cepat.",
        "Pilih Tipe (Income/Expense/Transfer).",
        "Pilih Kategori dan Akun yang digunakan.",
        "Masukkan jumlah dan keterangan jika perlu.",
        "Klik Simpan untuk menambah data.",
      ],
      color: "bg-emerald-50",
    },
    {
      id: "debt-receivables",
      title: "4. Memasukkan Hutang & Piutang",
      icon: <HelpCircle className="text-indigo-500" size={24} />,
      content:
        "Kelola catatan uang yang dipinjam atau dipinjamkan agar saldo tetap akurat.",
      steps: [
        "Hutang: Input Income dengan kategori 'Hutang' saat menerima uang pinjaman.",
        "Bayar Hutang: Input Expense dengan kategori 'Cicilan / Hutang' saat melunasi.",
        "Piutang: Input Expense dengan kategori 'Piutang' saat Anda meminjamkan uang ke orang lain.",
        "Terima Piutang: Input Income dengan kategori 'Piutang' saat orang tersebut mengembalikan uang.",
        "PENTING: Pastikan penulisan kategori benar-benar sama (Capital Sensitive) agar Dashboard bisa menghitung saldo Hutang & Piutang dengan akurat.",
        "Pending Expense: Jika Anda mencatat Pengeluaran (Expense) dengan status 'Pending', maka sistem otomatis menganggapnya sebagai 'Hutang' sampai Anda mengubahnya menjadi 'Selesai'.",
      ],
      color: "bg-indigo-50",
    },
    {
      id: "planning",
      title: "5. Planning & Budgeting (Zero-Based)",
      icon: <Target className="text-rose-500" size={24} />,
      content:
        "Gunakan konsep Zero-Based Budgeting di mana setiap Rupiah yang masuk harus diberi tugas hingga sisanya menjadi nol.",
      steps: [
        "Ledger (Buku Besar): Pusat komando. Pastikan indikator Sisa Uang (Unallocated) berwarna Hijau. Jika Merah (Over-Allocated), berarti rencana pengeluaran Anda melebihi pendapatan.",
        "Savings Goals (Target Tabungan): Tentukan tujuan (misal: Dana Darurat) dan penuhi 'Target Nabung Bulanan' terlebih dahulu (Pay Yourself First).",
        "Envelopes (Amplop Anggaran): Atur batas maksimal pengeluaran bulanan (Limit). Dibagi menjadi 4 grup: Survival (Pokok), Optional (Keinginan), Culture (Edukasi), dan Extra (Darurat).",
        "Cara Kerja: Setiap transaksi 'Expense' yang Anda catat akan otomatis mengurangi sisa saldo di Envelopes. Bar akan berubah kuning/merah jika hampir habis.",
      ],
      color: "bg-rose-50",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
            <BookOpen size={40} className="text-sky-400" />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-black mb-1">Pusat Bantuan</h2>
            <p className="text-slate-300 text-sm">
              Pelajari cara mengoptimalkan pencatatan keuangan Anda dengan
              langkah-langkah mudah di bawah ini.
            </p>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="space-y-6">
        {/* Guide Sections */}
        <div className="grid grid-cols-1 gap-4">
          {sections.map((section) => {
            const isExpanded = expandedSections.includes(section.id);
            return (
              <div
                key={section.id}
                className="bg-white rounded-3xl shadow-lg shadow-slate-200/40 border border-slate-100 overflow-hidden transform transition-all"
              >
                <div
                  className="p-5 md:p-6 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-2xl ${section.color}`}>
                        {React.cloneElement(section.icon, { size: 20 })}
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">
                        {section.title}
                      </h3>
                    </div>
                    <div
                      className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                    >
                      <ArrowRight
                        className="text-slate-400 rotate-90"
                        size={18}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <p className="text-slate-500 mb-5 text-sm font-medium">
                        {section.content}
                      </p>

                      <div className="space-y-2.5">
                        {section.steps.map((step, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100"
                          >
                            <CheckCircle
                              size={16}
                              className="text-emerald-500 mt-0.5 flex-shrink-0"
                            />
                            <span className="text-xs font-semibold">
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-amber-50/50 border border-amber-100/50 rounded-3xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Lightbulb className="text-amber-500" size={20} />
              <h4 className="font-bold text-amber-800 text-sm">Tips Hemat</h4>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              Gunakan fitur <strong>Transfer</strong> untuk memindahkan uang
              antar akun tanpa mempengaruhi total kekayaan Anda (misal: Tarik
              Tunai dari ATM).
            </p>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-3xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Smartphone className="text-indigo-500" size={20} />
              <h4 className="font-bold text-indigo-800 text-sm">
                Cek Bot Telegram
              </h4>
            </div>
            <p className="text-xs text-indigo-700 leading-relaxed">
              Hubungkan akun Anda dengan Telegram untuk mencatat transaksi lebih
              cepat langsung dari chat! Buka menu <strong>Telegram Bot</strong>{" "}
              untuk mulai.
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center pb-4">
          <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <ShieldCheck size={12} /> Keamanan Data Terjamin
          </div>
        </div>
      </div>
    </div>
  );
};
