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
  AlertCircle,
  Loader2,
} from "lucide-react";

import { USER_API_URL } from "../../config/api";

const EditUser = () => {
  const navigate = useNavigate();
  const { id } = useParams();

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

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  }, [navigate]);

  // =====================================================
  // AXIOS CONFIG
  // =====================================================

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

  // =====================================================
  // FETCH USER
  // =====================================================

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

      const user = response.data?.user;

      if (!user) {
        throw new Error("User information was not found.");
      }

      setFormData({
        name: user.name || "",
        contact: user.contact || "",
        email: user.email || "",
        role: user.role || "client",
      });
    } catch (error) {
      console.error("Fetch user error:", error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        logout();
        return;
      }

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to load user information."
      );
    } finally {
      setLoading(false);
    }
  }, [id, getAxiosConfig, logout]);

  // =====================================================
  // LOAD USER
  // =====================================================

  useEffect(() => {
    if (!id) {
      setError("User ID is missing.");
      setLoading(false);
      return;
    }

    fetchUser();
  }, [id, fetchUser]);

  // =====================================================
  // INPUT CHANGE
  // =====================================================

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

  // =====================================================
  // SAVE USER
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = formData.name.trim();
    const contact = formData.contact.trim();
    const email = formData.email.trim().toLowerCase();

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!name) {
      setError("Name is required.");
      return;
    }

    if (!contact) {
      setError("Contact is required.");
      return;
    }

    if (!/^\d{10}$/.test(contact)) {
      setError("Contact number must contain only numbers and be exactly 10 digits (cannot exceed 10 digits).");
      return;
    }

    if (!email) {
      setError("Email is required.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!["admin", "client", "delivery"].includes(formData.role)) {
      setError("Please select a valid role.");
      return;
    }

    try {
      setSaving(true);

      const config = getAxiosConfig();

      if (!config) return;

      const response = await axios.put(
        `${USER_API_URL}/users/${id}`,
        {
          name,
          contact,
          email,
          role: formData.role,
        },
        config
      );

      if (response.data?.success) {
        setSuccess(
          response.data.message ||
            "User updated successfully."
        );

        // Give the success message a moment,
        // then return to users page.
        setTimeout(() => {
          navigate("/admin/users", {
            replace: true,
            state: {
              message: "User updated successfully.",
            },
          });
        }, 700);
      }
    } catch (error) {
      console.error("Update user error:", error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        logout();
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to update user."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={34}
            className="animate-spin text-blue-600"
          />

          <p className="text-sm text-slate-500">
            Loading user information...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/admin/users")}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={17} />
            Back to Users
          </button>

          <p className="text-sm font-semibold text-blue-600">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Edit User
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Update the user's account information and role.
          </p>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div>
            <p className="text-sm font-semibold text-red-800">
              Update failed
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-700">
            {success}
          </p>
        </div>
      )}

      {/* FORM */}

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        {/* FORM HEADER */}

        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <User size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Account Information
              </h2>

              <p className="text-sm text-slate-500">
                Modify the details below.
              </p>
            </div>
          </div>
        </div>

        {/* FORM BODY */}

        <div className="space-y-6 p-6">
          {/* NAME */}

          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Full Name
            </label>

            <div className="relative">
              <User
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* EMAIL */}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email Address
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* CONTACT */}

          <div>
            <label
              htmlFor="contact"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Contact Number
            </label>

            <div className="relative">
              <Phone
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="contact"
                name="contact"
                type="text"
                maxLength={10}
                value={formData.contact}
                onChange={handleChange}
                placeholder="Enter 10-digit contact number"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* ROLE */}

          <div>
            <label
              htmlFor="role"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              User Role
            </label>

            <div className="relative">
              <ShieldCheck
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="client">
                  Client
                </option>

                <option value="delivery">
                  Delivery Partner
                </option>

                <option value="admin">
                  Administrator
                </option>
              </select>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Administrator accounts have access to the admin dashboard.
            </p>
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate("/admin/users")}
            disabled={saving}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Saving...
              </>
            ) : (
              <>
                <Save size={17} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUser;