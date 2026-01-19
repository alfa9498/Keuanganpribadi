import React, { useState } from 'react';

const LoginForm = ({ onLoginSuccess }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});

    const validate = () => {
        let tempErrors = {};
        if (!formData.email) tempErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) tempErrors.email = "Email is invalid";

        if (!formData.password) tempErrors.password = "Password is required";

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            console.log("Login Payload:", formData);
            // Example POST request
            try {
                const response = await fetch('http://localhost:5000/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const data = await response.json();
                console.log("Response:", data);

                if (response.ok) {
                    alert(data.message || "Login submitted");
                    if (onLoginSuccess) onLoginSuccess(data.user); // Trigger callback
                } else {
                    alert(data.message || "Login failed");
                }
            } catch (err) {
                console.error("Error:", err);
                alert("Login failed to connect");
            }
        }
    };

    return (
        <div className="card">
            <h2 className="text-2xl font-bold text-finance-primary mb-6 text-center">Welcome Back</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="label-text">Email Address</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`input-field ${errors.email ? 'border-finance-danger ring-1 ring-finance-danger' : ''}`}
                        placeholder="you@example.com"
                    />
                    {errors.email && <p className="error-msg">{errors.email}</p>}
                </div>
                <div>
                    <label className="label-text">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`input-field ${errors.password ? 'border-finance-danger ring-1 ring-finance-danger' : ''}`}
                        placeholder="••••••••"
                    />
                    {errors.password && <p className="error-msg">{errors.password}</p>}
                </div>
                <button type="submit" className="btn-primary mt-4">
                    Sign In
                </button>
            </form>
        </div>
    );
};

export default LoginForm;
