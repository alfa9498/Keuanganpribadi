import React, { useState, useEffect } from "react";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { FormField } from "../molecules/FormField";
import { useNotification } from "../../context/NotificationContext";
import { API_URL } from "../../config/api";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Info,
  Layers,
  CreditCard,
  Calendar,
  Tag,
  Eye,
  Wallet,
} from "lucide-react";
import { fetchCategories } from "../../services/categoryService";

export const TransactionFormOrganism = ({
  user,
  onSuccess,
  onCancel,
  initialData = null,
  isEdit = false,
  setSection,
}) => {
  const { showNotification } = useNotification();
  const formatDateForInput = (dateInput) => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [accounts, setAccounts] = useState([]);
  const [categoriesData, setCategoriesData] = useState({
    expense: [],
    income: [],
  });
  const [categoryGroup, setCategoryGroup] = useState("");

  const [formData, setFormData] = useState({
    date: initialData?.date
      ? formatDateForInput(initialData.date)
      : formatDateForInput(new Date()),
    type: initialData?.type || "expense",
    category: initialData?.category || "",
    amount: initialData?.amount || "",
    description: initialData?.description || "",
    payment_method: initialData?.payment_method || "Cash",
    account: initialData?.account || "Cash Account",
    to_account: initialData?.to_account || "",
    status: initialData?.status || "done",
  });

  const [activeStep, setActiveStep] = useState(1);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      // Parallel Fetch
      const [accRes, catRes] = await Promise.all([
        fetch(`${API_URL}/accounts?user_id=${user.id}`, {
          credentials: "include",
        }),
        fetchCategories(),
      ]);

      if (accRes.ok) {
        const accResult = await accRes.json();
        setAccounts(accResult.data);
        if (accResult.data.length > 0 && !isEdit) {
          setFormData((prev) => ({
            ...prev,
            account: initialData?.account || accResult.data[0].name,
          }));
        }
      }

      setCategoriesData(catRes); // { expense: [], income: [] }

      // Logic for Edit Mode (Auto-set Group)
      if (isEdit && initialData?.category && initialData?.type === "expense") {
        const foundGroup = catRes.expense.find((group) =>
          group.subCategories.some((cat) => cat.name === initialData.category),
        );
        if (foundGroup) {
          setCategoryGroup(foundGroup.name);
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "type") {
        updated.category = ""; // Reset category on type change
        setCategoryGroup(""); // Reset group on type change
      }
      if (name === "category" && value === "Saldo Awal") {
        updated.payment_method = "Internal / Balance";
      }
      return updated;
    });
  };

  const handleGroupChange = (e) => {
    setCategoryGroup(e.target.value);
    setFormData((prev) => ({ ...prev, category: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare payload with necessary defaults
    let payload = {
      ...formData,
      amount: Number(formData.amount), // Ensure number
      user_id: user.id,
    };

    // Auto-set category for Transfer type
    if (payload.type === "transfer") {
      payload.category = "Transfer";
    }

    // Validation
    let newErrors = {};
    if (!payload.amount) newErrors.amount = "Amount is required";
    if (!payload.category) newErrors.category = "Category is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const url = isEdit
        ? `${API_URL}/transaction/${initialData.id}`
        : `${API_URL}/transaction`;

      const method = isEdit ? "PUT" : "POST";

      console.log(`Submitting to: ${url} [${method}]`, payload);

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      // Safely parse JSON
      let result;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        result = await response.json();
      } else {
        const text = await response.text();
        result = { message: text || response.statusText };
      }

      if (response.ok) {
        if (!isEdit) {
          setFormData({
            date: formatDateForInput(new Date()),
            type: "expense",
            category: "",
            amount: "",
            description: "",
            payment_method: "Cash",
            account: accounts.length > 0 ? accounts[0].name : "Cash Account",
            to_account: "",
            status: "done",
          });
          setCategoryGroup("");
        }
        setErrors({});
        if (onSuccess) onSuccess(); // Trigger refresh/close
        showNotification(
          isEdit
            ? "Transaksi berhasil diperbarui!"
            : "Transaksi berhasil disimpan!",
          "success",
        );
      } else {
        console.error("Server Error:", result);
        showNotification(
          `Gagal menyimpan transaksi: ${result.message || "Unknown Error"}`,
          "error",
        );
      }
    } catch (error) {
      console.error("Error submitting transaction:", error);
      showNotification(`Terjadi kesalahan koneksi: ${error.message}`, "error");
    }
  };

  const formatRupiah = (value) => {
    if (!value) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, ""); // Remove non-digits
    setFormData((prev) => ({ ...prev, amount: rawValue }));
  };

  // Helper to get active subcategories based on selected group
  const getActiveSubCategories = () => {
    const group = categoriesData.expense.find((g) => g.name === categoryGroup);
    return group ? group.subCategories : [];
  };

  const validateStep = (step) => {
    let newErrors = {};
    if (step === 1) {
      if (!formData.amount) newErrors.amount = "Nominal wajib diisi";
      if (!formData.date) newErrors.date = "Tanggal wajib diisi";
    } else if (step === 2) {
      if (formData.type !== "transfer" && !formData.category)
        newErrors.category = "Kategori wajib dipilih";
    } else if (step === 3) {
      if (!formData.account) newErrors.account = "Akun wajib dipilih";
      if (formData.type === "transfer" && !formData.to_account)
        newErrors.to_account = "Akun tujuan wajib dipilih";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 1));
  };

  const steps = [
    { id: 1, label: "Info", icon: <Info size={14} /> },
    { id: 2, label: "Kategori", icon: <Layers size={14} /> },
    { id: 3, label: "Akun", icon: <CreditCard size={14} /> },
    { id: 4, label: "Review", icon: <Eye size={14} /> },
  ];

  return (
    <div className="flex justify-center w-full animate-fade-in p-1 md:p-0">
      <Card
        className={`w-full overflow-hidden ${!isEdit ? "max-w-lg border-t-4 border-t-finance-primary shadow-xl" : "p-0 shadow-none border-0"}`}
      >
        {!isEdit && (
          <div className="p-3 md:p-4 pb-0">
            <div className="flex items-center justify-between mb-3 md:mb-5">
              <div>
                <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isEdit ? "Edit" : "Tambah"} Transaksi
                </h2>
                <p className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Step {activeStep} / 4: {steps[activeStep - 1].label}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-md md:rounded-lg transition-all duration-300 ${
                      activeStep === step.id
                        ? "bg-finance-primary text-white shadow-md shadow-finance-primary/20 scale-105"
                        : activeStep > step.id
                          ? "bg-emerald-500 text-white"
                          : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {activeStep > step.id ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      step.icon
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3 md:mb-5">
              <div
                className="h-full bg-finance-primary transition-all duration-700 ease-out shadow-[0_0_10px_rgba(var(--finance-primary-rgb),0.3)]"
                style={{ width: `${(activeStep / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-3 md:p-5 min-h-[220px] space-y-3 md:space-y-4">
            {/* STEP 1: Info Utama */}
            {activeStep === 1 && (
              <div className="space-y-4 md:space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <FormField
                    label="Pilih Tanggal"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    error={errors.date}
                    icon={<Calendar size={14} />}
                  />
                  <FormField
                    label="Jenis Transaksi"
                    component="select"
                    name="type"
                    value={formData.type}
                    onChange={(e) => {
                      handleChange(e);
                      setCategoryGroup("");
                    }}
                    icon={<Tag size={14} />}
                  >
                    <option value="expense">Pengeluaran (Uang Keluar)</option>
                    <option value="income">Pemasukan (Uang Masuk)</option>
                    <option value="transfer">Pindah Saldo / Tarik Tunai</option>
                  </FormField>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 md:p-6 rounded-2xl md:rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-inner">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">
                    Jumlah Nominal (IDR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xl md:text-3xl font-black text-slate-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      name="amount"
                      value={formatRupiah(formData.amount)}
                      onChange={handleAmountChange}
                      placeholder="0"
                      className={`w-full bg-transparent border-0 border-b-2 ${errors.amount ? "border-rose-500" : "border-slate-200 dark:border-slate-700"} focus:ring-0 focus:border-finance-primary transition-all px-9 md:px-12 py-2 md:py-4 text-2xl md:text-4xl font-black text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700`}
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-xs text-rose-500 font-bold mt-2 ml-1">
                      {errors.amount}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Klasifikasi */}
            {activeStep === 2 && (
              <div className="space-y-4 md:space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                {formData.type === "transfer" ? (
                  <div className="p-6 md:p-8 bg-blue-50 dark:bg-blue-900/20 rounded-2xl md:rounded-[32px] border border-blue-100 dark:border-blue-800 text-center space-y-2 md:space-y-3">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                      <ChevronRight
                        className="text-blue-600 dark:text-blue-400"
                        size={24}
                        md:size={32}
                      />
                    </div>
                    <h3 className="text-lg font-black text-blue-900 dark:text-blue-300 uppercase tracking-tight">
                      Internal Transfer
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      Otomatis diklasifikasikan sebagai perpindahan dana antar
                      akun.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {formData.type === "expense" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          label="Grup Utama"
                          component="select"
                          value={categoryGroup}
                          onChange={handleGroupChange}
                          icon={<Layers size={14} />}
                        >
                          <option value="">Pilih Grup</option>
                          {categoriesData.expense.map((group) => (
                            <option key={group.id} value={group.name}>
                              {group.name}
                            </option>
                          ))}
                        </FormField>
                        <FormField
                          label="Sub Kategori"
                          component="select"
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          error={errors.category}
                          disabled={!categoryGroup}
                          icon={<Tag size={14} />}
                        >
                          <option value="">Pilih Sub Kategori</option>
                          {getActiveSubCategories().map((cat) => (
                            <option key={cat.id} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </FormField>
                      </div>
                    ) : (
                      <FormField
                        label="Kategori Pemasukan"
                        component="select"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        error={errors.category}
                        icon={<Tag size={14} />}
                      >
                        <option value="">Pilih Kategori</option>
                        {categoriesData.income.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </FormField>
                    )}
                  </div>
                )}
                <FormField
                  label="Catatan / Deskripsi"
                  component="textarea"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Beli apa? Atau catatan tambahan..."
                  rows={2}
                  className="rounded-[24px]"
                />
              </div>
            )}

            {/* STEP 3: Detail Akun */}
            {activeStep === 3 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.type === "transfer" ? (
                    <>
                      <FormField
                        label="Dari Akun"
                        component="select"
                        name="account"
                        value={formData.account}
                        onChange={handleChange}
                        error={errors.account}
                        icon={<CreditCard size={14} />}
                      >
                        {accounts.map((acc) => (
                          <option key={`from-${acc.id}`} value={acc.name}>
                            {acc.name}
                          </option>
                        ))}
                      </FormField>
                      <FormField
                        label="Ke Akun"
                        component="select"
                        name="to_account"
                        value={formData.to_account}
                        onChange={handleChange}
                        error={errors.to_account}
                        icon={<ChevronRight size={14} />}
                      >
                        <option value="">Pilih Tujuan</option>
                        {accounts.map((acc) => (
                          <option key={`to-${acc.id}`} value={acc.name}>
                            {acc.name}
                          </option>
                        ))}
                      </FormField>
                    </>
                  ) : (
                    <>
                      <FormField
                        label="Metode Bayar"
                        component="select"
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleChange}
                      >
                        <option value="Cash">Tunai (Cash)</option>
                        <option value="Transfer">Transfer Bank</option>
                        <option value="Debit">Kartu Debit</option>
                        <option value="Credit Card">Kartu Kredit</option>
                        <option value="QRIS">QRIS / E-Wallet</option>
                        <option value="Internal / Balance">
                          System / Saldo Awal
                        </option>
                      </FormField>
                      <FormField
                        label="Akun"
                        component="select"
                        name="account"
                        value={formData.account}
                        onChange={handleChange}
                        icon={<CreditCard size={14} />}
                      >
                        {accounts.map((acc) => (
                          <option key={`acc-${acc.id}`} value={acc.name}>
                            {acc.name}
                          </option>
                        ))}
                      </FormField>
                    </>
                  )}
                </div>
                <FormField
                  label="Status Transaksi"
                  component="select"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="done">Selesai (Sudah Dibayar)</option>
                  <option value="pending">Tertunda / Belum Lunas</option>
                </FormField>
              </div>
            )}

            {/* STEP 4: Konfirmasi (Review) */}
            {activeStep === 4 && (
              <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50 text-center mb-2">
                  <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                    <CheckCircle2 size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Tinjau Transaksi
                    </span>
                  </div>
                  <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                    Rp {formatRupiah(formData.amount)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Tag size={12} />
                      <span className="text-[9px] font-bold uppercase">
                        Kategori
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                      {formData.type === "transfer"
                        ? "Internal Transfer"
                        : formData.category || "-"}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Wallet size={12} />
                      <span className="text-[9px] font-bold uppercase">
                        Sumber Akun
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                      {formData.account}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Calendar size={12} />
                      <span className="text-[9px] font-bold uppercase">
                        Tanggal
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {formData.date}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Layers size={12} />
                      <span className="text-[9px] font-bold uppercase">
                        Jenis
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 capitalize">
                      {formData.type}
                    </p>
                  </div>
                </div>

                {formData.description && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                      Catatan
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                      "{formData.description}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2 md:gap-3">
            <div className="flex gap-2 md:gap-3 flex-1">
              {activeStep === 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100 rounded-xl md:rounded-2xl h-12 md:h-14 font-black uppercase tracking-widest text-[9px] md:text-[10px]"
                  onClick={() =>
                    onCancel
                      ? onCancel()
                      : setSection
                        ? setSection("dashboard")
                        : window.history.back()
                  }
                >
                  Batal
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100 rounded-xl md:rounded-2xl h-12 md:h-14 font-black uppercase tracking-widest text-[9px] md:text-[10px] flex items-center justify-center gap-1 md:gap-2"
                  onClick={handleBack}
                >
                  <ChevronLeft size={14} md:size={16} />
                  Kembali
                </Button>
              )}

              {activeStep < 4 ? (
                <Button
                  type="button"
                  variant="primary"
                  className="flex-[2] h-11 md:h-12 rounded-lg md:rounded-xl font-black uppercase tracking-widest text-[9px] md:text-[10px] flex items-center justify-center gap-1 md:gap-2 shadow-lg shadow-finance-primary/20"
                  onClick={handleNext}
                >
                  Lanjut
                  <ChevronRight size={14} md:size={16} />
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-[2] h-11 md:h-12 rounded-lg md:rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black uppercase tracking-widest text-[9px] md:text-[10px] flex items-center justify-center gap-1 md:gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 size={14} md:size={16} />
                  {isEdit ? "Update" : "Simpan"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};
