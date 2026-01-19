import React, { useState } from 'react';

const RegisterForm = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});

    const validate = () => {
        let tempErrors = {};
        if (!formData.fullName) tempErrors.fullName = "Full Name is required";
        if (!formData.email) tempErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) tempErrors.email = "Email is invalid";

        if (!formData.phone) tempErrors.phone = "Phone Number is required";

        if (!formData.password) tempErrors.password = "Password is required";
        if (formData.password.length < 6) tempErrors.password = "Password must be at least 6 chars";

        if (formData.password !== formData.confirmPassword) tempErrors.confirmPassword = "Passwords do not match";

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            console.log("Register Payload:", formData);
            try {
                const response = await fetch('http://localhost:5000/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const data = await response.json();
                alert(data.message || "Registration submitted");
            } catch (err) {
                console.error("Error:", err);
                alert("Registration failed to connect");
            }
        }
    };

    return (
        <div className="card">
            <h2 className="text-2xl font-bold text-finance-primary mb-6 text-center">Create Account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="label-text">Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="John Doe"
                    />
                    {errors.fullName && <p className="error-msg">{errors.fullName}</p>}
                </div>
                <div>
                    <label className="label-text">Email Address</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="john@example.com"
                    />
                    {errors.email && <p className="error-msg">{errors.email}</p>}
                </div>
                <div>
                    <label className="label-text">Phone Number</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="08123456789"
                    />
                    {errors.phone && <p className="error-msg">{errors.phone}</p>}
                </div>
                <div>
                    <label className="label-text">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="input-field"
                    />
                    {errors.password && <p className="error-msg">{errors.password}</p>}
                </div>
                <div>
                    <label className="label-text">Confirm Password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="input-field"
                    />
                    {errors.confirmPassword && <p className="error-msg">{errors.confirmPassword}</p>}
                </div>
                <button type="submit" className="btn-primary mt-4">
                    Register
                </button>
            </form>
        </div>
    );
};

export default RegisterForm;
