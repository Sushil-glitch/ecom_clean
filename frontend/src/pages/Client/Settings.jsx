import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "../../utils/toast.js";
import { USER_API_URL, AUTH_API_URL } from "../../config/api.js";
import {
  User,
  Bell,
  Lock,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  Palette,
  Mail,
  Phone,
  Loader2,
  Send,
} from "lucide-react";
import ThemeToggleCard from "../../components/ThemeToggleCard.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

// =====================================================
// SETTINGS PAGE
// =====================================================

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme, isDark } = useTheme();
  // =====================================================
  // USER
  // =====================================================

  const [user, setUser] = useState({});

  // =====================================================
  // PROFILE
  // =====================================================

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    contact: "",
  });

  const [profileSaved, setProfileSaved] = useState(false);

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    securityAlerts: true,
    systemUpdates: false,
  });

  const [notificationsSaved, setNotificationsSaved] =
    useState(false);

  // =====================================================
  // PASSWORD & SMTP OTP
  // =====================================================

  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
    otp: "",
  });

  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false,
  });

  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [changingPassword, setChangingPassword] = useState(false);

  // =====================================================
  // LOAD SAVED DATA
  // =====================================================

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      // Load user
      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      setUser(storedUser);

      setProfile({
        name: storedUser?.name || "",
        email: storedUser?.email || "",
        contact:
          storedUser?.contact ||
          storedUser?.phone ||
          "",
      });

      // Load notifications
      const savedNotifications = JSON.parse(
        localStorage.getItem("clientNotifications") ||
          "null"
      );

      if (savedNotifications) {
        setNotifications(savedNotifications);
      }

      const savedTheme = localStorage.getItem("adminTheme") || "light";
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      }
    } catch (error) {
      console.error(
        "Failed to load settings:",
        error
      );
    }
  };

  const toggleNotification = (key) => {
    setNotifications((current) => {
      const updated = {
        ...current,
        [key]: !current[key],
      };
      localStorage.setItem(
        "clientNotifications",
        JSON.stringify(updated)
      );
      return updated;
    });
  };

  // =====================================================
  // PROFILE HANDLERS
  // =====================================================

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    let updatedValue = value;
    if (name === "contact") {
      updatedValue = value.replace(/\D/g, "").slice(0, 10);
    }

    setProfile((current) => ({
      ...current,
      [name]: updatedValue,
    }));
  };

  const [savingAll, setSavingAll] = useState(false);

  // =====================================================
  // MASTER SAVE ALL SETTINGS
  // =====================================================

  const handleSaveAllSettings = async () => {
    try {
      setSavingAll(true);
      const name = profile.name.trim();
      const email = profile.email.trim();
      const contact = profile.contact.trim();

      if (!name) {
        toast.error("Please enter your name.");
        setSavingAll(false);
        return;
      }
      if (!email) {
        toast.error("Please enter your email.");
        setSavingAll(false);
        return;
      }
      if (contact && !/^\d{10}$/.test(contact)) {
        toast.error("Contact number must contain only numbers and be exactly 10 digits (cannot exceed 10 digits).");
        setSavingAll(false);
        return;
      }

      // Password validation if user filled password inputs
      const { newPassword, confirmPassword } = passwords;
      if (newPassword || confirmPassword) {
        if (!newPassword || !confirmPassword) {
          toast.error("Please fill in both new password and confirm password fields.");
          setSavingAll(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error("New passwords do not match.");
          setSavingAll(false);
          return;
        }
        if (newPassword.length < 6) {
          toast.error("Password must contain at least 6 characters.");
          setSavingAll(false);
          return;
        }
      }

      // API Payload
      const payload = { name, email, contact };
      if (newPassword) {
        payload.newPassword = newPassword;
      }

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.put(
        `${USER_API_URL}/profile`,
        payload,
        { headers }
      );

      if (response.data && response.data.user) {
        const updatedUser = { ...user, ...response.data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        const updatedUser = { ...user, name, email, contact };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      window.dispatchEvent(new Event("userUpdated"));

      // Save notification preferences
      localStorage.setItem(
        "clientNotifications",
        JSON.stringify(notifications)
      );

      // Clear password inputs
      if (newPassword) {
        setPasswords({ newPassword: "", confirmPassword: "", otp: "" });
        setShowPassword({ new: false, confirm: false });
      }

      setProfileSaved(true);
      setNotificationsSaved(true);

      toast.success("All settings updated & saved to Database successfully!");

      setTimeout(() => {
        setProfileSaved(false);
        setNotificationsSaved(false);
      }, 3000);
    } catch (err) {
      console.error("Save all client settings error:", err);
      toast.error(
        err.response?.data?.message || "Failed to update settings in database."
      );
    } finally {
      setSavingAll(false);
    }
  };

  // =====================================================
  // PASSWORD HANDLERS & SMTP OTP
  // =====================================================

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const handleSendOTP = async () => {
    try {
      setSendingOtp(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post(
        `${AUTH_API_URL}/change-password/request-otp`,
        {},
        { headers }
      );

      if (res.data?.success) {
        setOtpSent(true);
        toast.success(res.data.message || "Verification OTP sent to your registered email via SMTP!");
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
      toast.error(err.response?.data?.message || "Failed to send verification OTP via SMTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleChangePasswordWithOTP = async () => {
    const { newPassword, confirmPassword, otp } = passwords;

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in both new password and confirm password fields.");
      return;
    }

    if (!otp || !otp.trim()) {
      toast.error("Please enter the 6-digit verification OTP sent to your email.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must contain at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post(
        `${AUTH_API_URL}/change-password`,
        { newPassword, confirmPassword, otp: otp.trim() },
        { headers }
      );

      if (res.data?.success) {
        toast.success(res.data.message || "Password changed & saved to DB successfully! Logging out for security...");
        setPasswords({ newPassword: "", confirmPassword: "", otp: "" });
        setOtpSent(false);

        setTimeout(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("user");
          window.dispatchEvent(new Event("userUpdated"));
          navigate("/login", { replace: true });
        }, 1500);
      }
    } catch (err) {
      console.error("Change password error:", err);
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  // =====================================================
  // INITIAL
  // =====================================================

  const initial =
    profile.name?.charAt(0)?.toUpperCase() || "C";

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <PageHeader onSaveAll={handleSaveAllSettings} savingAll={savingAll} />

      {/* =================================================
          PROFILE
      ================================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* PROFILE BANNER */}

        <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-white px-6 py-6 sm:px-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

            {/* AVATAR */}

            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-sm">
              {initial}
            </div>

            {/* USER INFO */}

            <div className="min-w-0">

              <h2 className="truncate text-xl font-bold text-slate-900">
                {profile.name || "Client"}
              </h2>

              <p className="mt-1 truncate text-sm text-slate-500">
                {profile.email ||
                  "No email available"}
              </p>

              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                <ShieldCheck size={13} />
                Client Account
              </span>

            </div>

          </div>

        </div>

        {/* PROFILE FORM */}

        <div className="p-6 sm:p-8">

          <SectionHeader
            icon={<User size={19} />}
            iconClass="bg-blue-50 text-blue-600"
            title="Profile Information"
            description="Keep your account information up to date."
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <InputField
              label="Full Name"
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
              placeholder="Enter your full name"
              icon={User}
            />

            <InputField
              label="Email Address"
              name="email"
              type="email"
              value={profile.email}
              onChange={handleProfileChange}
              placeholder="Enter your email"
              icon={Mail}
            />

            <InputField
              label="Contact Number"
              name="contact"
              maxLength={10}
              value={profile.contact}
              onChange={handleProfileChange}
              placeholder="Enter 10-digit contact number"
              icon={Phone}
            />

            <InputField
              label="Account Role"
              value="Client"
              disabled
              icon={ShieldCheck}
            />

          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400">
              * Edits to profile will be committed when you click Master Save All Settings.
            </p>
            {profileSaved && (
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                <CheckCircle2 size={17} />
                Profile saved & updated in database
              </div>
            )}
          </div>

        </div>

      </section>

      {/* =================================================
          NOTIFICATIONS + APPEARANCE
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* =================================================
            NOTIFICATIONS
        ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <SectionHeader
            icon={<Bell size={19} />}
            iconClass="bg-amber-50 text-amber-600"
            title="Notifications"
            description="Choose which notifications you receive."
          />

          <div className="space-y-5">

            <ToggleSetting
              title="Email Notifications"
              description="Receive general account notifications."
              enabled={
                notifications.emailNotifications
              }
              onChange={() =>
                toggleNotification(
                  "emailNotifications"
                )
              }
            />

            <ToggleSetting
              title="Security Alerts"
              description="Receive important account alerts."
              enabled={
                notifications.securityAlerts
              }
              onChange={() =>
                toggleNotification(
                  "securityAlerts"
                )
              }
            />

            <ToggleSetting
              title="System Updates"
              description="Receive platform update notifications."
              enabled={
                notifications.systemUpdates
              }
              onChange={() =>
                toggleNotification(
                  "systemUpdates"
                )
              }
            />

          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400">
              * Notification choices are saved when you click Master Save All Settings.
            </p>
            {notificationsSaved && (
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                <CheckCircle2 size={17} />
                Settings saved & updated in database
              </div>
            )}
          </div>

        </section>

        {/* DISPLAY THEME TOGGLE CARD */}
        <ThemeToggleCard />

      </div>

      {/* =================================================
          SECURITY & PASSWORD SMTP VERIFICATION
      ================================================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

        <SectionHeader
          icon={<Lock size={19} />}
          iconClass="bg-red-50 text-red-600"
          title="Security & Password Change"
          description="Update your email address or change your account password with SMTP Email OTP Verification."
        />

        {/* 1. TOP: EMAIL ADDRESS */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            Account Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleProfileChange}
              placeholder="Enter your email"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* 2. PASSWORD FIELDS: NEW PASSWORD & CONFIRMATION */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <PasswordField
            label="New Password"
            name="newPassword"
            value={passwords.newPassword}
            onChange={handlePasswordChange}
            visible={showPassword.new}
            onToggle={() =>
              togglePasswordVisibility("new")
            }
          />

          <PasswordField
            label="Confirm Password"
            name="confirmPassword"
            value={passwords.confirmPassword}
            onChange={handlePasswordChange}
            visible={showPassword.confirm}
            onToggle={() =>
              togglePasswordVisibility("confirm")
            }
          />

        </div>

        {/* SMTP OTP VERIFICATION STEP */}
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Mail size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  SMTP Email OTP Verification
                </h4>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                  Click <span className="font-semibold text-blue-700">"Send Verification OTP to Email"</span> to receive a 6-digit code via SMTP to <span className="font-bold text-slate-800">{user.email || profile.email || "your registered email"}</span>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendOTP}
              disabled={sendingOtp || otpTimer > 0}
              className="inline-flex items-center justify-center gap-2 shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {sendingOtp ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              {sendingOtp
                ? "Sending OTP..."
                : otpTimer > 0
                ? `Resend OTP in ${otpTimer}s`
                : otpSent
                ? "Resend Verification OTP"
                : "Send Verification OTP to Email"}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                name="otp"
                maxLength={6}
                value={passwords.otp}
                onChange={handlePasswordChange}
                placeholder="Enter 6-Digit Email OTP"
                className="w-full rounded-xl border border-blue-200 bg-white py-2.5 pl-4 pr-10 text-sm font-mono font-bold tracking-widest text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <button
              type="button"
              onClick={handleChangePasswordWithOTP}
              disabled={changingPassword || !passwords.otp}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
            >
              {changingPassword ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <ShieldCheck size={15} className="text-emerald-400" />
              )}
              {changingPassword ? "Verifying..." : "Verify OTP & Update Password"}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-sm font-medium text-slate-700">
              Master Settings Save
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Saves profile and notification preferences to Database.
            </p>

          </div>

          <button
            type="button"
            onClick={handleSaveAllSettings}
            disabled={savingAll}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          >
            {savingAll ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
            {savingAll ? "Saving to Database..." : "Save All Settings"}
          </button>

        </div>

      </section>

      {/* =================================================
          ACCOUNT INFORMATION
      ================================================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <SectionHeader
          icon={<ShieldCheck size={19} />}
          iconClass="bg-slate-100 text-slate-600"
          title="Account Information"
          description="Basic information about your account."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <AccountInfo
            label="Account Type"
            value="Client"
          />

          <AccountInfo
            label="Account Status"
            value="Active"
          />

          <AccountInfo
            label="Email"
            value={user?.email || "Not available"}
          />

        </div>

      </section>

    </div>
  );
};

// =====================================================
// PAGE HEADER
// =====================================================

const PageHeader = ({ onSaveAll, savingAll }) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-blue-600">
          Client Portal
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Settings
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your profile, preferences and account security.
        </p>
      </div>

      <button
        type="button"
        onClick={onSaveAll}
        disabled={savingAll}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50"
      >
        {savingAll ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Save size={18} />
        )}
        {savingAll ? "Saving to Database..." : "Save All Settings"}
      </button>
    </div>
  );
};

// =====================================================
// SECTION HEADER
// =====================================================

const SectionHeader = ({
  icon,
  iconClass,
  title,
  description,
}) => {
  return (
    <div className="mb-6 flex items-center gap-3">

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>

      <div>

        <h3 className="font-semibold text-slate-900">
          {title}
        </h3>

        <p className="text-sm text-slate-500">
          {description}
        </p>

      </div>

    </div>
  );
};

// =====================================================
// INPUT FIELD
// =====================================================

const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  disabled = false,
  maxLength,
}) => {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">

        {Icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon size={17} />
          </div>
        )}

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
            disabled
              ? "cursor-not-allowed bg-slate-50 text-slate-500"
              : ""
          }`}
        />

      </div>

    </div>
  );
};

// =====================================================
// TOGGLE
// =====================================================

const ToggleSetting = ({
  title,
  description,
  enabled,
  onChange,
}) => {
  return (
    <div className="flex items-center justify-between gap-4">

      <div className="min-w-0">

        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>

      </div>

      <button
        type="button"
        onClick={onChange}
        aria-label={`Toggle ${title}`}
        aria-pressed={enabled}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled
            ? "bg-blue-600"
            : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            enabled
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>

    </div>
  );
};

// =====================================================
// PASSWORD FIELD
// =====================================================

const PasswordField = ({
  label,
  name,
  value,
  onChange,
  visible,
  onToggle,
}) => {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">

        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder="••••••••"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
        >
          {visible ? (
            <EyeOff size={17} />
          ) : (
            <Eye size={17} />
          )}
        </button>

      </div>

    </div>
  );
};

// =====================================================
// SAVE FOOTER
// =====================================================

const SaveFooter = ({
  saved,
  message,
  onSave,
  buttonText,
}) => {
  return (
    <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">

      <div className="min-h-5">

        {saved && (
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
            <CheckCircle2 size={17} />
            {message}
          </div>
        )}

      </div>

      <button
        type="button"
        onClick={onSave}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        <Save size={17} />
        {buttonText}
      </button>

    </div>
  );
};

// =====================================================
// ACCOUNT INFORMATION
// =====================================================

const AccountInfo = ({ label, value }) => {
  return (
    <div className="rounded-xl bg-slate-50 p-4">

      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
        {value}
      </p>

    </div>
  );
};

export default Settings;