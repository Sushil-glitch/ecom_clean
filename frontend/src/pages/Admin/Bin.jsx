import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "../../utils/toast.js";
import {
  ArchiveRestore,
  AlertCircle,
  CalendarDays,
  Mail,
  RefreshCw,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

import { USER_API_URL } from "../../config/api";

const Bin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [hardDeleteUser, setHardDeleteUser] = useState(null);

  // =========================
  // AUTH CONFIG
  // =========================

  const getConfig = useCallback(() => {
    const token = localStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }, []);

  // =========================
  // FETCH BIN
  // =========================

  const fetchBin = useCallback(async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get(
        `${USER_API_URL}/bin`,
        getConfig()
      );

      const data =
        response.data?.users ??
        response.data?.data ??
        [];

      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch bin error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load deleted users."
      );

      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getConfig]);

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    fetchBin();
  }, [fetchBin]);

  const [restoreUser, setRestoreUser] = useState(null);

  const handleRestore = (user) => {
    setRestoreUser(user);
  };

  const confirmRestoreUser = async () => {
    if (!restoreUser) return;
    const targetUser = restoreUser;
    const id = targetUser._id || targetUser.id || targetUser;
    setRestoreUser(null);

    try {
      setError("");
      await axios.patch(`${USER_API_URL}/restore/${id}`, {}, getConfig());
      setUsers((currentUsers) => currentUsers.filter((u) => u._id !== id && u.id !== id));
      toast.success("User restored successfully.");
    } catch (err) {
      console.error("Restore user error:", err);
      toast.error(err.response?.data?.message || "Failed to restore user.");
    }
  };

  // =========================
  // HARD DELETE
  // =========================

  const handleHardDelete = (user) => {
    setHardDeleteUser(user);
  };

  const confirmHardDelete = async () => {
    if (!hardDeleteUser) return;
    const targetUser = hardDeleteUser;
    const id = targetUser._id || targetUser.id || targetUser;
    setHardDeleteUser(null);

    try {
      setError("");

      await axios.delete(
        `${USER_API_URL}/hard-delete/${id}`,
        getConfig()
      );

      setUsers((currentUsers) =>
        currentUsers.filter((user) => user._id !== id && user.id !== id)
      );

      toast.success("User permanently deleted.");
    } catch (err) {
      console.error("Hard delete error:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to permanently delete user."
      );
    }
  };

  // =========================
  // HELPERS
  // =========================

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const normalizeRole = (role) =>
    role?.toString().trim().toLowerCase() || "";

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================
  // STATISTICS
  // =========================

  const statistics = useMemo(() => {
    return {
      total: users.length,

      admins: users.filter(
        (user) => normalizeRole(user.role) === "admin"
      ).length,

      clients: users.filter(
        (user) => normalizeRole(user.role) === "client"
      ).length,
    };
  }, [users]);

  // =========================
  // STAT CARD
  // =========================

  const StatCard = ({
    title,
    value,
    icon,
    iconClass,
  }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  // =========================
  // RENDER
  // =========================

  return (
    <div className="space-y-6">

      {/* =========================
          PAGE HEADER
      ========================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="text-sm font-semibold text-red-600">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Recycle Bin
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage deleted users, restore accounts, or permanently remove them.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchBin(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={refreshing ? "animate-spin" : ""}
          />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>

      </div>

      {/* =========================
          ERROR
      ========================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">

          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              Unable to load Bin
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-500 transition hover:text-red-700"
            aria-label="Close error"
          >
            <X size={18} />
          </button>

        </div>
      )}

      {/* =========================
          STATISTICS
      ========================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <StatCard
          title="Deleted Users"
          value={statistics.total}
          icon={<Users size={21} />}
          iconClass="bg-red-50 text-red-600"
        />

        <StatCard
          title="Deleted Admins"
          value={statistics.admins}
          icon={<ShieldCheck size={21} />}
          iconClass="bg-violet-50 text-violet-600"
        />

        <StatCard
          title="Deleted Clients"
          value={statistics.clients}
          icon={<User size={21} />}
          iconClass="bg-blue-50 text-blue-600"
        />

      </div>

      {/* =========================
          BIN TABLE
      ========================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* TABLE HEADER */}

        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Deleted Accounts
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {users.length === 0
                ? "No deleted accounts"
                : `${users.length} deleted ${
                    users.length === 1 ? "account" : "accounts"
                  }`}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-red-600">
            <Trash2 size={17} />
            <span>Recycle Bin</span>
          </div>

        </div>

        {/* =========================
            LOADING
        ========================== */}

        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">

            <div className="flex flex-col items-center gap-3">

              <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-red-600" />

              <p className="text-sm text-slate-500">
                Loading deleted users...
              </p>

            </div>

          </div>
        ) : users.length === 0 ? (

          /* =========================
             EMPTY STATE
          ========================== */

          <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">

            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <ArchiveRestore size={30} />
            </div>

            <h3 className="text-lg font-semibold text-slate-800">
              Bin is empty
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              Deleted users will appear here. You can restore them or permanently delete them.
            </p>

          </div>

        ) : (

          /* =========================
             TABLE
          ========================== */

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    User
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Email
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Role
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Deleted
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {users.map((user) => {

                  const role = normalizeRole(user.role);

                  return (
                    <tr
                      key={user._id}
                      className="transition hover:bg-slate-50"
                    >

                      {/* USER */}

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                            {getInitials(user.name)}
                          </div>

                          <div className="min-w-0">

                            <p className="truncate font-semibold text-slate-800">
                              {user.name || "Unknown User"}
                            </p>

                            <p className="text-xs text-slate-400">
                              ID: {user._id?.slice(-8) || "—"}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* EMAIL */}

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-2 text-sm text-slate-600">

                          <Mail
                            size={15}
                            className="shrink-0 text-slate-400"
                          />

                          <span>
                            {user.email || "No email"}
                          </span>

                        </div>

                      </td>

                      {/* ROLE */}

                      <td className="px-6 py-4">

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                            role === "admin"
                              ? "bg-violet-100 text-violet-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {role === "admin" && (
                            <ShieldCheck size={13} />
                          )}

                          {role === "admin"
                            ? "Admin"
                            : role === "client"
                            ? "Client"
                            : user.role || "Unknown"}
                        </span>

                      </td>

                      {/* DELETED DATE */}

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-2">

                          <CalendarDays
                            size={15}
                            className="text-slate-400"
                          />

                          <div>

                            <p className="text-sm font-medium text-slate-700">
                              {formatDate(user.deletedAt)}
                            </p>

                            <p className="text-xs text-slate-400">
                              {formatDateTime(user.deletedAt)}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* ACTIONS */}

                      <td className="px-6 py-4">

                        <div className="flex justify-end gap-2">

                          {/* RESTORE */}

                          <button
                            type="button"
                            onClick={() =>
                              handleRestore(user)
                            }
                            title="Restore User"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            <ArchiveRestore size={15} />
                            Restore
                          </button>

                          {/* HARD DELETE */}

                          <button
                            type="button"
                            onClick={() =>
                              handleHardDelete(user)
                            }
                            title="Permanently Delete"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            <Trash2 size={15} />
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

        {/* =========================
            FOOTER
        ========================== */}

        {!loading && users.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {users.length}
              </span>{" "}
              deleted{" "}
              {users.length === 1 ? "user" : "users"}
            </p>

            <p className="text-xs text-slate-400">
              Restore users to remove them from the Bin.
            </p>

          </div>
        )}

      {/* HARD DELETE CONFIRMATION POPUP MODAL */}
      {hardDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
              <Trash2 size={24} />
            </div>

            <h3 className="text-center text-base font-bold text-slate-900">
              Permanently Delete User?
            </h3>
            <p className="mt-2 text-center text-xs text-slate-500 leading-relaxed">
              This will permanently remove <strong className="text-slate-800">{hardDeleteUser.name || hardDeleteUser.email || "this user"}</strong>. This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setHardDeleteUser(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmHardDelete}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE USER CONFIRMATION POPUP MODAL */}
      {restoreUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
              <ArchiveRestore size={24} />
            </div>

            <h3 className="text-center text-base font-bold text-slate-900">
              Restore User?
            </h3>
            <p className="mt-2 text-center text-xs text-slate-500 leading-relaxed">
              Restore <strong className="text-slate-800">{restoreUser.name || restoreUser.email || "this user"}</strong> from the Bin to the active users list?
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRestoreUser(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRestoreUser}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                Restore User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default Bin;
