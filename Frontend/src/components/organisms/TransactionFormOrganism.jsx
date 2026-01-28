import React, { useState, useEffect } from 'react';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { FormField } from '../molecules/FormField';
import { useNotification } from '../../context/NotificationContext';
import { API_URL } from '../../config/api';


const expenseCategories = {
    "Survival (Kebutuhan)": ["Makanan", "Makan & Minum", "Sarapan", "Jajan Harian", "Transportasi", "Transport Harian", "Bensin", "Parkir", "Ojol / Taksi Online", "pengeluaran Pulang", "Tagihan", "Listrik", "Internet", "Pulsa", "Air", "Tagihan Internet", "Biaya Admin", "Kesehatan", "Berobat", "Obat", "BPJS / Asuransi", "Sewa", "mobil", "motor", "kontrakan", "kosan", "Orang Tua", "Orang tua aa", "Orang tua neng", "Listrik Orang Tua", "Pulsa Orang Tua"],
    "Optional (Keinginan)": ["Belanja", "Belanja Bulanan", "Shopping", "shopee", "Laundry", "Marketplace (Shopee, dll)", "Hiburan", "Nongkrong", "Jalan-jalan"],
    "Culture (Kultur)": ["Pendidikan", "Sekolah", "Kursus", "Buku / Alat Tulis"],
    "Extra (Tak Terduga)": ["Hadiah", "Hadiah / Acara", "Acara", "Ulang Tahun", "Nikahan", "Keuangan", "Tabungan", "Investasi", "Hutang", "Piutang", "Cicilan / Hutang", "Tabungan anak", "Tabung Kita", "Lainnya"]
};

const incomeCategories = ["Saldo Awal", "Gaji", "Bonus", "Hadiah", "Penjualan", "Investasi", "Bunga Bank", "Piutang", "Hutang", "Lainnya"];

