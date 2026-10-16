import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "../../utils/toast.js";
import { USER_API_URL, PAYMENT_API_URL, AUTH_API_URL, API_BASE_URL, SYSTEM_API_URL } from "../../config/api.js";
import {
  User,
  Bell,
  ShieldCheck,
  Palette,
  Lock,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  CreditCard,
  QrCode,
  Banknote,
  Loader2,
  Sun,
  Moon,
  Mail,
  Send,
  Wrench,
  Clock,
  AlertTriangle,
  Sparkles,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import ThemeToggleCard from "../../components/ThemeToggleCard.jsx";

const Settings = () => {
  const navigate = useNavigate();

  // =========================
  // USER
  // =========================

  const [user, setUser] = useState({});

  useEffect(() => {
    try {
      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      setUser(storedUser);
    } catch {
      setUser({});
    }
  }, []);

  // =========================
  // PROFILE
  // =========================

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    contact: "",
  });

  useEffect(() => {
    setProfile({
      name: user?.name || "",
      email: user?.email || "",
      contact: user?.contact || user?.phone || "",
    });
  }, [user]);

  // =========================
  // PASSWORD & SMTP OTP
  // =========================

  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
    otp: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });

  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [changingPassword, setChangingPassword] = useState(false);

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
      console.error("OTP request error:", err);
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
      toast.error("New password must be at least 6 characters long.");
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

  // =========================
  // NOTIFICATIONS
  // =========================

  const [notifications, setNotifications] = useState(() => {
    try {
      return (
        JSON.parse(
          localStorage.getItem("notifications")
        ) || {
          emailNotifications: true,
          securityAlerts: true,
          systemUpdates: false,
        }
      );
    } catch {
      return {
        emailNotifications: true,
        securityAlerts: true,
        systemUpdates: false,
      };
    }
  });

  // =========================
  // PAYMENT SETTINGS
  // =========================

  const DEFAULT_PAYMENT_SETTINGS = {
    upiId: "merchant@upi",
    upiQrUrl:
      "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=merchant@upi&pn=Store&am=0",
    upiPayeeName: "E-Commerce Official Store",
    codExtraCharge: 50,
    enableUpi: true,
    enableCard: true,
    enableCod: true,
    enableRazorpay: true,
    enableAutoAssignment: true,
  };

  const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_SETTINGS);
  const [paymentSaved, setPaymentSaved] = useState(false);

  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const res = await axios.get(`${PAYMENT_API_URL}/settings`);
        if (res.data?.success && res.data.settings) {
          setPaymentSettings(res.data.settings);
        }
      } catch (err) {
        console.error("Failed to fetch payment settings from MongoDB:", err);
      }
    };
    fetchPaymentSettings();
  }, []);

  // =========================
  // SYSTEM MAINTENANCE SETTINGS
  // =========================
  const [maintenance, setMaintenance] = useState({
    isMaintenanceMode: false,
    maintenanceMessage: "Site under maintenance so visit again later",
    estimatedEndTime: "Soon",
  });
  const [savingMaintenance, setSavingMaintenance] = useState(false);

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const res = await axios.get(`${SYSTEM_API_URL}/maintenance`);
        if (res.data?.success && res.data.settings) {
          setMaintenance(res.data.settings);
        }
      } catch (err) {
        console.error("Failed to fetch maintenance settings:", err);
      }
    };
    fetchMaintenance();
  }, []);

  const handleSaveMaintenance = async () => {
    try {
      setSavingMaintenance(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.put(
        `${SYSTEM_API_URL}/maintenance`,
        maintenance,
        { headers }
      );

      if (res.data?.success) {
        toast.success(res.data.message || "Maintenance & SMTP settings saved successfully!");
      }
    } catch (err) {
      console.error("Save maintenance error:", err);
      toast.error(err.response?.data?.message || "Failed to update settings.");
    } finally {
      setSavingMaintenance(false);
    }
  };

  const [testingSmtp, setTestingSmtp] = useState(false);

  const handleTestSmtp = async () => {
    try {
      setTestingSmtp(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post(
        `${SYSTEM_API_URL}/smtp/test`,
        { targetEmail: profile.email || user.email },
        { headers }
      );

      if (res.data?.success) {
        toast.success(res.data.message || "Test email sent successfully to your email!");
      }
    } catch (err) {
      console.error("SMTP Test Error:", err);
      toast.error(err.response?.data?.message || "Failed to send test email.");
    } finally {
      setTestingSmtp(false);
    }
  };

  // =========================
  // DYNAMIC HERO BANNERS SETTINGS
  // =========================
  const [heroBanners, setHeroBanners] = useState([]);
  const [savingHeroBanners, setSavingHeroBanners] = useState(false);

  useEffect(() => {
    const fetchHeroBanners = async () => {
      try {
        const res = await axios.get(`${SYSTEM_API_URL}/hero-banners`);
        if (res.data?.success && Array.isArray(res.data.allBanners)) {
          setHeroBanners(res.data.allBanners);
        }
      } catch (err) {
        console.error("Fetch hero banners error:", err);
      }
    };
    fetchHeroBanners();
  }, []);

  const handleSaveHeroBanners = async () => {
    try {
      setSavingHeroBanners(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.put(
        `${SYSTEM_API_URL}/hero-banners`,
        { heroBanners },
        { headers }
      );

      if (res.data?.success) {
        toast.success("Hero Banners saved successfully! Check the home page hero section.");
      }
    } catch (err) {
      console.error("Save hero banners error:", err);
      toast.error(err.response?.data?.message || "Failed to update hero banners.");
    } finally {
      setSavingHeroBanners(false);
    }
  };

  const handleAddHeroBanner = () => {
    const newBanner = {
      id: `banner-${Date.now()}`,
      badge: "⚡ New Promotional Banner",
      title: "Special Offer Title Here",
      subtitle: "Add engaging details about your store promotion or featured product catalog.",
      primaryCtaText: "Shop Now",
      primaryCtaLink: "/shop",
      secondaryCtaText: "Learn More",
      secondaryCtaLink: "/shop",
      tagLine: "Featured Offer",
      imageUrl: "",
      bgGradient: "from-blue-900 via-indigo-950 to-slate-950",
      isActive: true,
    };
    setHeroBanners((prev) => [...prev, newBanner]);
  };

  const handleUpdateHeroBanner = (index, field, value) => {
    setHeroBanners((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDeleteHeroBanner = (index) => {
    setHeroBanners((prev) => prev.filter((_, i) => i !== index));
  };

  // =========================
  // UI
  // =========================

  const [profileSaved, setProfileSaved] =
    useState(false);

  const [notificationsSaved, setNotificationsSaved] =
    useState(false);

  // =========================
  // HELPERS
  // =========================

  const getInitial = () => {
    return (
      profile.name?.charAt(0)?.toUpperCase() ||
      user?.name?.charAt(0)?.toUpperCase() ||
      "A"
    );
  };

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

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =========================
  const [savingAll, setSavingAll] = useState(false);

  // =========================
  // MASTER SAVE ALL SETTINGS
  // =========================

  const handleSaveAllSettings = async () => {
    try {
      setSavingAll(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (profile.contact && !/^\d{10}$/.test(profile.contact.trim())) {
        toast.error("Contact number must contain only numbers and be exactly 10 digits (cannot exceed 10 digits).");
        setSavingAll(false);
        return;
      }

      // 1. Password validation if user entered password fields
      const { newPassword, confirmPassword, otp } = passwords;
      let updatePasswordFlag = false;
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
          toast.error("Password must be at least 6 characters long.");
          setSavingAll(false);
          return;
        }
        if (!otp || !otp.trim()) {
          toast.info("Note: Password was not updated (requires email OTP). All other settings are saving...");
        } else {
          updatePasswordFlag = true;
        }
      }

      // 2. Save Profile & Password to MongoDB DB
      const profilePayload = {
        name: profile.name.trim(),
        email: profile.email.trim(),
        contact: profile.contact.trim(),
      };
      if (updatePasswordFlag && newPassword && otp) {
        profilePayload.newPassword = newPassword;
        profilePayload.otp = otp.trim();
      }

      const profileRes = await axios.put(
        `${USER_API_URL}/profile`,
        profilePayload,
        { headers }
      );

      if (profileRes.data && profileRes.data.user) {
        const updatedUser = { ...user, ...profileRes.data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        const updatedUser = {
          ...user,
          name: profile.name.trim(),
          email: profile.email.trim(),
          contact: profile.contact.trim(),
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      window.dispatchEvent(new Event("userUpdated"));

      // Clear password fields if updated
      if (newPassword) {
        setPasswords({ newPassword: "", confirmPassword: "", otp: "" });
      }

      // 3. Save Payment Settings to MongoDB DB & LocalStorage
      try {
        await axios.put(
          `${PAYMENT_API_URL}/settings`,
          paymentSettings,
          { headers }
        );
      } catch (pErr) {
        console.error("Payment settings DB sync note:", pErr);
      }
      localStorage.setItem("adminPaymentSettings", JSON.stringify(paymentSettings));

      // 4. Save Maintenance & Hero Banner System Settings to MongoDB DB
      try {
        await axios.put(
          `${SYSTEM_API_URL}/maintenance`,
          maintenance,
          { headers }
        );
        await axios.put(
          `${SYSTEM_API_URL}/hero-banners`,
          { heroBanners },
          { headers }
        );
      } catch (mErr) {
        console.error("System settings DB sync note:", mErr);
      }

      // 5. Save Notifications
      localStorage.setItem("notifications", JSON.stringify(notifications));

      setProfileSaved(true);
      setNotificationsSaved(true);
      setPaymentSaved(true);

      toast.success("All settings & theme updated & saved to Database successfully!");

      setTimeout(() => {
        setProfileSaved(false);
        setNotificationsSaved(false);
        setPaymentSaved(false);
      }, 3000);
    } catch (err) {
      console.error("Save all settings error:", err);
      toast.error(err.response?.data?.message || "Failed to save settings to database.");
    } finally {
      setSavingAll(false);
    }
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">

      {/* =========================
          PAGE HEADER
      ========================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Settings
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your account, preferences and security.
          </p>
        </div>

        <button
          onClick={handleSaveAllSettings}
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

      {/* =========================
          PROFILE CARD
      ========================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* PROFILE HEADER */}

        <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-white px-6 py-6 sm:px-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

            {/* AVATAR */}

            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-sm">
              {getInitial()}
            </div>

            {/* USER INFO */}

            <div className="min-w-0">

              <h2 className="truncate text-xl font-bold text-slate-900">
                {profile.name || "Administrator"}
              </h2>

              <p className="mt-1 truncate text-sm text-slate-500">
                {profile.email ||
                  "No email available"}
              </p>

              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                <ShieldCheck size={13} />
                Administrator
              </div>

            </div>

          </div>

        </div>

        {/* PROFILE SETTINGS */}

        <div className="p-6 sm:p-8">

          <SectionHeader
            icon={<User size={19} />}
            iconClass="bg-blue-50 text-blue-600"
            title="Profile Information"
            description="Update your personal account information."
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <FormField
              label="Full Name"
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
              placeholder="Enter your name"
            />

            <FormField
              label="Email Address"
              type="email"
              name="email"
              value={profile.email}
              onChange={handleProfileChange}
              placeholder="Enter your email"
            />

            <FormField
              label="Contact Number"
              name="contact"
              maxLength={10}
              value={profile.contact}
              onChange={handleProfileChange}
              placeholder="Enter 10-digit contact number"
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Account Role
              </label>

              <input
                type="text"
                value="Administrator"
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
              />
            </div>

          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400">
              * Edits to profile will be committed when you click Master Save All Settings.
            </p>
            {profileSaved && (
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                <CheckCircle2 size={17} />
                Profile saved successfully
              </div>
            )}
          </div>

        </div>

      </section>

      {/* =========================
          PAYMENT SETTINGS
      ========================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

        <SectionHeader
          icon={<CreditCard size={19} />}
          iconClass="bg-emerald-50 text-emerald-600"
          title="Payment Options & Gateway Settings"
          description="Configure UPI scanner, payee details, Cash on Delivery extra charges and enabled payment methods."
        />

        <div className="space-y-6">

          {/* PAYMENT TOGGLES */}

          <div className="grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-5 sm:grid-cols-2 lg:grid-cols-5">

            <ToggleSetting
              title="Auto Delivery Assign"
              description="Automatically match delivery boy on confirmation"
              enabled={paymentSettings.enableAutoAssignment !== false}
              onChange={() =>
                setPaymentSettings((curr) => ({
                  ...curr,
                  enableAutoAssignment: curr.enableAutoAssignment === false ? true : false,
                }))
              }
            />

            <ToggleSetting
              title="Enable Razorpay"
              description="Accept cards, UPI & NetBanking via Razorpay"
              enabled={paymentSettings.enableRazorpay !== false}
              onChange={() =>
                setPaymentSettings((curr) => ({
                  ...curr,
                  enableRazorpay: curr.enableRazorpay === false,
                }))
              }
            />

            <ToggleSetting
              title="Enable UPI Methods"
              description="Allow customers to pay using UPI ID & QR Scanner"
              enabled={paymentSettings.enableUpi}
              onChange={() =>
                setPaymentSettings((curr) => ({
                  ...curr,
                  enableUpi: !curr.enableUpi,
                }))
              }
            />

            <ToggleSetting
              title="Enable Card Payment"
              description="Allow Credit/Debit card checkout"
              enabled={paymentSettings.enableCard}
              onChange={() =>
                setPaymentSettings((curr) => ({
                  ...curr,
                  enableCard: !curr.enableCard,
                }))
              }
            />

            <ToggleSetting
              title="Enable Cash on Delivery"
              description="Allow pay on delivery with optional extra charges"
              enabled={paymentSettings.enableCod}
              onChange={() =>
                setPaymentSettings((curr) => ({
                  ...curr,
                  enableCod: !curr.enableCod,
                }))
              }
            />

          </div>

          {/* RAZORPAY GATEWAY STATUS & DETAILS */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <Zap size={22} className="fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">Razorpay Payment Gateway</h4>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                      paymentSettings.enableRazorpay !== false
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}>
                      {paymentSettings.enableRazorpay !== false ? "Active" : "Disabled"}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                      Live Test Mode
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    High-security payment processor with instant HMAC-SHA256 signature verification & automated order settlement.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-white/90 border border-slate-200/80 px-3.5 py-2 text-xs shadow-xs">
                <span className="text-slate-400 font-medium">Key ID:</span>
                <code className="font-mono font-semibold text-blue-700 bg-blue-50/60 px-1.5 py-0.5 rounded">
                  {paymentSettings.razorpayKeyId || "rzp_test_Tme4VxZXJJ9EhK"}
                </code>
              </div>
            </div>
          </div>

          {/* UPI SETTINGS */}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>

              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                <QrCode
                  size={16}
                  className="text-blue-600"
                />
                UPI & Scanner Settings
              </h4>

              <div className="space-y-4">

                <FormField
                  label="Store UPI ID"
                  name="upiId"
                  value={paymentSettings.upiId}
                  onChange={(e) =>
                    setPaymentSettings((curr) => ({
                      ...curr,
                      upiId: e.target.value,
                    }))
                  }
                  placeholder="e.g. merchant@upi"
                />

                <FormField
                  label="Payee Account / Store Name"
                  name="upiPayeeName"
                  value={
                    paymentSettings.upiPayeeName
                  }
                  onChange={(e) =>
                    setPaymentSettings((curr) => ({
                      ...curr,
                      upiPayeeName:
                        e.target.value,
                    }))
                  }
                  placeholder="e.g. My E-Commerce Store"
                />

                <FormField
                  label="QR Scanner Image URL"
                  name="upiQrUrl"
                  value={paymentSettings.upiQrUrl}
                  onChange={(e) =>
                    setPaymentSettings((curr) => ({
                      ...curr,
                      upiQrUrl: e.target.value,
                    }))
                  }
                  placeholder="Image URL for QR scanner"
                />

              </div>

            </div>

            {/* COD + QR */}

            <div className="space-y-5">

              <div>

                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Banknote
                    size={16}
                    className="text-emerald-600"
                  />
                  COD Extra Charges
                </h4>

                <div className="relative">

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    COD Extra Handling Fee (₹)
                  </label>

                  <div className="relative">

                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={
                        paymentSettings.codExtraCharge
                      }
                      onChange={(e) =>
                        setPaymentSettings((curr) => ({
                          ...curr,
                          codExtraCharge:
                            Number(e.target.value) ||
                            0,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="50"
                    />

                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    This extra charge will be added
                    automatically to the total whenever
                    a customer chooses Cash on Delivery.
                  </p>

                </div>

              </div>

              {/* QR PREVIEW */}

              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">

                <img
                  src={paymentSettings.upiQrUrl}
                  alt="UPI QR Scanner"
                  className="h-20 w-20 shrink-0 rounded-lg border bg-white object-contain p-1"
                  onError={(e) => {
                    e.target.src =
                      "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=UPI";
                  }}
                />

                <div>

                  <p className="text-xs font-bold text-slate-800">
                    Scanner Preview
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    UPI ID:{" "}
                    <span className="font-semibold text-slate-700">
                      {paymentSettings.upiId}
                    </span>
                  </p>

                  <p className="text-xs text-slate-500">
                    Payee:{" "}
                    <span className="font-semibold text-slate-700">
                      {paymentSettings.upiPayeeName}
                    </span>
                  </p>

                </div>

              </div>

            </div>

          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400">
              * Payment configuration changes are committed when you click Master Save All Settings.
            </p>
            {paymentSaved && (
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                <CheckCircle2 size={17} />
                Payment settings saved successfully
              </div>
            )}
          </div>

        </div>

      </section>

      {/* =========================
          WEBSITE MAINTENANCE & SYSTEM UPGRADES
      ========================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <SectionHeader
          icon={<Wrench size={19} />}
          iconClass="bg-amber-50 text-amber-600"
          title="Website Maintenance & Upgrade Mode"
          description="Enable maintenance mode during platform upgrades or database maintenance. Visitors will see the maintenance screen while Admins retain full system access."
        />

        <div className="space-y-6">
          {/* STATUS ALERT BANNER */}
          {maintenance.isMaintenanceMode ? (
            <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 p-5 flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                <Wrench size={20} className="animate-bounce" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                  <span>⚡ Maintenance Mode is Currently ACTIVE</span>
                  <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-[11px] font-extrabold text-white">
                    ON
                  </span>
                </h4>
                <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                  Regular visitors & client accounts visiting the store are being presented with the Maintenance Upgrade Screen. As an administrator, you have full access to test, manage, and resolve any issues.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <CheckCircle2 size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                  <span> Website is Live & Operating Normally</span>
                  <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-extrabold text-white">
                    LIVE
                  </span>
                </h4>
                <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                  The storefront, client dashboard, and delivery partner portal are operational for all users.
                </p>
              </div>
            </div>
          )}

          {/* TOGGLE SWITCH */}
          <div className="rounded-xl bg-slate-50 p-5 border border-slate-200">
            <ToggleSetting
              title="Enable Maintenance Mode (Site Upgrade)"
              description="Turn on maintenance mode to lock public store pages during site updates."
              enabled={maintenance.isMaintenanceMode}
              onChange={() =>
                setMaintenance((curr) => ({
                  ...curr,
                  isMaintenanceMode: !curr.isMaintenanceMode,
                }))
              }
            />
          </div>

          {/* MAINTENANCE CUSTOM MESSAGE & DURATION */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Maintenance Announcement Message
              </label>
              <textarea
                rows={3}
                value={maintenance.maintenanceMessage}
                onChange={(e) =>
                  setMaintenance((curr) => ({
                    ...curr,
                    maintenanceMessage: e.target.value,
                  }))
                }
                placeholder="Enter custom maintenance message displayed to visitors..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-xs text-slate-400">
                Displayed to customers on the Maintenance Screen.
              </p>
            </div>

            <div>
              <FormField
                label="Estimated Completion / Duration"
                name="estimatedEndTime"
                value={maintenance.estimatedEndTime}
                onChange={(e) =>
                  setMaintenance((curr) => ({
                    ...curr,
                    estimatedEndTime: e.target.value,
                  }))
                }
                placeholder="e.g. 30 Minutes, 2 Hours, Soon"
              />
              <p className="mt-1 text-xs text-slate-400">
                Informs visitors when the site is expected to resume full service.
              </p>
            </div>
          </div>

          {/* MAINTENANCE PREVIEW BUTTON & INFO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-5">
            <p className="text-xs text-slate-500">
              Admin access is automatically exempted from maintenance restrictions. Save all changes with Master Save.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => window.open("/maintenance", "_blank")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 shadow-sm transition hover:bg-amber-100"
              >
                <Eye size={16} />
                Preview Maintenance Screen
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          SMTP EMAIL SERVICE CONFIGURATION
      ========================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <SectionHeader
          icon={<Mail size={19} />}
          iconClass="bg-indigo-50 text-indigo-600"
          title="SMTP Email Service & App Password Setup"
          description="Configure your Gmail or custom SMTP server to send live verification OTPs, password reset emails, and order updates straight to user inboxes."
        />

        <div className="space-y-6">
          {/* SMTP STATUS BADGE */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <Send size={19} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>SMTP Delivery Engine</span>
                  {maintenance.smtpConfigured ? (
                    <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                      READY
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                      SETUP REQUIRED
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {maintenance.smtpConfigured
                    ? `Active SMTP email address: ${maintenance.smtpUser || "Configured"}`
                    : "Enter your Gmail address & 16-character App Password below to enable live email delivery."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestSmtp}
              disabled={testingSmtp}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-50 transition disabled:opacity-50"
            >
              {testingSmtp ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {testingSmtp ? "Sending Test..." : "Send Test Email"}
            </button>
          </div>

          {/* FORM INPUTS */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              label="Sender Gmail / SMTP Email Address"
              type="email"
              name="smtpUser"
              value={maintenance.smtpUser}
              onChange={(e) =>
                setMaintenance((curr) => ({
                  ...curr,
                  smtpUser: e.target.value,
                }))
              }
              placeholder="e.g. yourstore@gmail.com"
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Gmail 16-Character App Password
              </label>
              <input
                type="password"
                value={maintenance.smtpPass || ""}
                onChange={(e) =>
                  setMaintenance((curr) => ({
                    ...curr,
                    smtpPass: e.target.value,
                  }))
                }
                placeholder="Enter 16-character App Password (e.g. abcd efgh ijkl mnop)"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-xs text-slate-400">
                Stored securely in database for live email dispatch.
              </p>
            </div>

            <FormField
              label="SMTP Host"
              name="smtpHost"
              value={maintenance.smtpHost}
              onChange={(e) =>
                setMaintenance((curr) => ({
                  ...curr,
                  smtpHost: e.target.value,
                }))
              }
              placeholder="smtp.gmail.com"
            />

            <FormField
              label="SMTP Port"
              type="number"
              name="smtpPort"
              value={maintenance.smtpPort}
              onChange={(e) =>
                setMaintenance((curr) => ({
                  ...curr,
                  smtpPort: Number(e.target.value) || 465,
                }))
              }
              placeholder="465"
            />
          </div>

          {/* GMAIL APP PASSWORD GUIDE INSTRUCTIONS */}
          <div className="rounded-xl bg-amber-50 p-4 text-xs text-amber-900 border border-amber-200/80 space-y-1.5">
            <p className="font-bold text-amber-950 flex items-center gap-1.5">
              <Sparkles size={15} className="text-amber-600" /> How to generate a free Gmail App Password:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-amber-800 text-[11.5px] leading-relaxed pl-1">
              <li>Go to your Google Account Settings (<strong>myaccount.google.com</strong>) & enable <strong>2-Step Verification</strong>.</li>
              <li>Search <strong>"App passwords"</strong> in the top search bar of Google Account.</li>
              <li>Type App Name: <strong>Ecom Web</strong> and click <strong>Create</strong>.</li>
              <li>Copy the generated 16-letter password and paste it into the <strong>App Password</strong> field above!</li>
            </ol>
          </div>

          {/* SAVE BUTTON */}
          <div className="flex items-center justify-end border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={handleSaveMaintenance}
              disabled={savingMaintenance}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {savingMaintenance ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
              {savingMaintenance ? "Saving..." : "Save SMTP Credentials"}
            </button>
          </div>
        </div>
      </section>

      {/* =========================
          NOTIFICATIONS + APPEARANCE
      ========================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* NOTIFICATIONS */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <SectionHeader
            icon={<Bell size={19} />}
            iconClass="bg-amber-50 text-amber-600"
            title="Notifications"
            description="Control how you receive notifications."
          />

          <div className="space-y-5">

            <ToggleSetting
              title="Email Notifications"
              description="Receive general notifications by email."
              enabled={
                notifications.emailNotifications
              }
              onChange={() =>
                setNotifications((current) => ({
                  ...current,
                  emailNotifications:
                    !current.emailNotifications,
                }))
              }
            />

            <ToggleSetting
              title="Security Alerts"
              description="Get notified about important account activity."
              enabled={notifications.securityAlerts}
              onChange={() =>
                setNotifications((current) => ({
                  ...current,
                  securityAlerts:
                    !current.securityAlerts,
                }))
              }
            />

            <ToggleSetting
              title="System Updates"
              description="Receive updates about system changes."
              enabled={notifications.systemUpdates}
              onChange={() =>
                setNotifications((current) => ({
                  ...current,
                  systemUpdates:
                    !current.systemUpdates,
                }))
              }
            />

          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400">
              * Notification preferences are saved when you click Master Save All Settings.
            </p>
            {notificationsSaved && (
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                <CheckCircle2 size={16} />
                Notifications saved
              </div>
            )}
          </div>

        </section>

        {/* DISPLAY THEME TOGGLE CARD */}
        <ThemeToggleCard />

      </div>

      {/* =========================
          SECURITY
      ========================= */}

      {/* =========================
          SECURITY & PASSWORD SMTP VERIFICATION
      ========================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

        <SectionHeader
          icon={<Lock size={19} />}
          iconClass="bg-red-50 text-red-600"
          title="Security & Password Change"
          description="Update your email address or change your password securely with SMTP Email OTP Verification."
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
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
            <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* 2. PASSWORD FIELDS: NEW PASSWORD & CONFIRMATION */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <PasswordInput
            label="New Password"
            name="newPassword"
            value={passwords.newPassword}
            onChange={handlePasswordChange}
            visible={showPasswords.new}
            onToggle={() =>
              setShowPasswords((current) => ({
                ...current,
                new: !current.new,
              }))
            }
          />

          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            value={passwords.confirmPassword}
            onChange={handlePasswordChange}
            visible={showPasswords.confirm}
            onToggle={() =>
              setShowPasswords((current) => ({
                ...current,
                confirm: !current.confirm,
              }))
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

        {/* ======================================================
            DYNAMIC HERO BANNER MANAGER
        ====================================================== */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Dynamic Hero Banner Carousel Manager
                </h3>
                <p className="text-xs text-slate-500">
                  Manage promotional hero slides displayed on the store home page.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddHeroBanner}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition"
              >
                <Plus size={15} />
                Add New Slide
              </button>

              <button
                type="button"
                onClick={handleSaveHeroBanners}
                disabled={savingHeroBanners}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition disabled:opacity-50"
              >
                {savingHeroBanners ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {savingHeroBanners ? "Saving..." : "Save Banners"}
              </button>
            </div>
          </div>

          {/* BANNERS LIST */}
          <div className="mt-5 space-y-4">
            {heroBanners.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                No hero banners configured. Click "+ Add New Slide" to create your first banner slide.
              </div>
            ) : (
              heroBanners.map((banner, index) => (
                <div
                  key={banner.id || index}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 transition hover:border-slate-300"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-xs font-bold text-slate-700">Slide #{index + 1}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={banner.isActive !== false}
                          onChange={(e) => handleUpdateHeroBanner(index, "isActive", e.target.checked)}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                        Active Slide
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteHeroBanner(index)}
                        className="rounded-lg p-1 text-rose-500 hover:bg-rose-50 transition"
                        title="Delete Banner Slide"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={banner.badge || ""}
                        onChange={(e) => handleUpdateHeroBanner(index, "badge", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-purple-500"
                        placeholder="e.g. ⚡ Flash Sale"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Main Headline Title</label>
                      <input
                        type="text"
                        value={banner.title || ""}
                        onChange={(e) => handleUpdateHeroBanner(index, "title", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-purple-500"
                        placeholder="Main Hero Headline"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Subheadline Description</label>
                      <textarea
                        rows={2}
                        value={banner.subtitle || ""}
                        onChange={(e) => handleUpdateHeroBanner(index, "subtitle", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-purple-500 resize-none"
                        placeholder="Detailed banner subtext description..."
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Primary CTA Button Label</label>
                      <input
                        type="text"
                        value={banner.primaryCtaText || ""}
                        onChange={(e) => handleUpdateHeroBanner(index, "primaryCtaText", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Primary CTA Route Link</label>
                      <input
                        type="text"
                        value={banner.primaryCtaLink || ""}
                        onChange={(e) => handleUpdateHeroBanner(index, "primaryCtaLink", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Card Tagline</label>
                      <input
                        type="text"
                        value={banner.tagLine || ""}
                        onChange={(e) => handleUpdateHeroBanner(index, "tagLine", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ALL SETTINGS SAVE */}
        <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">
              Master Settings Save
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Saves profile, payment, notification & appearance preferences to Database.
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

    </div>
  );
};

// ======================================================
// SECTION HEADER
// ======================================================

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

      <div className="min-w-0">

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

// ======================================================
// FORM FIELD
// ======================================================

const FormField = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  maxLength,
}) => {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

    </div>
  );
};

// ======================================================
// TOGGLE
// ======================================================

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
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>

    </div>
  );
};

// ======================================================
// PASSWORD INPUT
// ======================================================

const PasswordInput = ({
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
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
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

export default Settings;