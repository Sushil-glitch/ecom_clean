import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "../../utils/toast.js";
import { USER_API_URL } from "../../config/api.js";
import {
  Shield,
  RefreshCw,
  Save,
  Bike,
  Lock,
  FileText,
  AlertCircle,
  CheckCircle2,
  Star,
} from "lucide-react";

const DeliveryProfile = () => {
  const [user, setUser] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    vehicleType: "Bike",
    vehicleModel: "",
    bikeNumber: "",
    licenseNumber: "",
  });
  const [initialBikeNumber, setInitialBikeNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${USER_API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success && res.data?.user) {
          const u = res.data.user;
          setUser(u);
          const v = u.vehicleDetails || {};
          const bikeNum = v.bikeNumber || "";
          setInitialBikeNumber(bikeNum);
          setFormData({
            name: u.name || "",
            contact: u.contact || "",
            email: u.email || "",
            vehicleType: v.vehicleType || "Bike",
            vehicleModel: v.vehicleModel || "",
            bikeNumber: bikeNum,
            licenseNumber: v.licenseNumber || "",
          });
        }
      } catch (err) {
        console.error("Fetch profile error:", err);
        toast.error("Failed to load profile details");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const isBikeNumberLocked = Boolean(initialBikeNumber && initialBikeNumber.trim() !== "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.contact) {
      toast.error("Name and contact number are required");
      return;
    }

    if (!/^\d{10}$/.test(formData.contact.trim())) {
      toast.error("Contact number must be 10 digits");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      const payload = {
        name: formData.name,
        contact: formData.contact,
        vehicleDetails: {
          vehicleType: formData.vehicleType,
          vehicleModel: formData.vehicleModel,
          bikeNumber: formData.bikeNumber,
          licenseNumber: formData.licenseNumber,
        },
      };

      const res = await axios.put(`${USER_API_URL}/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        toast.success("Profile & Vehicle details updated successfully!");
        const updatedUser = res.data.user || {
          ...user,
          name: formData.name,
          contact: formData.contact,
          vehicleDetails: payload.vehicleDetails,
        };
        setUser(updatedUser);
        if (formData.bikeNumber && formData.bikeNumber.trim() !== "") {
          setInitialBikeNumber(formData.bikeNumber.trim());
        }
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("userUpdated"));
      }
    } catch (err) {
      console.error("Update profile error:", err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
          <RefreshCw size={20} className="animate-spin text-blue-600" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600">Account & Vehicle Management</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Driver Profile
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your personal details and vehicle credentials. Admin can view all registered vehicle details.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:opacity-50 shrink-0"
        >
          {saving ? <RefreshCw size={17} className="animate-spin" /> : <Save size={17} />}
          {saving ? "Saving All..." : "Master Save All Settings"}
        </button>
      </div>

      {/* Driver Header Summary Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 font-extrabold text-white text-2xl shadow-md">
            {user.name?.charAt(0)?.toUpperCase() || "D"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
            <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
              <Shield size={14} className="text-blue-600" /> Role: Delivery Partner
            </p>
            <p className="text-xs text-slate-400 mt-1">{user.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Driver Rating Badge */}
          <div className="flex items-center gap-3 bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5">
            <div className="p-2.5 bg-amber-500 rounded-lg text-white">
              <Star size={22} className="fill-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Driver Rating</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-base font-extrabold text-slate-900">
                  ⭐ {Number(user.deliveryStats?.averageRating || 5.0).toFixed(1)}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  ({user.deliveryStats?.totalRatingsCount || 0} ratings)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Vehicle Badge */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="p-2.5 bg-blue-100 rounded-lg text-blue-700">
              <Bike size={22} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Bike</p>
              <p className="text-sm font-extrabold text-slate-800">
                {formData.bikeNumber ? (
                  <span className="font-mono tracking-wider text-blue-700">{formData.bikeNumber}</span>
                ) : (
                  <span className="text-amber-600 font-medium text-xs flex items-center gap-1">
                    <AlertCircle size={13} /> Bike Number Pending
                  </span>
                )}
              </p>
              {formData.vehicleModel && (
                <p className="text-xs text-slate-500">{formData.vehicleModel}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Contact Number (10 digits) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value.replace(/\D/g, "") })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Email Address (Read Only)
              </label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Vehicle & Bike Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bike className="text-blue-600" size={20} />
              Vehicle Details
            </h3>
            {isBikeNumberLocked && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                <Lock size={12} className="text-slate-500" /> Bike Number Locked
              </span>
            )}
          </div>

          {!isBikeNumberLocked && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Important Notice regarding Bike Number:</p>
                <p className="mt-0.5 text-amber-700">
                  Your Bike Number can only be entered once. Once saved, it becomes permanent and cannot be modified by you. Only an Admin can edit it after it is saved.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Vehicle Type
              </label>
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="Bike">Motorcycle / Bike</option>
                <option value="Scooter">Scooter / Moped</option>
                <option value="Electric Vehicle">Electric Bike / EV</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Vehicle Model
              </label>
              <input
                type="text"
                placeholder="e.g. Hero Splendor Plus, Honda Activa 6G"
                value={formData.vehicleModel}
                onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Bike Number / Registration Number
                </label>
                {isBikeNumberLocked && (
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Lock size={12} className="text-amber-600" /> Admin Editable Only
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  disabled={isBikeNumberLocked}
                  placeholder="e.g. MH-12-AB-1234"
                  value={formData.bikeNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, bikeNumber: e.target.value.toUpperCase() })
                  }
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono tracking-wider outline-none ${
                    isBikeNumberLocked
                      ? "border-slate-200 bg-slate-100 text-slate-700 cursor-not-allowed"
                      : "border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  }`}
                />
                {isBikeNumberLocked && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={16} />
                  </div>
                )}
              </div>
              {isBikeNumberLocked ? (
                <p className="mt-1 text-[11px] text-slate-500">
                  This bike number is permanently assigned to your driver account. Contact admin if you changed your vehicle.
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-amber-700">
                  Double check your number before saving. You won't be able to edit this yourself later.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Driving License Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. DL-1420110012345"
                  value={formData.licenseNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, licenseNumber: e.target.value.toUpperCase() })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-mono outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <FileText size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 shadow-md shadow-blue-500/20"
          >
            {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            Master Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeliveryProfile;
