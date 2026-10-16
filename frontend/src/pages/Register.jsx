import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import { AUTH_API_URL } from "../config/api";
import { toast } from "../utils/toast.js";

import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";


const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedVal = value;
    if (name === "contact") {
      updatedVal = value.replace(/\D/g, "").slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: updatedVal,
    }));

    if (error) {
      setError("");
    }

    if (message) {
      setMessage("");
    }
  };

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // ==========================================
  // VALIDATION
  // ==========================================
  const validate = () => {
    const name = formData.name.trim();
    const contact = formData.contact.trim();
    const email = formData.email.trim();
    const password = formData.password;

    if (!name || !contact || !email || !password) {
      return "All fields are required.";
    }

    if (name.length < 2) {
      return "Name must be at least 2 characters.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }

    if (!/^[6-9]\d{9}$/.test(contact)) {
      return "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.";
    }

    if (!agreedToTerms) {
      return "You must agree to the Terms of Service and Privacy Policy to create an account.";
    }

    return "";
  };

  // ==========================================
  // REGISTER
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${AUTH_API_URL}/register`,
        {
          name: formData.name.trim(),
          contact: formData.contact.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }
      );

      if (response.data?.requiresConfirmation) {
        const successMsg = response.data?.message || "Registration submitted! Your driver account is pending Admin confirmation.";
        setMessage(successMsg);
        toast.success(successMsg);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }

      if (response.data?.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("role", response.data.role || "client");
        localStorage.setItem("user", JSON.stringify(response.data.user || {}));
        window.dispatchEvent(new Event("userUpdated"));
      }

      const successMsg = response.data?.message || "Account created successfully!";
      setMessage(successMsg);
      toast.success(successMsg);

      const role = response.data?.role;
      const targetRoute = role === "admin" ? "/admin" : role === "delivery" ? "/delivery" : "/client";

      setTimeout(() => {
        navigate(targetRoute);
      }, 1200);
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      const errMsg = err.response?.data?.message || "Registration failed. Please try again.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4 py-10 transition-colors duration-200">

      <div className="w-full max-w-md">

        {/* ======================================
            HEADER
        ====================================== */}
        <div className="flex flex-col items-center mb-8">

          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <UserPlus
              size={30}
              className="text-white"
            />
          </div>

          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            Create an account
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Join us and get started today.
          </p>

        </div>

        {/* ======================================
            REGISTER CARD
        ====================================== */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">

          {/* SUCCESS MESSAGE */}
          {message && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

              <CheckCircle2
                size={18}
                className="mt-0.5 flex-shrink-0"
              />

              <span>{message}</span>

            </div>
          )}

          {/* ERROR MESSAGE */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

              <AlertCircle
                size={18}
                className="mt-0.5 flex-shrink-0"
              />

              <span>{error}</span>

            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* ==================================
                NAME
            ================================== */}
            <div>

              <label
                htmlFor="name"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Full Name
              </label>

              <div className="relative">

                <User
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
                />

              </div>

            </div>

            {/* ==================================
                CONTACT
            ================================== */}
            <div>

              <label
                htmlFor="contact"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Contact Number
              </label>

              <div className="relative">

                <Phone
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="contact"
                  type="tel"
                  name="contact"
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  value={formData.contact}
                  onChange={handleChange}
                  autoComplete="tel"
                  inputMode="numeric"
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
                />

              </div>

            </div>

            {/* ==================================
                EMAIL
            ================================== */}
            <div>

              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Email Address
              </label>

              <div className="relative">

                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
                />

              </div>

            </div>

            {/* ==================================
                PASSWORD
            ================================== */}
            <div>

              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Password
              </label>

              <div className="relative">

                <Lock
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={loading}
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>

              {/* Password strength & hints */}
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <p>Must be at least 8 characters long.</p>
                {formData.password && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          formData.password.length >= 10 && /[0-9]/.test(formData.password) && /[^A-Za-z0-9]/.test(formData.password)
                            ? "w-full bg-emerald-500"
                            : formData.password.length >= 8 && /[0-9]/.test(formData.password)
                            ? "w-2/3 bg-blue-500"
                            : "w-1/3 bg-amber-500"
                        }`}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600">
                      {formData.password.length >= 10 && /[0-9]/.test(formData.password) && /[^A-Za-z0-9]/.test(formData.password)
                        ? "Strong"
                        : formData.password.length >= 8 && /[0-9]/.test(formData.password)
                        ? "Good"
                        : "Weak"}
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* ==================================
                TERMS & PRIVACY CONSENT CHECKBOX
            ================================== */}
            <div className="flex items-start gap-3 pt-1">
              <input
                id="agree-terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={loading}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="agree-terms" className="text-xs text-slate-600 leading-relaxed cursor-pointer select-none">
                I agree to ElectroZone's{" "}
                <Link to="/terms-of-service" target="_blank" className="text-blue-600 underline font-semibold hover:text-blue-700">
                  Terms of Service
                </Link>{" "}
                and acknowledge the{" "}
                <Link to="/privacy-policy" target="_blank" className="text-blue-600 underline font-semibold hover:text-blue-700">
                  Privacy Policy
                </Link>.
              </label>
            </div>

            {/* ==================================
                REGISTER BUTTON
            ================================== */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
            >

              {loading ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />

                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={19} />

                  Create Account
                </>
              )}

            </button>

          </form>

          {/* ======================================
              LOGIN
          ====================================== */}
          <div className="mt-7 pt-6 border-t border-slate-100 text-center">

            <p className="text-sm text-slate-500">
              Already have an account?
            </p>

            <Link
              to="/login"
              className="inline-block mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              Sign in
            </Link>

          </div>

        </div>

        {/* ======================================
            BACK HOME
        ====================================== */}
        <div className="text-center mt-6">

          <Link
            to="/"
            className="text-sm text-slate-500 hover:text-blue-600 transition"
          >
            ← Back to home
          </Link>

        </div>

      </div>

    </div>
  );
};

export default Register;