import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Mail,
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

import { AUTH_API_URL } from "../config/api";
import { toast } from "../utils/toast.js";

const ForgetPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // =====================================================
  // SEND OTP
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    // ===================================================
    // VALIDATION
    // ===================================================

    if (!normalizedEmail) {
      const msg = "Please enter your email address.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!emailRegex.test(normalizedEmail)) {
      const msg = "Please enter a valid email address.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${AUTH_API_URL}/forgot-password`,
        {
          email: normalizedEmail,
        }
      );

      if (response.data?.success) {
        const msg = response.data.message || "Password reset OTP has been sent to your email.";
        setSuccessMessage(msg);
        toast.success(msg);

        sessionStorage.setItem("resetEmail", normalizedEmail);

        setTimeout(() => {
          navigate("/verify-otp", {
            replace: true,
            state: {
              email: normalizedEmail,
            },
          });
        }, 800);

        return;
      }

      const failMsg = response.data?.message || "Unable to send password reset OTP.";
      setErrorMessage(failMsg);
      toast.error(failMsg);
    } catch (error) {
      console.error("FORGOT PASSWORD ERROR:", error);
      const errText = error.response?.data?.message || (error.request ? "Unable to connect to the server. Please try again." : "Something went wrong. Please try again.");
      setErrorMessage(errText);
      toast.error(errText);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">

      <div className="mx-auto flex min-h-[85vh] max-w-md items-center justify-center">

        <div className="w-full">

          {/* =================================================
              CARD
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            {/* =================================================
                ICON
            ================================================= */}

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ShieldCheck size={30} />
            </div>

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mt-6 text-center">

              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Forgot Password?
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter the email address associated with
                your account and we'll send you a
                verification OTP.
              </p>

            </div>

            {/* =================================================
                ERROR MESSAGE
            ================================================= */}

            {errorMessage && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">

                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0 text-red-500"
                />

                <p className="text-sm font-medium leading-5 text-red-700">
                  {errorMessage}
                </p>

              </div>
            )}

            {/* =================================================
                SUCCESS MESSAGE
            ================================================= */}

            {successMessage && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">

                <CheckCircle2
                  size={19}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <p className="text-sm font-medium leading-5 text-emerald-700">
                  {successMessage}
                </p>

              </div>
            )}

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >

              {/* EMAIL */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={loading}
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      py-3
                      pl-10
                      pr-4
                      text-sm
                      text-slate-900
                      outline-none
                      transition
                      placeholder:text-slate-400
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-50
                      disabled:cursor-not-allowed
                      disabled:bg-slate-50
                    "
                  />

                </div>

              </div>

              {/* =================================================
                  SUBMIT
              ================================================= */}

              <button
                type="submit"
                disabled={loading}
                className="
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-blue-600
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-blue-700
                  focus:outline-none
                  focus:ring-4
                  focus:ring-blue-100
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >

                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Send size={18} />

                    Send Reset OTP
                  </>
                )}

              </button>

            </form>

            {/* =================================================
                SECURITY NOTE
            ================================================= */}

            <div className="mt-6 rounded-xl bg-slate-50 p-4">

              <div className="flex items-start gap-3">

                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-blue-600"
                />

                <div>

                  <p className="text-sm font-semibold text-slate-800">
                    Secure Password Recovery
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    The verification code will be sent to
                    your registered email address and will
                    expire after 5 minutes.
                  </p>

                </div>

              </div>

            </div>

            {/* =================================================
                BACK TO LOGIN
            ================================================= */}

            <div className="mt-7 text-center">

              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                <ArrowLeft size={16} />

                Back to Login
              </Link>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ForgetPassword;
