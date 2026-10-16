import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  Edit3,
  Save,
  X,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Camera,
  Send,
  Loader2,
} from "lucide-react";

import { USER_API_URL, AUTH_API_URL } from "../../config/api";

const AdminProfile = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
    otp: "",
  });

  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // ==========================================
  // GET CURRENT USER
  // ==========================================
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(
        `${USER_API_URL}/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const userData = response.data.user || response.data;

      setUser(userData);

      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        contact: userData.contact || "",
      });
    } catch (err) {
      console.error("Profile fetch error:", err);

      // Fallback to localStorage
      try {
        const storedUser = JSON.parse(
          localStorage.getItem("user") || "null"
        );

        if (storedUser) {
          setUser(storedUser);

          setFormData({
            name: storedUser.name || "",
            email: storedUser.email || "",
            contact: storedUser.contact || "",
          });
        } else {
          setError("Unable to load profile.");
        }
      } catch {
        setError("Unable to load profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INPUT HANDLERS
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
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // UPDATE PROFILE
  // ==========================================
  const handleSaveProfile = async () => {
    setError("");
    setMessage("");

    if (!formData.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (formData.contact && !/^\d{10}$/.test(formData.contact.trim())) {
      setError("Contact number must contain only numbers and be exactly 10 digits (cannot exceed 10 digits).");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      const response = await axios.put(
        `${USER_API_URL}/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedUser =
        response.data.user || response.data;

      setUser(updatedUser);

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setMessage("Profile updated successfully.");
      setIsEditing(false);

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      console.error("Update profile error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // SEND OTP FOR CHANGE PASSWORD
  // ==========================================
  const handleSendOTP = async () => {
    setError("");
    setMessage("");

    try {
      setSendingOtp(true);
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${AUTH_API_URL}/change-password/request-otp`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data?.success) {
        setOtpSent(true);
        setMessage(res.data.message || "Verification OTP sent to your registered email via SMTP!");
        setOtpTimer(60);
        const interval = setInterval(() => {
          setOtpTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      console.error("OTP send error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to send verification OTP via SMTP."
      );
    } finally {
      setSendingOtp(false);
    }
  };

  // ==========================================
  // CHANGE PASSWORD WITH OTP VERIFICATION
  // ==========================================
  const handleChangePassword = async () => {
    setError("");
    setMessage("");

    if (
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setError("Please fill in both new password and confirm password fields.");
      return;
    }

    if (!passwordData.otp || !passwordData.otp.trim()) {
      setError("Please enter the 6-digit verification OTP sent to your email.");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (
      passwordData.newPassword !==
      passwordData.confirmPassword
    ) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      await axios.post(
        `${AUTH_API_URL}/change-password`,
        {
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
          otp: passwordData.otp.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("Password changed & saved in DB successfully! Logging out...");

      setPasswordData({
        newPassword: "",
        confirmPassword: "",
        otp: "",
      });
      setOtpSent(false);

      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("userUpdated"));
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      console.error("Password change error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to change password."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    navigate("/login");
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />

          <p className="text-sm text-slate-500">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PROFILE
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              My Profile
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Manage your administrator account and security
              settings.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>

        {/* ALERTS */}
        {message && (
          <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* PROFILE CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            <div className="h-28 bg-gradient-to-r from-orange-500 to-orange-600" />

            <div className="px-6 pb-6">

              {/* AVATAR */}
              <div className="-mt-12 mb-4 relative w-fit">
                <div className="w-24 h-24 rounded-2xl bg-white p-1.5 shadow-lg">
                  <div className="w-full h-full rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 text-3xl font-bold">
                    {user?.name
                      ?.charAt(0)
                      ?.toUpperCase() || "A"}
                  </div>
                </div>

                <button
                  type="button"
                  className="absolute -right-2 -bottom-2 w-9 h-9 rounded-full bg-orange-600 text-white flex items-center justify-center border-4 border-white hover:bg-orange-700 transition"
                  title="Change profile photo"
                >
                  <Camera size={15} />
                </button>
              </div>

              {/* NAME */}
              <h2 className="text-xl font-bold text-slate-900">
                {user?.name || "Administrator"}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                {user?.email || "admin@example.com"}
              </p>

              {/* BADGES */}
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold">
                  <ShieldCheck size={14} />
                  Administrator
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                  <CheckCircle2 size={14} />
                  Active
                </span>
              </div>

              {/* DETAILS */}
              <div className="mt-7 space-y-4">

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Mail
                      size={17}
                      className="text-slate-600"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">
                      Email
                    </p>

                    <p className="text-sm text-slate-700 truncate">
                      {user?.email || "Not available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Phone
                      size={17}
                      className="text-slate-600"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Contact
                    </p>

                    <p className="text-sm text-slate-700">
                      {user?.contact || "Not available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Calendar
                      size={17}
                      className="text-slate-600"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Account created
                    </p>

                    <p className="text-sm text-slate-700">
                      {user?.createdAt
                        ? new Date(
                            user.createdAt
                          ).toLocaleDateString()
                        : "Not available"}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="lg:col-span-2 space-y-6">

            {/* PERSONAL INFORMATION */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">

              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Personal Information
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    Update your account information.
                  </p>
                </div>

                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setError("");
                      setMessage("");
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-100 transition"
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setError("");
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                )}
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* NAME */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>

                  <div className="relative">
                    <User
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                        isEditing
                          ? "border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    />
                  </div>
                </div>

                {/* EMAIL */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                        isEditing
                          ? "border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    />
                  </div>
                </div>

                {/* CONTACT */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contact Number
                  </label>

                  <div className="relative">
                    <Phone
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      name="contact"
                      maxLength={10}
                      value={formData.contact}
                      onChange={handleChange}
                      placeholder="Enter 10-digit contact number"
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                        isEditing
                          ? "border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    />
                  </div>
                </div>

                {/* ROLE */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Role
                  </label>

                  <div className="relative">
                    <ShieldCheck
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value="Administrator"
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm"
                    />
                  </div>
                </div>

                {/* SAVE */}
                {isEditing && (
                  <div className="md:col-span-2 flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-60 transition"
                    >
                      <Save size={17} />

                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* SECURITY */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">

              <div className="px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                    <Lock
                      size={19}
                      className="text-orange-600"
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Security
                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      Keep your administrator account secure.
                    </p>
                  </div>

                </div>
              </div>

              <div className="p-6 space-y-5">

                {/* 1. TOP: EMAIL ADDRESS + SUBMIT BUTTON */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Account Email Address
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email address"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 shrink-0 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {saving ? "Updating..." : "Update Email"}
                    </button>
                  </div>
                </div>

                {/* 2. NEW PASSWORD */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    New Password
                  </label>

                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* 3. CONFIRM PASSWORD */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm New Password
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      name="confirmPassword"
                      value={
                        passwordData.confirmPassword
                      }
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      className="w-full px-4 pr-11 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* SMTP OTP VERIFICATION STEP */}
                <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Mail size={14} className="text-orange-600" />
                        SMTP Email OTP Verification
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Send 6-digit OTP to <span className="font-semibold text-slate-700">{user?.email || formData.email || "registered email"}</span>.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={sendingOtp || otpTimer > 0}
                      className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-60"
                    >
                      {sendingOtp ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Send size={13} />
                      )}
                      {sendingOtp
                        ? "Sending..."
                        : otpTimer > 0
                        ? `Resend in ${otpTimer}s`
                        : otpSent
                        ? "Resend OTP"
                        : "Send Verification OTP"}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-orange-200/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        name="otp"
                        maxLength={6}
                        value={passwordData.otp}
                        onChange={handlePasswordChange}
                        placeholder="Enter 6-Digit Email OTP"
                        className="w-full rounded-xl border border-orange-200 bg-white py-2 pl-3 pr-9 text-xs font-mono font-bold tracking-widest text-slate-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                      <Mail size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <button
                      type="button"
                      onClick={handleChangePassword}
                      disabled={saving || !passwordData.otp}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <ShieldCheck size={14} className="text-emerald-400" />
                      )}
                      {saving ? "Verifying..." : "Verify & Change Password"}
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
