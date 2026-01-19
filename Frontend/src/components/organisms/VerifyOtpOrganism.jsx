import React, { useState } from 'react';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { FormField } from '../molecules/FormField';

export const VerifyOtpOrganism = ({ email, onSuccess, onBack }) => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:5000/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });

            const result = await response.json();

            if (response.ok) {
                onSuccess(otp); // Pass OTP to next step (Reset Password)
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError("Gagal verifikasi OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-yellow-500">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-800">Verifikasi OTP</h2>
                    <p className="text-slate-500 mt-2">Cek Email/WhatsApp untuk kode OTP</p>
                </div>

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <FormField
                        label="Kode OTP"
                        type="text"
                        name="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        required
                        className="text-center tracking-widest text-2xl"
                    />

                    <Button type="submit" variant="primary" className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 border-none" disabled={loading}>
                        {loading ? 'Memverifikasi...' : 'Verifikasi OTP'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    <button onClick={onBack} className="text-slate-400 font-bold hover:underline">
                        Kembali
                    </button>
                </div>
            </Card>
        </div>
    );
};
