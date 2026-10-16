import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { AUTH_API_URL } from "../config/api.js";
import { toast } from "../utils/toast.js";
const API_URL = AUTH_API_URL;

const Login = () => {
  const navigate = useNavigate();

  // ==========================================
  // STATE
  // ==========================================
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // CHANGE HANDLER
  // ==========================================
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError("");
  };

  // ==========================================
  // SUBMIT HANDLER
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const email = formData.email.trim();
    if (!email) {
      const msg = "Email address is required.";
      setError(msg);
      toast.error(msg);
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      const msg = "Please enter a valid email address.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!formData.password) {
      const msg = "Password is required.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/login`,
        {
          email,
          password: formData.password,
        }
      );

      const { token, role, user } = response.data;

      // SAVE TOKEN + ROLE
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("userUpdated"));

      toast.success(`Welcome back, ${user?.name || "User"}!`);

      // REDIRECT BASED ON ROLE
      if (role === "admin") {
        navigate("/admin");
      } else if (role === "delivery") {
        navigate("/delivery");
      } else {
        navigate("/client");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Login failed. Please check your credentials.";
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-md">

        {/* ======================================
            LOGO / ICON
        ====================================== */}
        <div className="flex flex-col items-center mb-8">

          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <LogIn
              size={32}
              className="text-white"
            />
          </div>

          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to access your account.
          </p>

        </div>

        {/* ======================================
            LOGIN CARD
        ====================================== */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">

          {/* ERROR */}
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
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
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
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
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
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>

            </div>

            {/* ==================================
                FORGOT PASSWORD
            ================================== */}
            <div className="flex justify-end">

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
              >
                Forgot password?
              </Link>

            </div>

            {/* ==================================
                SIGN IN BUTTON
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
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={19} />
                  Sign In
                </>
              )}

            </button>

          </form>

          {/* ======================================
              REGISTER
          ====================================== */}
          <div className="mt-7 pt-6 border-t border-slate-100 text-center">

            <p className="text-sm text-slate-500">
              Don't have an account?
            </p>

            <Link
              to="/register"
              className="inline-block mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              Create an account
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

export default Login;

