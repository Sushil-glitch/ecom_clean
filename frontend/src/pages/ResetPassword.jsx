import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { AUTH_API_URL } from "../config/api";
import { toast } from "../utils/toast.js";

const ResetPassword = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // =====================================================
  // GET EMAIL FROM RESET FLOW
  // =====================================================

  const getResetEmail = () => {
    return (
      sessionStorage.getItem("resetEmail") ||
      localStorage.getItem("resetEmail") ||
      ""
    )
      .toLowerCase()
      .trim();
  };

  // =====================================================
  // RESET PASSWORD
  // =====================================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const email = getResetEmail();

    // =================================================
    // CHECK EMAIL
    // =================================================

    if (!email) {
      setErrorMessage(
        "Password reset session expired. Please start again."
      );

      setTimeout(() => {
        navigate("/forgot-password", {
          replace: true,
        });
      }, 1500);

      return;
    }

    // =================================================
    // VALIDATION
    // =================================================

    if (!password || !confirmPassword) {
      setErrorMessage(
        "Please enter both password fields."
      );

      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        "Password must be at least 6 characters."
      );

      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        "Passwords do not match."
      );

      return;
    }

    // =================================================
    // API REQUEST
    // =================================================

    try {
      setLoading(true);

      const response = await axios.post(
        `${AUTH_API_URL}/reset-password`,
        {
          email,
          password,
        }
      );

      if (response.data?.success) {
        const succMsg = response.data?.message || "Password reset & saved in Database successfully! Logging out...";
        setSuccessMessage(succMsg);
        toast.success(succMsg);

        // Clear all auth & reset session state
        sessionStorage.removeItem("resetEmail");
        localStorage.removeItem("resetEmail");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("userUpdated"));

        // Redirect to login to force sign in with new password
        setTimeout(() => {
          navigate("/login", {
            replace: true,
          });
        }, 1500);
      } else {
        setErrorMessage(
          response.data?.message ||
            "Password reset failed."
        );
      }
    } catch (error) {
      console.error(
        "RESET PASSWORD ERROR:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Password reset failed. Please try again."
      );
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
              Reset Password
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Enter your new password
            </p>

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
            onSubmit={handleResetPassword}
            className="mt-6 space-y-4"
          >

            {/* PASSWORD */}

            <div>

              <label
                htmlFor="password"
                className="sr-only"
              >
                New Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                disabled={loading}
                autoComplete="new-password"
                className="
                  w-full
                  rounded-full
                  border
                  border-slate-300
                  bg-white
                  px-5
                  py-3
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                  disabled:bg-slate-100
                "
              />

            </div>

            {/* CONFIRM PASSWORD */}

            <div>

              <label
                htmlFor="confirmPassword"
                className="sr-only"
              >
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                disabled={loading}
                autoComplete="new-password"
                className="
                  w-full
                  rounded-full
                  border
                  border-slate-300
                  bg-white
                  px-5
                  py-3
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                  disabled:bg-slate-100
                "
              />

            </div>

            {/* BUTTON */}

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
                ? "Resetting Password..."
                : "Reset Password"}
            </button>

          </form>

          {/* BACK TO LOGIN */}

          <button
            type="button"
            onClick={() =>
              navigate("/login")
            }
            disabled={loading}
            className="
              mt-5
              w-full
              text-center
              text-sm
              font-medium
              text-slate-500
              transition
              hover:text-blue-600
            "
          >
            Back to Login
          </button>

        </div>

      </div>

    </div>
  );
};

export default ResetPassword;