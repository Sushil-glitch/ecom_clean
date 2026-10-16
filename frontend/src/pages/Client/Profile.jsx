import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  User,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  CalendarDays,
  Save,
  Loader2,
  MapPin,
  Mail,
  Phone,
  Building2,
  Plus,
} from "lucide-react";

import { USER_API_URL } from "../../config/api";
import { toast } from "../../utils/toast";

const Profile = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    contact: "",
    secondaryEmail: "",
    secondaryContact: "",
  });

  // =====================================================
  // FETCH PROFILE
  // =====================================================

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const storedUser = JSON.parse(
        localStorage.getItem("user") || "null"
      );

      const token = localStorage.getItem("token");

      if (!storedUser || !token) {
        navigate("/login", { replace: true });
        return;
      }

      const userId = storedUser.id || storedUser._id;

      if (!userId) {
        setErrorMessage("Unable to identify your account.");
        return;
      }

      const response = await axios.get(
        `${USER_API_URL}/profile/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const profileUser = response.data?.user;

      if (!profileUser) {
        setErrorMessage("Profile information could not be loaded.");
        return;
      }

      setUser(profileUser);
      setEditForm({
        name: profileUser.name || "",
        email: profileUser.email || "",
        contact: profileUser.contact || profileUser.phone || "",
        secondaryEmail: profileUser.secondaryEmail || "",
        secondaryContact: profileUser.secondaryContact || "",
      });

      // Keep localStorage synchronized
      localStorage.setItem(
        "user",
        JSON.stringify(profileUser)
      );
    } catch (error) {
      console.error("Profile fetch error:", error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");

        navigate("/login", { replace: true });
        return;
      }

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // =====================================================
  // PROFILE SAVE HANDLER
  // =====================================================

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    const name = editForm.name.trim();
    const email = editForm.email.trim();
    const contact = editForm.contact.trim();
    const secondaryEmail = editForm.secondaryEmail.trim();
    const secondaryContact = editForm.secondaryContact.trim();

    if (!name) {
      toast.error("Please enter your name.");
      return;
    }

    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    if (!contact) {
      toast.error("Please enter your contact number.");
      return;
    }

    if (!/^\d{10}$/.test(contact)) {
      toast.error("Contact number must contain only numbers and be exactly 10 digits (cannot exceed 10 digits).");
      return;
    }

    if (secondaryContact && !/^\d{10}$/.test(secondaryContact)) {
      toast.error("Secondary contact number must be exactly 10 digits.");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const userId = user?.id || user?._id;

      const response = await axios.put(
        `${USER_API_URL}/profile/${userId}`,
        { name, email, contact, secondaryEmail, secondaryContact },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        const updatedUser = response.data?.user || {
          ...user,
          name,
          email,
          contact,
          secondaryEmail,
          secondaryContact,
        };

        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("userUpdated"));
        toast.success("Profile saved and updated in database!");
      } else {
        toast.error(response.data?.message || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Save profile error:", error);
      toast.error(
        error.response?.data?.message || "Error updating profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // HELPERS
  // =====================================================

  const getInitial = () => {
    return (
      user?.name?.trim()?.charAt(0)?.toUpperCase() || "U"
    );
  };

  const formattedRole = useMemo(() => {
    const role = user?.role || "client";

    return role.charAt(0).toUpperCase() + role.slice(1);
  }, [user]);

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <RefreshCw
              size={22}
              className="animate-spin"
            />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-700">
            Loading your profile...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Please wait a moment
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (errorMessage || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
            <User size={24} />
          </div>

          <h2 className="mt-5 text-lg font-bold text-slate-900">
            Unable to load profile
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {errorMessage ||
              "Profile information is currently unavailable."}
          </p>

          <button
            type="button"
            onClick={fetchProfile}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // PROFILE PAGE
  // =====================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="text-sm font-semibold text-blue-600">
            Account
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View and edit your personal account information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/client")}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

      </div>

      {/* =================================================
          PROFILE HERO
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Cover */}

        <div className="h-28 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 sm:h-36" />

        {/* Profile info */}

        <div className="px-6 pb-6 sm:px-8">

          <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">

              {/* Avatar */}

              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-blue-600 text-3xl font-bold text-white shadow-md sm:h-28 sm:w-28">
                {getInitial()}
              </div>

              {/* Name */}

              <div className="pb-1">

                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {user.name || "User"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {user.email || "No email available"}
                </p>

                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  <ShieldCheck size={13} />
                  {formattedRole}
                </div>

              </div>

            </div>

            {/* Status */}

            <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={15} />
              Account Active
            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          INFORMATION GRID
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* =================================================
            PERSONAL INFORMATION (EDITABLE FORM)
        ================================================= */}

        <form onSubmit={handleSaveProfile} className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <div className="mb-7 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <User size={19} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  Personal Information
                </h3>
                <p className="text-sm text-slate-500">
                  Update your basic account details and save to database.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* NAME */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* PRIMARY EMAIL */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Primary Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="Enter primary email address"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* SECONDARY EMAIL */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Secondary Email Address (Optional)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={editForm.secondaryEmail}
                  onChange={(e) => setEditForm({ ...editForm, secondaryEmail: e.target.value })}
                  placeholder="e.g. backup@domain.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* PRIMARY CONTACT */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Primary Phone Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={10}
                  value={editForm.contact}
                  onChange={(e) => setEditForm({ ...editForm, contact: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="Enter 10-digit primary mobile number"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* SECONDARY CONTACT */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Secondary Phone Number (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={10}
                  value={editForm.secondaryContact}
                  onChange={(e) => setEditForm({ ...editForm, secondaryContact: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="e.g. Alternate mobile number"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* ROLE */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Account Role
              </label>
              <input
                type="text"
                value={formattedRole}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-500 cursor-not-allowed"
              />
            </div>

          </div>

          {/* SAVED ADDRESSES DIRECTLY IN PROFILE */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900">Saved Delivery Addresses</h4>
              </div>
              <button
                type="button"
                onClick={() => navigate("/client/addresses")}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
              >
                <span>Manage Address Book →</span>
              </button>
            </div>

            {user?.addresses && user.addresses.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {user.addresses.map((addr) => (
                  <div
                    key={addr._id || addr.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 relative"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1 rounded-lg bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                        {addr.label === "Work" ? <Building2 size={11} /> : <MapPin size={11} />}
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-900">{addr.fullName}</p>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                      {addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">📞 {addr.phone}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-xs text-slate-500 font-medium">No delivery addresses added yet.</p>
                <button
                  type="button"
                  onClick={() => navigate("/client/addresses")}
                  className="mt-2 inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
                >
                  <Plus size={14} />
                  <span>Add Delivery Address</span>
                </button>
              </div>
            )}
          </div>

          {/* SAVE BUTTON */}
          <div className="mt-8 flex items-center justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 active:scale-[0.98]"
            >
              {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
              {saving ? "Saving Changes..." : "Save Profile Changes"}
            </button>
          </div>

        </form>

        {/* =================================================
            ACCOUNT SUMMARY
        ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6">

            <h3 className="font-semibold text-slate-900">
              Account Summary
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Overview of your account.
            </p>

          </div>

          <div className="space-y-4">

            {/* STATUS */}

            <SummaryItem
              label="Account Status"
              value="Active"
              valueClass="text-emerald-600"
            />

            {/* ROLE */}

            <SummaryItem
              label="Account Type"
              value={formattedRole}
            />

            {/* CREATED */}

            <SummaryItem
              label="Member Since"
              value={formatDate(
                user.createdAt
              )}
              icon={<CalendarDays size={15} />}
            />

          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">

            <div className="flex items-start gap-3">

              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-blue-600"
              />

              <div>

                <p className="text-sm font-semibold text-slate-800">
                  Account Security
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Keep your account information up to date
                  and make sure your password remains secure.
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          QUICK ACTIONS
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-5">

          <h3 className="font-semibold text-slate-900">
            Quick Actions
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Manage your account preferences.
          </p>

        </div>

        <div className="flex flex-col gap-3 sm:flex-row">

          <button
            type="button"
            onClick={() =>
              navigate("/client/settings")
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <ShieldCheck size={17} />
            Account Settings
          </button>

          <button
            type="button"
            onClick={fetchProfile}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw size={17} />
            Refresh Profile
          </button>

        </div>

      </div>

    </div>
  );
};

// =======================================================
// HELPER COMPONENTS
// =======================================================

const SummaryItem = ({ label, value, valueClass = "text-slate-900", icon }) => (
  <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0">
    <span className="text-slate-500 flex items-center gap-1.5">{icon}{label}</span>
    <span className={`font-semibold ${valueClass}`}>{value}</span>
  </div>
);

export default Profile;