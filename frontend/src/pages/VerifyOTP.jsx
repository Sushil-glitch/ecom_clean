import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Loader2, RefreshCw, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";

import { AUTH_API_URL } from "../config/api";
import { toast } from "../utils/toast.js";

const RESEND_COOLDOWN = 60; // 60 seconds
const MAX_RESENDS = 3;

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const emailFromState = location.state?.email || "";

  const storedEmail =
    sessionStorage.getItem("resetEmail") ||
    localStorage.getItem("resetEmail") ||
    emailFromState;

  const [email] = useState(storedEmail.toLowerCase().trim());
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [resendCount, setResendCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Countdown effect
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // =====================================================
  // VERIFY OTP
  // =====================================================
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!email) {
      const msg = "Email information is missing. Please start again.";
      setErrorMessage(msg);
      toast.error(msg);

      setTimeout(() => {
        navigate("/forgot-password", { replace: true });
      }, 1500);

      return;
    }

    if (!otp) {
      const msg = "Please enter the OTP.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (otp.length < 4) {
      const msg = "Please enter a valid 6-digit OTP.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${AUTH_API_URL}/verify-otp`, {
        email,
        otp: otp.trim(),
      });

      if (response.data?.success) {
        const msg = response.data?.message || "OTP verified successfully.";
        setSuccessMessage(msg);
        toast.success(msg);

        sessionStorage.setItem("resetEmail", email);
        localStorage.setItem("resetEmail", email);

        setTimeout(() => {
          navigate("/reset-password", { replace: true });
        }, 800);
      } else {
        const failMsg = response.data?.message || "OTP verification failed.";
        setErrorMessage(failMsg);
        toast.error(failMsg);
      }
    } catch (error) {
      console.error("VERIFY OTP ERROR:", error);
      const errMsg = error.response?.data?.message || "Invalid or expired OTP.";
      setErrorMessage(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RESEND OTP
  // =====================================================
  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    if (resendCount >= MAX_RESENDS) {
      const limitMsg = "Maximum resend attempts reached. Please wait or contact support.";
      setErrorMessage(limitMsg);
      toast.error(limitMsg);
      return;
    }

    try {
      setResending(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await axios.post(`${AUTH_API_URL}/forgot-password`, {
        email,
      });

      if (response.data?.success) {
        setResendCount((prev) => prev + 1);
        setCountdown(RESEND_COOLDOWN);
        const msg = "A new verification code has been sent to your email.";
        setSuccessMessage(msg);
        toast.success(msg);
      } else {
        const failMsg = response.data?.message || "Unable to resend OTP. Please try again.";
        setErrorMessage(failMsg);
        toast.error(failMsg);
      }
    } catch (error) {
      const errText = error.response?.data?.message || "Failed to resend OTP. Please try again.";
      setErrorMessage(errText);
      toast.error(errText);
    } finally {
      setResending(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          {/* ICON */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ShieldCheck size={28} />
          </div>

          {/* HEADER */}
          <div className="mt-5 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Verify OTP
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Enter the 6-digit verification code sent to
            </p>

            {email && (
              <p className="mt-1 text-xs font-semibold text-slate-700 bg-slate-100 py-1 px-3 rounded-full inline-block">
                {email}
              </p>
            )}
          </div>

          {/* ERROR */}
          {errorMessage && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-medium text-rose-700" role="alert">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SUCCESS */}
          {successMessage && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-medium text-emerald-700" role="status">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleVerifyOTP} className="mt-6 space-y-4">
            <div>
              <label htmlFor="otp-input" className="sr-only">Enter 6-digit verification code</label>
              <input
                id="otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  )
                }
                disabled={loading}
                className="
                  w-full
                  rounded-2xl
                  border
                  border-slate-300
                  px-5
                  py-3.5
                  text-center
                  text-xl
                  font-bold
                  tracking-[0.4em]
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                  disabled:bg-slate-100
                "
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="
                w-full
                rounded-xl
                bg-blue-600
                px-5
                py-3.5
                text-sm
                font-bold
                text-white
                shadow-sm
                transition
                hover:bg-blue-700
                disabled:cursor-not-allowed
                disabled:opacity-50
                flex items-center justify-center gap-2
              "
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </button>
          </form>

          {/* RESEND TIMER & ACTION */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            {countdown > 0 ? (
              <p className="text-xs text-slate-500">
                Resend code in <span className="font-bold text-slate-800 font-mono">{countdown}s</span>
              </p>
            ) : resendCount >= MAX_RESENDS ? (
              <p className="text-xs text-rose-600 font-medium">
                Maximum resend limit reached. Please wait a few minutes before trying again.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
              >
                {resending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Resending...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} /> Resend OTP ({MAX_RESENDS - resendCount} attempts left)
                  </>
                )}
              </button>
            )}
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              disabled={loading}
              className="
                inline-flex items-center gap-1.5
                text-xs
                font-semibold
                text-slate-500
                hover:text-blue-600
                transition
              "
            >
              <ArrowLeft size={14} /> Back to Forgot Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;