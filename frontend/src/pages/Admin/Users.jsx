import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "../../utils/toast.js";

import {
  UserCheck,
  UserX,
  ShieldCheck,
  UserPlus,
  Search,
  Eye,
  Trash2,
  RefreshCw,
  AlertCircle,
  X,
  Power,
  Pencil,
  UsersIcon
} from "lucide-react";

import { USER_API_URL } from "../../config/api";

// =====================================================
// USERS PAGE
// =====================================================

const Users = () => {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [users, setUsers] = useState([]);

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    administrators: 0,
    clients: 0,
    deletedUsers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [toggleConfirmUser, setToggleConfirmUser] = useState(null);

  // =====================================================
  // AUTH
  // =====================================================

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

  // =====================================================
  // HELPERS
  // =====================================================

  const getUserId = (user) => {
    return user?._id || user?.id;
  };

  const normalizeRole = (role) => {
    return role?.toString().trim().toLowerCase() || "";
  };

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

  const getStatus = (user) => {
    if (user?.isActive === false) {
      return "inactive";
    }

    return "active";
  };

  // =====================================================
  // FETCH USERS
  // =====================================================

  const fetchUsers = useCallback(
    async (isRefresh = false) => {
      try {
        setError("");

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const config = getAxiosConfig();

        if (!config) return;

        const response = await axios.get(
          `${USER_API_URL}/users`,
          config
        );

        const data =
          response.data?.users ??
          response.data?.data ??
          response.data;

        if (!Array.isArray(data)) {
          throw new Error(
            "Invalid user data received from server."
          );
        }

        setUsers(data);
      } catch (error) {
        console.error("Fetch users error:", error);

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
            "Unable to load users."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getAxiosConfig, logout]
  );

  // =====================================================
  // FETCH DASHBOARD STATISTICS
  // =====================================================

  const fetchStats = useCallback(async () => {
    try {
      const config = getAxiosConfig();

      if (!config) return;

      const response = await axios.get(
        `${USER_API_URL}/dashboard-stats`,
        config
      );

      if (
        response.data?.success &&
        response.data?.stats
      ) {
        setStats({
          totalUsers:
            response.data.stats.totalUsers ?? 0,

          activeUsers:
            response.data.stats.activeUsers ?? 0,

          inactiveUsers:
            response.data.stats.inactiveUsers ?? 0,

          administrators:
            response.data.stats.administrators ?? 0,

          clients:
            response.data.stats.clients ?? 0,

          deletedUsers:
            response.data.stats.deletedUsers ?? 0,
        });
      }
    } catch (error) {
      console.error(
        "Fetch dashboard statistics error:",
        error
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        logout();
      }
    }
  }, [getAxiosConfig, logout]);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchUsers(),
        fetchStats(),
      ]);
    };

    loadData();
  }, [fetchUsers, fetchStats]);

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    await Promise.all([
      fetchUsers(true),
      fetchStats(),
    ]);
  };

  // =====================================================
  // VIEW USER
  // =====================================================

  const handleViewUser = (user) => {
    const userId = getUserId(user);

    if (!userId) {
      toast.error("User ID not found.");
      return;
    }

    navigate(`/admin/users/${userId}`);
  };

  // =====================================================
  // EDIT USER
  // =====================================================

  const handleEditUser = (user) => {
    const userId = getUserId(user);

    if (!userId) {
      toast.error("User ID not found.");
      return;
    }

    navigate(`/admin/users/edit/${userId}`);
  };

  // =====================================================
  // DELETE / MOVE TO BIN
  // =====================================================

  const handleDeleteUser = (user) => {
    const userId = getUserId(user);
    const role = normalizeRole(user.role);

    if (!userId) {
      toast.error("User ID not found.");
      return;
    }

    if (role === "admin") {
      toast.error("Administrator accounts cannot be deleted.");
      return;
    }

    setDeleteConfirmUser(user);
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    const targetUser = deleteConfirmUser;
    const userId = getUserId(targetUser);
    setDeleteConfirmUser(null);

    try {
      setError("");
      setActionLoading(userId);

      const config = getAxiosConfig();
      if (!config) return;

      const response = await axios.patch(
        `${USER_API_URL}/soft-delete/${userId}`,
        {},
        config
      );

      if (response.data?.success) {
        setUsers((currentUsers) =>
          currentUsers.filter((item) => getUserId(item) !== userId)
        );

        await fetchStats();

        toast.success(
          response.data.message || "User moved to Bin successfully."
        );
      }
    } catch (error) {
      console.error("Delete user error:", error);
      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        logout();
        return;
      }
      toast.error(
        error.response?.data?.message || "Failed to move user to Bin."
      );
    } finally {
      setActionLoading("");
    }
  };

  // =====================================================
  // TOGGLE USER STATUS
  // =====================================================

  const handleToggleStatus = (user) => {
    const userId = getUserId(user);
    const role = normalizeRole(user.role);

    if (!userId) {
      toast.error("User ID not found.");
      return;
    }

    if (role === "admin") {
      toast.error("Administrator accounts cannot be deactivated.");
      return;
    }

    setToggleConfirmUser(user);
  };

  const confirmToggleStatus = async () => {
    if (!toggleConfirmUser) return;
    const user = toggleConfirmUser;
    const userId = getUserId(user);
    const isCurrentlyActive = user.isActive !== false;
    setToggleConfirmUser(null);

    try {
      setError("");
      setActionLoading(userId);

      const config = getAxiosConfig();
      if (!config) return;

      const response = await axios.patch(
        `${USER_API_URL}/toggle-status/${userId}`,
        {},
        config
      );

      if (response.data?.success) {
        setUsers((currentUsers) =>
          currentUsers.map((item) =>
            getUserId(item) === userId
              ? {
                  ...item,
                  isActive:
                    response.data.user?.isActive ?? !isCurrentlyActive,
                }
              : item
          )
        );

        await fetchStats();

        toast.success(
          response.data.message ||
            `User ${!isCurrentlyActive ? "activated" : "deactivated"} successfully.`
        );
      }
    } catch (error) {
      console.error("Toggle status error:", error);
      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        logout();
        return;
      }
      toast.error(
        error.response?.data?.message || "Failed to update user status."
      );
    } finally {
      setActionLoading("");
    }
  };



  // =====================================================
  // FILTER USERS
  // =====================================================

  const filteredUsers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return users.filter((user) => {
      const name =
        user.name?.toString().toLowerCase() || "";

      const email =
        user.email?.toString().toLowerCase() || "";

      const contact =
        user.contact?.toString().toLowerCase() ||
        user.phone?.toString().toLowerCase() ||
        "";

      const role = normalizeRole(user.role);
      const status = getStatus(user);

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        email.includes(searchValue) ||
        contact.includes(searchValue);

      const matchesRole =
        roleFilter === "all" ||
        role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  // =====================================================
  // FILTER HELPERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  const hasFilters =
    Boolean(search.trim()) ||
    roleFilter !== "all" ||
    statusFilter !== "all";

  // =====================================================
  // STAT CARD
  // =====================================================

  const StatCard = ({
    title,
    value,
    icon,
    className,
  }) => {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {title}
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {value}
            </p>
          </div>

          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${className}`}
          >
            {icon}
          </div>
        </div>
      </div>
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            User Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View, manage and monitor all registered users.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-slate-200
            bg-white
            px-4
            py-2.5
            text-sm
            font-semibold
            text-slate-700
            shadow-sm
            transition
            hover:bg-slate-50
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          <RefreshCw
            size={17}
            className={
              refreshing ? "animate-spin" : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-800">
              Unable to load users
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-lg p-1 text-red-500 transition hover:bg-red-100 hover:text-red-700"
            aria-label="Close error"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">

        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<UsersIcon size={21} />}
          className="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={<UserCheck size={21} />}
          className="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Inactive Users"
          value={stats.inactiveUsers}
          icon={<Power size={21} />}
          className="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="Administrators"
          value={stats.administrators}
          icon={<ShieldCheck size={21} />}
          className="bg-violet-50 text-violet-600"
        />

        <StatCard
          title="Clients"
          value={stats.clients}
          icon={<UserPlus size={21} />}
          className="bg-cyan-50 text-cyan-600"
        />

        <StatCard
          title="In Bin"
          value={stats.deletedUsers}
          icon={<UserX size={21} />}
          className="bg-red-50 text-red-600"
        />

      </div>

      {/* USERS TABLE */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* SEARCH + FILTERS */}

        <div className="border-b border-slate-200 p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            {/* SEARCH */}

            <div className="relative w-full lg:max-w-md">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search name, email or contact..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  py-2.5
                  pl-10
                  pr-4
                  text-sm
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-blue-500
                  focus:bg-white
                  focus:ring-2
                  focus:ring-blue-100
                "
              />

            </div>

            {/* FILTERS */}

            <div className="flex flex-col gap-3 sm:flex-row">

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value)
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-slate-700
                  outline-none
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              >
                <option value="all">
                  All Roles
                </option>

                <option value="admin">
                  Admin
                </option>

                <option value="client">
                  Client
                </option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-slate-700
                  outline-none
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              >
                <option value="all">
                  All Status
                </option>

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="
                    rounded-xl
                    border
                    border-slate-200
                    px-4
                    py-2.5
                    text-sm
                    font-medium
                    text-slate-600
                    transition
                    hover:bg-slate-50
                  "
                >
                  Clear
                </button>
              )}

            </div>

          </div>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">

            <div className="flex flex-col items-center gap-3">

              <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="text-sm text-slate-500">
                Loading users...
              </p>

            </div>

          </div>
        ) : filteredUsers.length === 0 ? (

          /* EMPTY */

          <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <UsersIcon size={28} />
            </div>

            <h3 className="text-lg font-semibold text-slate-800">
              No users found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {hasFilters
                ? "Try changing your search or filter options."
                : "There are no registered users yet."}
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="
                  mt-4
                  rounded-xl
                  bg-blue-600
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-blue-700
                "
              >
                Clear Filters
              </button>
            )}

          </div>

        ) : (

          /* TABLE */

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px]">

              <thead>

                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    User
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Contact
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Role
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Joined
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredUsers.map((user) => {

                  const userId = getUserId(user);
                  const role = normalizeRole(user.role);

                  const isAdmin = role === "admin";

                  const status = getStatus(user);

                  const isActive =
                    status === "active";

                  const isInactive =
                    status === "inactive";

                  const isActionLoading =
                    actionLoading === userId;

                  return (
                    <tr
                      key={userId}
                      className="transition hover:bg-slate-50"
                    >

                      {/* USER */}

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                            {getInitials(user.name)}
                          </div>

                          <div className="min-w-0">

                            <p className="truncate font-semibold text-slate-800">
                              {user.name ||
                                "Unknown User"}
                            </p>

                            <p className="truncate text-sm text-slate-500">
                              {user.email ||
                                "No email"}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* CONTACT */}

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.contact ||
                          user.phone ||
                          "—"}
                      </td>

                      {/* ROLE */}

                      <td className="px-6 py-4">

                        <span
                          className={`
                            inline-flex
                            rounded-full
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            ${
                              isAdmin
                                ? "bg-violet-100 text-violet-700"
                                : "bg-blue-100 text-blue-700"
                            }
                          `}
                        >
                          {isAdmin
                            ? "Admin"
                            : role === "client"
                            ? "Client"
                            : user.role ||
                              "Unknown"}
                        </span>

                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-4">

                        <span
                          className={`
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-full
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            ${
                              isAdmin
                                ? "bg-violet-100 text-violet-700"
                                : isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }
                          `}
                        >

                          <span
                            className={`
                              h-1.5
                              w-1.5
                              rounded-full
                              ${
                                isAdmin
                                  ? "bg-violet-500"
                                  : isActive
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                              }
                            `}
                          />

                          {isAdmin
                            ? "Active"
                            : isInactive
                            ? "Inactive"
                            : "Active"}

                        </span>

                      </td>

                      {/* JOINED */}

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(
                          user.createdAt
                        )}
                      </td>

                      {/* ACTIONS */}

                      <td className="px-6 py-4">

                        <div className="flex justify-end gap-2">

                          {/* VIEW */}

                          <button
                            type="button"
                            onClick={() =>
                              handleViewUser(
                                user
                              )
                            }
                            title="View User"
                            aria-label="View User"
                            className="
                              rounded-lg
                              border
                              border-slate-200
                              p-2
                              text-slate-600
                              transition
                              hover:border-blue-200
                              hover:bg-blue-50
                              hover:text-blue-600
                            "
                          >
                            <Eye size={17} />
                          </button>

                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() =>
                              handleEditUser(
                                user
                              )
                            }
                            title="Edit User"
                            aria-label="Edit User"
                            className="
                              rounded-lg
                              border
                              border-slate-200
                              p-2
                              text-slate-600
                              transition
                              hover:border-violet-200
                              hover:bg-violet-50
                              hover:text-violet-600
                            "
                          >
                            <Pencil size={17} />
                          </button>

                          {/* ACTIVATE / DEACTIVATE */}

                          {!isAdmin && (
                            <button
                              type="button"
                              disabled={
                                isActionLoading
                              }
                              onClick={() =>
                                handleToggleStatus(
                                  user
                                )
                              }
                              title={
                                isInactive
                                  ? "Activate User"
                                  : "Deactivate User"
                              }
                              aria-label={
                                isInactive
                                  ? "Activate User"
                                  : "Deactivate User"
                              }
                              className={`
                                rounded-lg
                                border
                                border-slate-200
                                p-2
                                transition
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                                ${
                                  isInactive
                                    ? "text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50"
                                    : "text-amber-600 hover:border-amber-200 hover:bg-amber-50"
                                }
                              `}
                            >
                              {isActionLoading ? (
                                <RefreshCw
                                  size={17}
                                  className="animate-spin"
                                />
                              ) : isInactive ? (
                                <UserCheck
                                  size={17}
                                />
                              ) : (
                                <UserX
                                  size={17}
                                />
                              )}
                            </button>
                          )}

                          {/* DELETE */}

                          {!isAdmin && (
                            <button
                              type="button"
                              disabled={
                                isActionLoading
                              }
                              onClick={() =>
                                handleDeleteUser(
                                  user
                                )
                              }
                              title="Move to Bin"
                              aria-label="Move to Bin"
                              className="
                                rounded-lg
                                border
                                border-slate-200
                                p-2
                                text-slate-600
                                transition
                                hover:border-red-200
                                hover:bg-red-50
                                hover:text-red-600
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                              "
                            >
                              <Trash2 size={17} />
                            </button>
                          )}

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

        {/* FOOTER */}

        {!loading &&
          filteredUsers.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-sm text-slate-500">

                Showing{" "}

                <span className="font-semibold text-slate-700">
                  {filteredUsers.length}
                </span>

                {" "}of{" "}

                <span className="font-semibold text-slate-700">
                  {users.length}
                </span>

                {" "}users

              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">

                <span>
                  Active:{" "}
                  <span className="font-semibold text-emerald-600">
                    {stats.activeUsers}
                  </span>
                </span>

                <span>
                  Inactive:{" "}
                  <span className="font-semibold text-amber-600">
                    {stats.inactiveUsers}
                  </span>
                </span>

                <span>
                  In Bin:{" "}
                  <span className="font-semibold text-red-600">
                    {stats.deletedUsers}
                  </span>
                </span>

              </div>

            </div>
          )}
        </section>

      {/* MOVE TO BIN CONFIRMATION POPUP MODAL */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
              <Trash2 size={24} />
            </div>

            <h3 className="text-center text-base font-bold text-slate-900">
              Move User to Bin?
            </h3>
            <p className="mt-2 text-center text-xs text-slate-500 leading-relaxed">
              Are you sure you want to move <strong className="text-slate-800">{deleteConfirmUser.name || deleteConfirmUser.email}</strong> to the Recycle Bin?
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
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

      {/* TOGGLE USER STATUS CONFIRMATION POPUP MODAL */}
      {toggleConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl mb-4 ${
              toggleConfirmUser.isActive !== false ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
            }`}>
              <Power size={24} />
            </div>

            <h3 className="text-center text-base font-bold text-slate-900">
              {toggleConfirmUser.isActive !== false ? "Deactivate User?" : "Activate User?"}
            </h3>
            <p className="mt-2 text-center text-xs text-slate-500 leading-relaxed">
              Are you sure you want to {toggleConfirmUser.isActive !== false ? "deactivate" : "activate"} <strong className="text-slate-800">{toggleConfirmUser.name || toggleConfirmUser.email}</strong>?
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setToggleConfirmUser(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmToggleStatus}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white shadow-sm transition ${
                  toggleConfirmUser.isActive !== false
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {toggleConfirmUser.isActive !== false ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;