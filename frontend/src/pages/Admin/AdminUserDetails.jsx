import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  ShieldCheck,
  UserCheck,
  UserX,
  AlertCircle,
  Trash2,
} from "lucide-react";

import { USER_API_URL } from "../../config/api";

const AdminUserDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    role: "client",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  }, [navigate]);

  const getAxiosConfig = useCallback(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      logout();
      return null;
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }, [logout]);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const config = getAxiosConfig();

      if (!config) return;

      const response = await axios.get(
        `${USER_API_URL}/profile/${id}`,
        config
      );

      const fetchedUser =
        response.data?.user || response.data?.data;

      if (!fetchedUser) {
        throw new Error("User information was not returned.");
      }

      setUser(fetchedUser);

      setFormData({
        name: fetchedUser.name || "",
        contact: fetchedUser.contact || "",
        email: fetchedUser.email || "",
        role: fetchedUser.role || "client",
      });
    } catch (error) {
      console.error("FETCH USER ERROR:", error);

      if (error.response?.status === 401) {
        logout();
        return;
      }

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to load user."
      );
    } finally {
      setLoading(false);
    }
  }, [id, getAxiosConfig, logout]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    let updatedValue = value;
    if (name === "contact") {
      updatedValue = value.replace(/\D/g, "").slice(0, 10);
    }

    setFormData((current) => ({
      ...current,
      [name]: updatedValue,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (!/^\d{10}$/.test(formData.contact.trim())) {
        setError("Contact number must contain only numbers and be exactly 10 digits (cannot exceed 10 digits).");
        return;
      }

      setSaving(true);
      setError("");
      setSuccess("");

      const config = getAxiosConfig();

      if (!config) return;

      const response = await axios.patch(
        `${USER_API_URL}/users/${id}`,
        {
          name: formData.name.trim(),
          contact: formData.contact.trim(),
          email: formData.email.trim(),
          role: formData.role,
        },
        config
      );

      const updatedUser = response.data?.user;

      if (updatedUser) {
        setUser(updatedUser);

        setFormData({
          name: updatedUser.name || "",
          contact: updatedUser.contact || "",
          email: updatedUser.email || "",
          role: updatedUser.role || "client",
        });
      }

      setSuccess(
        response.data?.message ||
          "User information updated successfully."
      );
    } catch (error) {
      console.error("UPDATE USER ERROR:", error);

      if (error.response?.status === 401) {
        logout();
        return;
      }

      setError(
        error.response?.data?.message ||
          "Failed to update user."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!user || user.role === "admin") {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const config = getAxiosConfig();

      if (!config) return;

      const response = await axios.patch(
        `${USER_API_URL}/users/${id}/status`,
        {},
        config
      );

      const updatedUser = response.data?.user;

      if (updatedUser) {
        setUser(updatedUser);
      }

      setSuccess(
        response.data?.message ||
          "User status updated successfully."
      );
    } catch (error) {
      console.error("STATUS UPDATE ERROR:", error);

      if (error.response?.status === 401) {
        logout();
        return;
      }

      setError(
        error.response?.data?.message ||
          "Failed to update user status."
      );
    }
  };

  const handleDelete = () => {
    if (!user || user.role === "admin") {
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    setShowDeleteModal(false);
    if (!user || user.role === "admin") return;

    try {
      setError("");

      const config = getAxiosConfig();
      if (!config) return;

      await axios.patch(
        `${USER_API_URL}/soft-delete/${id}`,
        {},
        config
      );

      navigate("/admin/users", {
        replace: true,
        state: {
          message: "User moved to Bin successfully.",
        },
      });
    } catch (error) {
      console.error("DELETE USER ERROR:", error);
      if (error.response?.status === 401) {
        logout();
        return;
      }
      setError(
        error.response?.data?.message || "Failed to move user to Bin."
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-sm text-slate-500">
            Loading user...
          </p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle
            size={20}
            className="mt-0.5 text-red-600"
          />

          <div>
            <h2 className="font-semibold text-red-800">
              Unable to load user
            </h2>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Back to Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.role === "admin";
  const isActive = user.isActive !== false;

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/users")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <p className="text-sm font-semibold text-blue-600">
              User Management
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {isAdmin ? "Administrator" : "Client"} Details
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and manage this user's account information.
            </p>
          </div>
        </div>
      </div>

      {/* ALERTS */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle
            size={20}
            className="mt-0.5 text-red-600"
          />

          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-700">
            {success}
          </p>
        </div>
      )}

      {/* USER SUMMARY */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
            {user.name
              ?.trim()
              ?.split(/\s+/)
              .map((word) => word.charAt(0))
              .join("")
              .slice(0, 2)
              .toUpperCase() || "U"}
          </div>

          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900">
              {user.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {user.email}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isAdmin
                    ? "bg-violet-100 text-violet-700"
                    : user.role === "delivery"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {isAdmin ? "Administrator" : user.role === "delivery" ? "Delivery Partner" : "Client"}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT FORM */}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Account Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Update the user's basic account information.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
          {/* NAME */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Full Name
            </label>

            <div className="relative">
              <User
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>
          </div>

          {/* EMAIL */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>
          </div>

          {/* CONTACT */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Contact
            </label>

            <div className="relative">
              <Phone
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                name="contact"
                maxLength={10}
                value={formData.contact}
                onChange={handleChange}
                placeholder="Enter 10-digit contact number"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>
          </div>

          {/* ROLE */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Role
            </label>

            <div className="relative">
              <ShieldCheck
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="client">
                  Client
                </option>

                <option value="admin">
                  Administrator
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* ACTIONS */}

        <div className="flex flex-col gap-3 border-t border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {!isAdmin && (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <UserX size={17} />
                Move to Bin
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {!isAdmin && (
              <button
                type="button"
                onClick={handleStatusToggle}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <UserCheck size={17} />

                {isActive
                  ? "Deactivate User"
                  : "Activate User"}
              </button>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={17} />

              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>

      {/* MOVE TO BIN CONFIRMATION POPUP MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
              <Trash2 size={24} />
            </div>

            <h3 className="text-center text-base font-bold text-slate-900">
              Move User to Bin?
            </h3>
            <p className="mt-2 text-center text-xs text-slate-500 leading-relaxed">
              Are you sure you want to move <strong className="text-slate-800">{formData.name || formData.email}</strong> to the Recycle Bin?
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition"
              >
                Move to Bin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetails;