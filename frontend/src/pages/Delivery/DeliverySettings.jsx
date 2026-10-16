import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "../../utils/toast.js";
import { AUTH_API_URL, USER_API_URL } from "../../config/api.js";
import {
  Lock,
  RefreshCw,
  KeyRound,
  Mail,
  Save,
  CheckCircle2,
  Truck,
  User,
  Phone,
  ShieldCheck,
  Zap,
  Sliders,
  CreditCard,
} from "lucide-react";
import ThemeToggleCard from "../../components/ThemeToggleCard.jsx";

const DeliverySettings = () => {
  // MASTER DRIVER SETTINGS STATE
  const [driverSettings, setDriverSettings] = useState({
    name: "",
    contact: "",
    secondaryContact: "",
    email: "",
    vehicleType: "Motorcycle / Scooter",
    vehicleModel: "",
    bikeNumber: "",
    licenseNumber: "",
    availabilityStatus: "available",
    maxActiveOrders: 3,
    isAutoAssignmentEnabled: true,
    upiId: "",
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const [savingMaster, setSavingMaster] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // PASSWORD OTP STATE
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loadingPassword, setLoadingPassword] = useState(false);

  const token = localStorage.getItem("token");

  // =====================================================
  // FETCH CURRENT DRIVER PROFILE & MASTER SETTINGS
  // =====================================================

  const fetchDriverProfile = async () => {
    try {
      setInitialLoading(true);
      const res = await axios.get(`${USER_API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success && res.data.user) {
        const u = res.data.user;
        const savedMeta = localStorage.getItem("deliveryMasterSettingsMeta");

        setDriverSettings({
          name: u.name || "",
          contact: u.contact || "",
          secondaryContact: u.secondaryContact || "",
          email: u.email || "",
          vehicleType: u.vehicleDetails?.vehicleType || "Motorcycle / Scooter",
          vehicleModel: u.vehicleDetails?.vehicleModel || "",
          bikeNumber: u.vehicleDetails?.bikeNumber || "",
          licenseNumber: u.vehicleDetails?.licenseNumber || "",
          availabilityStatus: u.availabilityStatus || "available",
          maxActiveOrders: u.maxActiveOrders || 3,
          isAutoAssignmentEnabled: u.isAutoAssignmentEnabled !== undefined ? u.isAutoAssignmentEnabled : true,
          upiId: u.upiId || "",
        });

        if (savedMeta) {
          try {
            const meta = JSON.parse(savedMeta);
            if (meta.lastSaved) setLastSavedTime(meta.lastSaved);
          } catch {
            // fallback ignore
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch driver profile:", err);
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (storedUser.name) {
        setDriverSettings((prev) => ({
          ...prev,
          name: storedUser.name || "",
          contact: storedUser.contact || "",
          email: storedUser.email || "",
        }));
      }
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverProfile();
  }, []);

  // =====================================================
  // MASTER SAVE DRIVER SETTINGS
  // =====================================================

  const handleMasterSave = async (e) => {
    if (e) e.preventDefault();

    if (!driverSettings.name.trim()) {
      toast.error("Driver name cannot be empty.");
      return;
    }

    if (driverSettings.contact && !/^\d{10}$/.test(driverSettings.contact.trim())) {
      toast.error("Contact number must be exactly 10 digits.");
      return;
    }

    try {
      setSavingMaster(true);

      const payload = {
        name: driverSettings.name.trim(),
        contact: driverSettings.contact.trim(),
        secondaryContact: driverSettings.secondaryContact.trim(),
        availabilityStatus: driverSettings.availabilityStatus,
        maxActiveOrders: Number(driverSettings.maxActiveOrders) || 3,
        isAutoAssignmentEnabled: Boolean(driverSettings.isAutoAssignmentEnabled),
        upiId: driverSettings.upiId.trim(),
        vehicleDetails: {
          vehicleType: driverSettings.vehicleType,
          vehicleModel: driverSettings.vehicleModel.trim(),
          bikeNumber: driverSettings.bikeNumber.trim(),
          licenseNumber: driverSettings.licenseNumber.trim(),
        },
      };

      const res = await axios.put(`${USER_API_URL}/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSavedTime(nowStr);

        localStorage.setItem(
          "deliveryMasterSettingsMeta",
          JSON.stringify({ lastSaved: nowStr, payload })
        );

        if (res.data.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }

        toast.success("Master Delivery Settings updated & saved permanently!");
      }
    } catch (err) {
      console.error("Master save error:", err);
      toast.error(err.response?.data?.message || "Failed to save driver settings.");
    } finally {
      setSavingMaster(false);
    }
  };

  // =====================================================
  // REQUEST OTP FOR PASSWORD CHANGE
  // =====================================================

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    try {
      setLoadingPassword(true);
      const res = await axios.post(
        `${AUTH_API_URL}/request-change-password-otp`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        toast.success(res.data.message || "OTP code sent to your email!");
        setOtpStep(true);
      }
    } catch (err) {
      console.error("OTP request error:", err);
      toast.error(err.response?.data?.message || "Failed to send OTP code");
    } finally {
      setLoadingPassword(false);
    }
  };

  // CHANGE PASSWORD SUBMIT
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordForm.newPassword || !passwordForm.confirmPassword || !otp) {
      toast.error("All fields are required");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoadingPassword(true);
      const res = await axios.post(
        `${AUTH_API_URL}/change-password`,
        {
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
          otp: otp.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        toast.success(res.data.message || "Password changed successfully!");
        setOtpStep(false);
        setOtp("");
        setPasswordForm({ newPassword: "", confirmPassword: "" });
      }
    } catch (err) {
      console.error("Change password error:", err);
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoadingPassword(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-sm font-semibold">Loading Driver Preferences & Master Settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
            <Truck size={14} />
            Driver Control Center
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Delivery Settings &amp; Preferences
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure driver vehicle profile, dispatch preferences, availability, and security credentials.
          </p>
        </div>

        {/* TOP MASTER SAVE BUTTON */}
        <button
          type="button"
          onClick={handleMasterSave}
          disabled={savingMaster}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition active:scale-95 disabled:opacity-50 shrink-0"
        >
          {savingMaster ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          <span>Master Save All Settings</span>
        </button>
      </div>

      {/* MASTER STATUS BANNER */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-blue-50/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Master Settings Active</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                <CheckCircle2 size={12} />
                PERSISTED TO MONGO DB
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              All vehicle specs, dispatch limits, and availability parameters remain locked until your next update.
            </p>
          </div>
        </div>

        {lastSavedTime && (
          <div className="text-right text-xs text-slate-500 font-medium shrink-0 bg-white/80 border border-slate-200/80 px-3 py-1.5 rounded-xl">
            <span>Last Master Update: </span>
            <strong className="text-slate-800">{lastSavedTime}</strong>
          </div>
        )}
      </div>

      {/* FORM SECTION 1: DRIVER PROFILE & VEHICLE SPECS */}
      <form onSubmit={handleMasterSave} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Driver Profile &amp; Vehicle Registration</h2>
              <p className="text-xs text-slate-400">
                Personal credentials used on dispatch slips and customer order tracking.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Driver Full Name *
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={driverSettings.name}
                  onChange={(e) => setDriverSettings({ ...driverSettings, name: e.target.value })}
                  placeholder="e.g. Alex Rivera"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Primary Contact Number (10 Digits) *
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={driverSettings.contact}
                  onChange={(e) => setDriverSettings({ ...driverSettings, contact: e.target.value })}
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Secondary / Emergency Mobile
              </label>
              <input
                type="text"
                maxLength={10}
                value={driverSettings.secondaryContact}
                onChange={(e) => setDriverSettings({ ...driverSettings, secondaryContact: e.target.value })}
                placeholder="Optional backup phone number"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Registered Email (View Only)
              </label>
              <input
                type="email"
                disabled
                value={driverSettings.email}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 px-3.5 text-sm text-slate-500 outline-none cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Vehicle Type
              </label>
              <select
                value={driverSettings.vehicleType}
                onChange={(e) => setDriverSettings({ ...driverSettings, vehicleType: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-medium"
              >
                <option value="Motorcycle / Scooter">Motorcycle / Scooter</option>
                <option value="Electric Bike (EV)">Electric Bike (EV)</option>
                <option value="Delivery Van">Delivery Van</option>
                <option value="Bicycle">Bicycle</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Vehicle Model &amp; Make
              </label>
              <input
                type="text"
                value={driverSettings.vehicleModel}
                onChange={(e) => setDriverSettings({ ...driverSettings, vehicleModel: e.target.value })}
                placeholder="e.g. Honda Activa 6G / TVS iQube"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Vehicle Registration Plate ID
              </label>
              <input
                type="text"
                value={driverSettings.bikeNumber}
                onChange={(e) => setDriverSettings({ ...driverSettings, bikeNumber: e.target.value })}
                placeholder="e.g. TN 01 AB 1234"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Driving License Number
              </label>
              <input
                type="text"
                value={driverSettings.licenseNumber}
                onChange={(e) => setDriverSettings({ ...driverSettings, licenseNumber: e.target.value })}
                placeholder="e.g. DL-1420110012345"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* FORM SECTION 2: DISPATCH & SHIFT PREFERENCES */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Work Shift &amp; Order Dispatch Limits</h2>
              <p className="text-xs text-slate-400">
                Manage your real-time availability and batch delivery capacity.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Duty Availability Status
              </label>
              <select
                value={driverSettings.availabilityStatus}
                onChange={(e) => setDriverSettings({ ...driverSettings, availabilityStatus: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-bold"
              >
                <option value="available">🟢 Available for New Deliveries</option>
                <option value="busy">🟡 On Delivery (Busy)</option>
                <option value="offline">🔴 Off Duty (Offline)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Max Active Batch Orders
              </label>
              <select
                value={driverSettings.maxActiveOrders}
                onChange={(e) => setDriverSettings({ ...driverSettings, maxActiveOrders: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-medium"
              >
                <option value={1}>1 Active Order Max</option>
                <option value={2}>2 Active Orders Max</option>
                <option value={3}>3 Active Orders Max (Recommended)</option>
                <option value={4}>4 Active Orders Max</option>
                <option value={5}>5 Active Orders Max (High Capacity)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Payout UPI ID (For Direct Payouts)
              </label>
              <div className="relative">
                <CreditCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={driverSettings.upiId}
                  onChange={(e) => setDriverSettings({ ...driverSettings, upiId: e.target.value })}
                  placeholder="driver@upi / 9876543210@paytm"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-mono"
                />
              </div>
            </div>

            {/* AUTO ASSIGNMENT TOGGLE */}
            <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Zap size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Auto-Accept Dispatch Orders</p>
                  <p className="text-[11px] text-slate-500">
                    Automatically accept nearby customer orders matching your route &amp; max capacity.
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={driverSettings.isAutoAssignmentEnabled}
                onChange={(e) => setDriverSettings({ ...driverSettings, isAutoAssignmentEnabled: e.target.checked })}
                className="h-5 w-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* MASTER SAVE BUTTON IN FORM */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={savingMaster}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition active:scale-95 disabled:opacity-50"
            >
              {savingMaster ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              <span>Master Save Driver Settings</span>
            </button>
          </div>
        </div>
      </form>

      {/* FORM SECTION 3: ACCOUNT PASSWORD SECURITY */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Account Password Security</h2>
            <p className="text-xs text-slate-400">
              Requires 6-digit email OTP verification to update credentials.
            </p>
          </div>
        </div>

        {!otpStep ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              To update your driver account password, click below to send a 6-digit OTP code to your registered email address.
            </p>
            <button
              type="button"
              onClick={handleRequestOTP}
              disabled={loadingPassword}
              className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-black transition disabled:opacity-50 flex items-center gap-2"
            >
              {loadingPassword ? <RefreshCw size={16} className="animate-spin" /> : <Mail size={16} />}
              <span>Send OTP Code to Email</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                6-Digit Email OTP Code
              </label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="e.g. 123456"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-mono tracking-widest"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                New Password (min 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setOtpStep(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loadingPassword}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {loadingPassword ? <RefreshCw size={16} className="animate-spin" /> : <KeyRound size={16} />}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* DISPLAY THEME TOGGLE CARD */}
      <ThemeToggleCard className="mt-6" />
    </div>
  );
};

export default DeliverySettings;
