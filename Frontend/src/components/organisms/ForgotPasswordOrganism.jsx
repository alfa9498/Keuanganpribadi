import React, { useState } from 'react';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { FormField } from '../molecules/FormField';
import { API_URL } from '../../config/api';


export const ForgotPasswordOrganism = ({ onSwitchToLogin, onSuccess }) => {
    const [formData, setFormData] = useState({
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const response = await fetch(`${API_URL}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                setMessage(result.message);
                setTimeout(() => {
                    // Navigate to Verify OTP
                    onSuccess(formData.email);
                }, 1500);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError("Gagal terhubung ke server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-yellow-500">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-800">Lupa Password</h2>
                    <p className="text-slate-500 mt-2">Masukkan Email dan No. HP untuk reset</p>
                </div>

                {message && (
                    <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-center">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <FormField
                        label="Email Terdaftar"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="email@anda.com"
                        required
                    />

                    <FormField
                        label="No. Handphone (WhatsApp)"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="0812..."
                        required
                    />

                    <Button type="submit" variant="primary" className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 border-none" disabled={loading}>
                        {loading ? 'Mengirim OTP...' : 'Kirim Kode OTP'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    Ingat password?{' '}
                    <button onClick={onSwitchToLogin} className="text-finance-primary font-bold hover:underline">
                        Login kembali
                    </button>
                </div>
            </Card>
        </div>
    );
};
