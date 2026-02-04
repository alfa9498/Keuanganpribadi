import React from "react";
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
  ShieldCheck
} from "lucide-react";

export const GuideOrganism = () => {
  const sections = [
    {
      id: "accounts",
      title: "1. Menambah Akun (Account)",
      icon: <CreditCard className="text-blue-500" size={24} />,
      content: "Akun adalah wadah penyimpanan uang Anda. Contoh: Kas Tunai, Bank Mandiri, atau GoPay.",
      steps: [
        "Buka menu Accounts di sidebar.",
        "Klik tombol + Add Account.",
        "Masukkan nama akun dan saldo saat ini.",
        "Simpan untuk mulai mengelola saldo tersebut."
      ],
      color: "bg-blue-50"
    },
    {
      id: "categories",
      title: "2. Mengelola Kategori",
      icon: <Tag className="text-purple-500" size={24} />,
      content: "Kategori membantu Anda melihat ke mana uang pergi. Kami menggunakan sistem bertingkat.",
      steps: [
        "Expenses: Buat Grup (misal: Bulanan) lalu isi Sub-kategori (misal: Listrik).",
        "Income: Langsung buat kategori pemasukan (misal: Gaji).",
        "Kategori ini akan otomatis muncul saat Anda mencatat transaksi."
      ],
      color: "bg-purple-50"
    },
    {
      id: "transactions",
      title: "3. Mencatat Transaksi",
      icon: <PlusCircle className="text-emerald-500" size={24} />,
      content: "Inti dari aplikasi ini adalah mencatat setiap uang masuk dan keluar.",
      steps: [
        "Klik tombol + Transaksi di dashboard atau tombol tambah cepat.",
        "Pilih Tipe (Income/Expense/Transfer).",
        "Pilih Kategori dan Akun yang digunakan.",
        "Masukkan jumlah dan keterangan jika perlu.",
        "Klik Simpan untuk menambah data."
      ],
      color: "bg-emerald-50"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
            <BookOpen size={48} className="text-sky-400" />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-black mb-2">Pusat Bantuan</h2>
            <p className="text-slate-300">
              Pelajari cara mengoptimalkan pencatatan keuangan Anda dengan langkah-langkah mudah di bawah ini.
            </p>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Guide Sections */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        {sections.map((section) => (
          <div key={section.id} className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transform transition-all hover:scale-[1.01]">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-2xl ${section.color}`}>
                  {section.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800">{section.title}</h3>
              </div>
              
              <p className="text-slate-500 mb-6 font-medium">
                {section.content}
              </p>

              <div className="space-y-3">
                {section.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <CheckCircle size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-semibold">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="text-amber-500" size={24} />
            <h4 className="font-bold text-amber-800">Tips Hemat</h4>
          </div>
          <p className="text-sm text-amber-700 leading-relaxed">
            Gunakan fitur <strong>Transfer</strong> untuk memindahkan uang antar akun tanpa mempengaruhi total kekayaan Anda (misal: Tarik Tunai dari ATM).
          </p>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="text-indigo-500" size={24} />
            <h4 className="font-bold text-indigo-800">Cek Bot Telegram</h4>
          </div>
          <p className="text-sm text-indigo-700 leading-relaxed">
            Hubungkan akun Anda dengan Telegram untuk mencatat transaksi lebih cepat langsung dari chat! Buka menu <strong>Telegram Bot</strong> untuk mulai.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center pb-8">
        <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full text-xs font-bold text-slate-500 uppercase tracking-widest">
          <ShieldCheck size={14} /> Keamanan Data Terjamin
        </div>
      </div>
    </div>
  );
};
