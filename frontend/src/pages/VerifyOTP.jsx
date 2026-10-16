import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import { AUTH_API_URL } from "../config/api";
import { toast } from "../utils/toast.js";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const emailFromState =
    location.state?.email || "";

  const storedEmail =
    sessionStorage.getItem("resetEmail") ||
    localStorage.getItem("resetEmail") ||
    emailFromState;

  const [email] = useState(
    storedEmail.toLowerCase().trim()
  );

  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

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
        navigate("/forgot-password", {
          replace: true,
        });
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

      const response = await axios.post(
        `${AUTH_API_URL}/verify-otp`,
        {
          email,
          otp: otp.trim(),
        }
      );

      if (response.data?.success) {
        const msg = response.data?.message || "OTP verified successfully.";
        setSuccessMessage(msg);
        toast.success(msg);

        sessionStorage.setItem("resetEmail", email);
        localStorage.setItem("resetEmail", email);

        setTimeout(() => {
          navigate("/reset-password", {
            replace: true,
          });
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
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

          {/* HEADER */}

          <div className="text-center">

            <h1 className="text-2xl font-bold text-slate-900">
              Verify OTP
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Enter the OTP sent to your email
            </p>

            {email && (
              <p className="mt-2 text-xs font-medium text-slate-400">
                {email}
              </p>
            )}

          </div>

          {/* ERROR */}

          {errorMessage && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
              {errorMessage}
            </div>
          )}

          {/* SUCCESS */}

          {successMessage && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-600">
              {successMessage}
            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={handleVerifyOTP}
            className="mt-6 space-y-4"
          >

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter OTP"
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
                rounded-full
                border
                border-slate-300
                px-5
                py-3
                text-center
                text-lg
                tracking-[0.35em]
                outline-none
                transition
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
                disabled:bg-slate-100
              "
            />

            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                rounded-full
                bg-blue-600
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-blue-700
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {loading
                ? "Verifying..."
                : "Verify OTP"}
            </button>

          </form>

          <button
            type="button"
            onClick={() =>
              navigate("/forgot-password")
            }
            disabled={loading}
            className="
              mt-5
              w-full
              text-center
              text-sm
              font-medium
              text-slate-500
              hover:text-blue-600
            "
          >
            Back to Forgot Password
          </button>

        </div>

      </div>

    </div>
  );
};

export default VerifyOTP;