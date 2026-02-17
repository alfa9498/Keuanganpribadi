import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { FormField } from "../molecules/FormField";
import { useNotification } from "../../context/NotificationContext";
import { API_URL } from "../../config/api";

export const RegisterFormOrganism = ({
  onRegisterSuccess,
  onSwitchToLogin,
}) => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "male",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validate = () => {
    let newErrors = {};
    if (!formData.fullName) newErrors.fullName = "Full name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        showNotification("Pendaftaran berhasil! Silakan login.", "success");
        onRegisterSuccess();
      } else {
        showNotification(result.message || "Pendaftaran gagal", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Gagal terhubung ke server", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-3 md:mb-5">
        <div className="inline-flex items-center justify-center p-1.5 bg-sky-500/10 rounded-xl border border-sky-500/20 mb-2">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-8 h-8 object-contain"
            onError={(e) => (e.target.style.display = "none")}
          />
          <div className="text-sky-500 font-black text-xl tracking-tighter">
            FinVeda
          </div>
        </div>
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
          Create Account
        </h2>
        <p className="text-slate-400 mt-1 text-[11px] md:text-xs">
          Join the elite financial community
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-1.5 md:space-y-2">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Full Name
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            className={`w-full bg-slate-950/50 border ${errors.fullName ? "border-rose-500/50" : "border-white/5"} rounded-xl px-4 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 transition-all text-xs`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className={`w-full bg-slate-950/50 border ${errors.email ? "border-rose-500/50" : "border-white/5"} rounded-xl px-4 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 transition-all text-xs`}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0812..."
              className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 transition-all text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full h-[34px] bg-slate-950/50 border border-white/5 rounded-xl px-4 py-0 text-white focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 transition-all text-xs appearance-none"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full bg-slate-950/50 border ${errors.password ? "border-rose-500/50" : "border-white/5"} rounded-xl px-4 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 transition-all text-xs pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full bg-slate-950/50 border ${errors.confirmPassword ? "border-rose-500/50" : "border-white/5"} rounded-xl px-4 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 transition-all text-xs pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-sky-500/20 transition-all active:scale-95 mt-2"
          disabled={loading}
        >
          {loading ? "Registering..." : "Complete Registration"}
        </Button>
      </form>

      <div className="mt-3 md:mt-4 text-center">
        <p className="text-slate-500 text-[11px] md:text-xs">
          Already a member?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-white font-black hover:text-sky-400 transition-colors"
          >
            Sign In Now
          </button>
        </p>
      </div>
    </div>
  );
};
