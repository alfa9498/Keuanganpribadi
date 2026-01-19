import React, { useState } from 'react';

const FilterForm = () => {
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        type: 'all'
    });

    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleFilter = async () => {
        console.log("Filter Payload:", filters);
        try {
            const query = new URLSearchParams(filters).toString();
            const response = await fetch(`http://localhost:5000/transaction?${query}`);
            const data = await response.json();
            console.log("Filtered Data:", data);
            alert(`Found ${data.data.length} transactions (Check Console)`);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="card w-full max-w-4xl"> {/* Wider card for report */}
            <h2 className="text-2xl font-bold text-finance-primary mb-6">Transaction Report</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                    <label className="label-text">Start Date</label>
                    <input
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleChange}
                        className="input-field"
                    />
                </div>
                <div>
                    <label className="label-text">End Date</label>
                    <input
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleChange}
                        className="input-field"
                    />
                </div>
                <div>
                    <label className="label-text">Type</label>
                    <select
                        name="type"
                        value={filters.type}
                        onChange={handleChange}
                        className="input-field"
                    >
                        <option value="all">All Transactions</option>
                        <option value="income">Income Only</option>
                        <option value="expense">Expense Only</option>
                    </select>
                </div>
                <button
                    onClick={handleFilter}
                    className="btn-primary h-[50px]"
                >
                    Filter Data
                </button>
            </div>

            <div className="mt-8 text-center text-slate-500 text-sm italic">
                (Result list would appear here based on filter)
            </div>
        </div>
    );
};

export default FilterForm;
