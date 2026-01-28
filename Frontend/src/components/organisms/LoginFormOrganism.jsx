import React, { useState } from 'react';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { FormField } from '../molecules/FormField';
import { API_URL } from '../../config/api';


export const LoginFormOrganism = ({ onLoginSuccess, onSwitchToRegister, onForgotPassword }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                // Backend login returns 'user', register returns 'data'. Handle both.
                onLoginSuccess(result.user || result.data);
            } else {
                setError(result.message || 'Login failed');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-finance-primary">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-finance-primary">Welcome Back</h2>
                    <p className="text-slate-500 mt-2">Login to manage your finances</p>
                </div>

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <FormField
                        label="Email Address"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        required
                    />

                    <FormField
                        label="Password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                    />

                    <div className="text-right -mt-4 mb-6">
                        <button
                            type="button"
                            onClick={onForgotPassword}
                            className="text-sm text-finance-primary hover:underline font-semibold"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <Button type="submit" variant="primary" className="w-full py-3" disabled={loading}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    Don't have an account?{' '}
                    <button onClick={onSwitchToRegister} className="text-finance-primary font-bold hover:underline">
                        Register
                    </button>
                </div>
            </Card>
        </div>
    );
};
