import React, { useState } from 'react';

const TransactionForm = ({ user }) => {
    const [formData, setFormData] = useState({
        date: (() => {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })(),
        type: 'expense',
        category: '',
        amount: '',
        description: '',
        payment_method: 'Cash',
        account: 'Main',
        status: 'done'
    });
    const [errors, setErrors] = useState({});

    const expenseCategories = {
        "Makanan": ["Makan & Minum", "Sarapan", "Jajan Harian"],
        "Transportasi": ["Transport Harian", "Bensin", "Parkir", "Ojol / Taksi Online"],
        "Tagihan": ["Listrik", "Internet", "Pulsa", "Air"],
        "Belanja": ["Belanja Bulanan", "Shopping", "Marketplace (Shopee, dll)"],
        "Hiburan": ["Hiburan", "Nongkrong", "Jalan-jalan"],
        "Kesehatan": ["Berobat", "Obat", "BPJS / Asuransi"],
        "Pendidikan": ["Sekolah", "Kursus", "Buku / Alat Tulis"],
        "Orang Tua": ["Listrik Orang Tua", "Pulsa Orang Tua", "Kebutuhan Harian", "Kesehatan", "Lainnya"],
        "Extra (Tak Terduga)": ["Hadiah", "Hadiah / Acara", "Acara", "Ulang Tahun", "Nikahan", "Keuangan", "Tabungan", "Investasi", "Hutang", "Piutang", "Cicilan / Hutang", "Tabungan anak", "Tabung Kita", "Lainnya"]
    };

    const incomeCategories = ["Saldo Awal", "Gaji", "Bonus", "Hadiah", "Penjualan", "Investasi", "Bunga Bank", "Piutang", "Hutang", "Lainnya"];

    const validate = () => {
        let tempErrors = {};
        if (!formData.date) tempErrors.date = "Date is required";
        if (!formData.category) tempErrors.category = "Category is required";
        if (!formData.amount) tempErrors.amount = "Amount is required";
        else if (formData.amount <= 0) tempErrors.amount = "Amount must be positive";

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            const payload = { ...formData, user_id: user?.id }; // Add user_id
            console.log("Transaction Payload:", payload);

            if (!user?.id) {
                alert("Session invalid. Please login again.");
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/transaction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();
                alert(data.message || "Transaction saved");
                // Reset form
                setFormData({ ...formData, amount: '', description: '' });
            } catch (err) {
                console.error("Error:", err);
                alert("Failed to save transaction");
            }
        }
    };

    const [categoryGroup, setCategoryGroup] = useState(''); // Only for UX, not sent to DB directly if we only need the specific item

    const handleGroupChange = (e) => {
        setCategoryGroup(e.target.value);
        setFormData({ ...formData, category: '' }); // Reset sub-category when group changes
    };

    return (
        <div className="card">
            <h2 className="text-2xl font-bold text-finance-primary mb-6 text-center">New Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="label-text">Date</label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="input-field"
                    />
                    {errors.date && <p className="error-msg">{errors.date}</p>}
                </div>

                <div>
                    <label className="label-text">Type</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="income"
                                checked={formData.type === 'income'}
                                onChange={(e) => {
                                    handleChange(e);
                                    setCategoryGroup(''); // Reset group on type switch
                                }}
                                className="w-4 h-4 text-finance-accent focus:ring-finance-accent"
                            />
                            Income
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="expense"
                                checked={formData.type === 'expense'}
                                onChange={(e) => {
                                    handleChange(e);
                                    setCategoryGroup(''); // Reset group on type switch
                                }}
                                className="w-4 h-4 text-finance-danger focus:ring-finance-danger"
                            />
                            Expense
                        </label>
                    </div>
                </div>

                {formData.type === 'expense' ? (
                    <>
                        {/* Main Category Dropdown */}
                        <div>
                            <label className="label-text">Main Category</label>
                            <select
                                value={categoryGroup}
                                onChange={handleGroupChange}
                                className="input-field"
                            >
                                <option value="">Select Main Category</option>
                                {Object.keys(expenseCategories).map(group => (
                                    <option key={group} value={group}>{group}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sub Category Dropdown */}
                        <div>
                            <label className="label-text">Sub Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="input-field"
                                disabled={!categoryGroup}
                            >
                                <option value="">Select Sub Category</option>
                                {categoryGroup && expenseCategories[categoryGroup].map(item => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                            {errors.category && <p className="error-msg">{errors.category}</p>}
                        </div>
                    </>
                ) : (
                    // Income Dropdown (Single Level)
                    <div>
                        <label className="label-text">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="input-field"
                        >
                            <option value="">Select Category</option>
                            {incomeCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        {errors.category && <p className="error-msg">{errors.category}</p>}
                    </div>
                )}

                <div>
                    <label className="label-text">Nominal (Rp)</label>
                    <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="0"
                    />
                    {errors.amount && <p className="error-msg">{errors.amount}</p>}
                </div>

                <div>
                    <label className="label-text">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="input-field"
                        rows="3"
                        placeholder="Add notes..."
                    ></textarea>
                </div>

                {/* Additional Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="label-text">Payment Method</label>
                        <select
                            name="payment_method"
                            value={formData.payment_method}
                            onChange={handleChange}
                            className="input-field"
                        >
                            <option value="Cash">Cash</option>
                            <option value="Transfer">Transfer</option>
                            <option value="E-Wallet">E-Wallet</option>
                            <option value="Credit Card">Credit Card</option>
                        </select>
                    </div>

                    <div>
                        <label className="label-text">Account</label>
                        <select
                            name="account"
                            value={formData.account}
                            onChange={handleChange}
                            className="input-field"
                        >
                            <option value="Main">Main</option>
                            <option value="Bank BCA">Bank BCA</option>
                            <option value="Bank Mandiri">Bank Mandiri</option>
                            <option value="Gopay">Gopay</option>
                            <option value="OVO">OVO</option>
                            <option value="Dana">Dana</option>
                        </select>
                    </div>

                    <div>
                        <label className="label-text">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="input-field"
                        >
                            <option value="done">Done</option>
                            <option value="pending">Not Yet / Pending</option>
                        </select>
                    </div>
                </div>

                <button type="submit" className="btn-primary mt-4">
                    Save Transaction
                </button>
            </form>
        </div>
    );
};

export default TransactionForm;