export const TransactionFormOrganism = ({ user, onSuccess, onCancel, initialData = null, isEdit = false, setSection }) => {
    const { showNotification } = useNotification();
    const formatDateForInput = (dateInput) => {
        if (!dateInput) return '';
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [formData, setFormData] = useState({
        date: initialData?.date ? formatDateForInput(initialData.date) : formatDateForInput(new Date()),
        type: initialData?.type || 'expense',
        category: initialData?.category || '',
        amount: initialData?.amount || '',
        description: initialData?.description || '',
        payment_method: initialData?.payment_method || 'Cash',
        account: initialData?.account || 'Cash Account',
        to_account: initialData?.to_account || '',
        status: initialData?.status || 'done'
    });

    // Helper to find category group
    const findCategoryGroup = (category) => {
        if (!category) return '';
        const foundGroup = Object.keys(expenseCategories).find(group =>
            expenseCategories[group].includes(category)
        );
        return foundGroup || '';
    };

    const [categoryGroup, setCategoryGroup] = useState('');

    // Auto-set category group on mount if editing
    useEffect(() => {
        if (isEdit && initialData?.category && initialData?.type === 'expense') {
            const foundGroup = Object.keys(expenseCategories).find(group =>
                expenseCategories[group].includes(initialData.category)
            );
            if (foundGroup) {
                setCategoryGroup(foundGroup);
            }
        }
    }, [initialData, isEdit]);

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'type') {
                updated.category = ''; // Reset category on type change
                setCategoryGroup(''); // Reset group on type change
            }
            if (name === 'category' && value === 'Saldo Awal') {
                updated.payment_method = 'Internal / Balance';
            }
            return updated;
        });
    };

    const handleGroupChange = (e) => {
        setCategoryGroup(e.target.value);
        setFormData(prev => ({ ...prev, category: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prepare payload with necessary defaults
        let payload = {
            ...formData,
            amount: Number(formData.amount), // Ensure number
            user_id: user.id
        };

        // Auto-set category for Transfer type
        if (payload.type === 'transfer') {
            payload.category = 'Transfer';
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

            const method = isEdit ? 'PUT' : 'POST';

            console.log(`Submitting to: ${url} [${method}]`, payload);

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
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
                        type: 'expense',
                        category: '',
                        amount: '',
                        description: '',
                        payment_method: 'Cash',
                        account: 'Cash Account',
                        to_account: '',
                        status: 'done'
                    });
                    setCategoryGroup('');
                }
                setErrors({});
                if (onSuccess) onSuccess(); // Trigger refresh/close
                showNotification(isEdit ? 'Transaksi berhasil diperbarui!' : 'Transaksi berhasil disimpan!', 'success');
            } else {
                console.error("Server Error:", result);
                showNotification(`Gagal menyimpan transaksi: ${result.message || 'Unknown Error'}`, 'error');
            }
        } catch (error) {
            console.error("Error submitting transaction:", error);
            showNotification(`Terjadi kesalahan koneksi: ${error.message}`, 'error');
        }
    };

    const formatRupiah = (value) => {
        if (!value) return '';
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleAmountChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, ''); // Remove non-digits
        setFormData(prev => ({ ...prev, amount: rawValue }));
    };

    return (
        <div className="flex justify-center w-full animate-fade-in">
            <Card className={`w-full ${!isEdit ? 'max-w-2xl border-t-8 border-t-finance-primary' : 'p-0 shadow-none border-0'}`}>
                {!isEdit && (
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-finance-primary">Add New Transaction</h2>
                    </div>
                )}

                <form onSubmit={handleSubmit} className={isEdit ? "space-y-3" : "space-y-5"}>

                    {/* Top Row: Date & Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            label="Transaction Date"
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                        />
                        <div className="space-y-1">
                            <FormField
                                label="Type"
                                component="select"
                                name="type"
                                value={formData.type}
                                onChange={(e) => {
                                    handleChange(e);
                                    setCategoryGroup(''); // Reset group on type switch
                                }}
                            >
                                <option value="expense">Expense (Pengeluaran)</option>
                                <option value="income">Income (Pemasukan)</option>
                                <option value="transfer">Pindah Saldo / Tarik Tunai</option>
                            </FormField>
                            {/* Type Description Helper */}
                            <div className="text-xs text-slate-500 px-1">
                                {formData.type === 'expense' && "Uang keluar untuk belanja/bayar (Harta berkurang)."}
                                {formData.type === 'income' && "Uang masuk/gaji (Harta bertambah)."}
                                {formData.type === 'transfer' && "Pindah uang antar akun/tarik tunai (Harta tetap)."}
                            </div>
                        </div>
                    </div>

                    {/* Amount */}
                    <FormField
                        label="Amount (Rp)"
                        type="text"
                        name="amount"
                        value={formatRupiah(formData.amount)}
                        onChange={handleAmountChange}
                        placeholder="0"
                        error={errors.amount}
                        className="text-lg font-semibold"
                    />

                    {/* Category Selection Logic */}
                    {formData.type === 'transfer' ? (
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                            <p className="text-sm font-medium text-blue-800 mb-2">Internal Transfer</p>
                            <p className="text-xs text-blue-600">This transaction will move money between your accounts.</p>
                        </div>
                    ) : formData.type === 'expense' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Main Category */}
                            <FormField
                                label="Main Category"
                                component="select"
                                value={categoryGroup}
                                onChange={handleGroupChange}
                            >
                                <option value="">Select Main Category</option>
                                {Object.keys(expenseCategories).map(group => (
                                    <option key={group} value={group}>{group}</option>
                                ))}
                            </FormField>

                            {/* Sub Category */}
                            <FormField
                                label="Sub Category"
                                component="select"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                error={errors.category}
                                disabled={!categoryGroup}
                            >
                                <option value="">Select Sub Category</option>
                                {categoryGroup && expenseCategories[categoryGroup].map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </FormField>
                        </div>
                    ) : (
                        <FormField
                            label="Category"
                            component="select"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            error={errors.category}
                        >
                            <option value="">Select Category</option>
                            {incomeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </FormField>
                    )}

                    {/* Description */}
                    <FormField
                        label="Description"
                        component="textarea"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Add notes..."
                        rows={1}
                    />

                    {/* Details Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {formData.type === 'transfer' ? (
                            <>
                                <FormField label="From Account" component="select" name="account" value={formData.account} onChange={handleChange} error={errors.account}>
                                    <option value="Cash Account">Cash Account</option>
                                    <option value="BCA">BCA</option>
                                    <option value="BNI">BNI</option>
                                    <option value="BSI">BSI</option>
                                    <option value="Muamalat">Muamalat</option>
                                    <option value="Permata">Permata</option>
                                    <option value="Mandiri">Mandiri</option>
                                    <option value="Gopay">Gopay</option>
                                    <option value="OVO">OVO</option>
                                    <option value="Dana">Dana</option>
                                    <option value="Bareksa">Bareksa</option>
                                    <option value="Treasury">Treasury</option>
                                    <option value="Tabungan BNI Anak">Tabungan BNI Anak</option>
                                </FormField>
                                <FormField label="To Account" component="select" name="to_account" value={formData.to_account} onChange={handleChange} error={errors.to_account}>
                                    <option value="">Select Destination</option>
                                    <option value="Cash Account">Cash Account</option>
                                    <option value="BCA">BCA</option>
                                    <option value="BNI">BNI</option>
                                    <option value="BSI">BSI</option>
                                    <option value="Muamalat">Muamalat</option>
                                    <option value="Permata">Permata</option>
                                    <option value="Mandiri">Mandiri</option>
                                    <option value="Gopay">Gopay</option>
                                    <option value="OVO">OVO</option>
                                    <option value="Dana">Dana</option>
                                    <option value="Bareksa">Bareksa</option>
                                    <option value="Treasury">Treasury</option>
                                    <option value="Tabungan BNI Anak">Tabungan BNI Anak</option>
                                </FormField>
                            </>
                        ) : (
                            <>
                                <FormField label="Payment Method" component="select" name="payment_method" value={formData.payment_method} onChange={handleChange}>
                                    <option value="Cash">Tunai (Cash)</option>
                                    <option value="Transfer">Transfer Bank</option>
                                    <option value="Debit">Kartu Debit</option>
                                    <option value="Credit Card">Kartu Kredit</option>
                                    <option value="QRIS">QRIS / E-Wallet</option>
                                    <option value="Internal / Balance">System / Saldo Awal</option>
                                </FormField>
                                <FormField label="Account" component="select" name="account" value={formData.account} onChange={handleChange}>
                                    <option value="Cash Account">Cash Account</option>
                                    <option value="BCA">BCA</option>
                                    <option value="BNI">BNI</option>
                                    <option value="BSI">BSI</option>
                                    <option value="Muamalat">Muamalat</option>
                                    <option value="Permata">Permata</option>
                                    <option value="Mandiri">Mandiri</option>
                                    <option value="Gopay">Gopay</option>
                                    <option value="OVO">OVO</option>
                                    <option value="Dana">Dana</option>
                                    <option value="Bareksa">Bareksa</option>
                                    <option value="Treasury">Treasury</option>
                                    <option value="Tabungan BNI Anak">Tabungan BNI Anak</option>
                                </FormField>
                            </>
                        )}

                        <FormField label="Status" component="select" name="status" value={formData.status} onChange={handleChange}>
                            <option value="done">Done</option>
                            <option value="pending">Not Yet / Pending</option>
                        </FormField>
                    </div>


                    <div className="flex gap-3 mt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600"
                            onClick={() => onCancel ? onCancel() : (setSection ? setSection('dashboard') : window.history.back())}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" className="flex-1">
                            {isEdit ? 'Update Transaction' : 'Save Transaction'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
