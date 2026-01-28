import React, { useState } from 'react';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { FormField } from '../molecules/FormField';
import { API_URL } from '../../config/api';


export const ResetPasswordOrganism = ({ email, otp, onSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            return setError("Password tidak cocok!");
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword: password })
            });

            const result = await response.json();

            if (response.ok) {
                alert("Password berhasil diubah, silakan login.");
                onSuccess();
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError("Gagal mereset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-green-500">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-800">Reset Password</h2>
                    <p className="text-slate-500 mt-2">Masukkan password baru Anda</p>
                </div>

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <FormField
                        label="Password Baru"
                        type="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    <FormField
                        label="Konfirmasi Password"
                        type="password"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    <Button type="submit" variant="primary" className="w-full py-3 bg-green-600 hover:bg-green-700 border-none" disabled={loading}>
                        {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
                    </Button>
                </form>
            </Card>
        </div>
    );
};
