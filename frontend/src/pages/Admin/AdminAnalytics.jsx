import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  TrendingUp,
  Users,
  UserCheck,
  UserX,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

import { USER_API_URL } from "../../config/api.js";

const API_URL = `${USER_API_URL}/dashboard-stats`;

const AdminAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [monthlyRegistrations, setMonthlyRegistrations] =
    useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchAnalytics = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      if (!data.success) {
        throw new Error(
          data.message || "Failed to load analytics"
        );
      }

      setStats(data.stats);
      setMonthlyRegistrations(
        data.monthlyRegistrations || []
      );
      setRecentUsers(data.recentUsers || []);
    } catch (error) {
      console.error(
        "ANALYTICS FETCH ERROR:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load analytics"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // =====================================================
  // CHART MAXIMUM
  // =====================================================

  const maxRegistration = useMemo(() => {
    if (!monthlyRegistrations.length) {
      return 1;
    }

    return Math.max(
      ...monthlyRegistrations.map(
        (item) => item.count
      ),
      1
    );
  }, [monthlyRegistrations]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-32 bg-slate-200 rounded animate-pulse" />

          <div className="h-4 w-72 bg-slate-100 rounded mt-3 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="bg-white border border-slate-200 rounded-2xl p-5 h-36 animate-pulse"
            >
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-8 w-20 bg-slate-200 rounded mt-4" />
              <div className="h-3 w-32 bg-slate-100 rounded mt-4" />
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl h-96 animate-pulse" />
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Analytics
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Monitor platform performance and user activity.
          </p>
        </div>

        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
            <Activity size={22} />
          </div>

          <h2 className="text-lg font-semibold text-slate-900 mt-4">
            Unable to load analytics
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            {error}
          </p>

          <button
            onClick={() => fetchAnalytics()}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const growthPositive =
    Number(stats?.growthRate || 0) >= 0;

  return (
    <div className="space-y-6">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Analytics
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Monitor platform performance and user activity.
          </p>
        </div>

        <button
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>
      </div>

      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        <StatCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          change={`${formatChange(
            stats?.growthRate
          )}%`}
          positive={growthPositive}
          icon={Users}
        />

        <StatCard
          title="Active Users"
          value={stats?.activeUsers ?? 0}
          change={`${stats?.activityRate ?? 0}%`}
          positive={true}
          icon={UserCheck}
        />

        <StatCard
          title="Deleted Users"
          value={stats?.deletedUsers ?? 0}
          change="In Bin"
          positive={false}
          icon={UserX}
        />

        <StatCard
          title="Administrators"
          value={stats?.administrators ?? 0}
          change={`${stats?.administratorPercentage ?? 0}%`}
          positive={true}
          icon={ShieldCheck}
        />
      </div>

      {/* =====================================================
          REGISTRATION ANALYTICS
      ===================================================== */}

      <div className="bg-white border border-slate-200 rounded-2xl">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-slate-100">

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Registration Analytics
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              New user registrations over the last 7 months
            </p>
          </div>

          <div className="text-sm text-slate-500">
            This month:{" "}
            <span className="font-semibold text-slate-900">
              {stats?.currentMonthUsers ?? 0}
            </span>
          </div>
        </div>

        <div className="p-6">

          {monthlyRegistrations.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-sm text-slate-500">
              No registration data available.
            </div>
          ) : (
            <div className="h-72 flex items-end gap-3 sm:gap-6">

              {monthlyRegistrations.map(
                (item) => {

                  const height =
                    item.count === 0
                      ? 4
                      : Math.max(
                          (item.count /
                            maxRegistration) *
                            100,
                          8
                        );

                  return (
                    <div
                      key={`${item.year}-${item.month}`}
                      className="flex-1 h-full flex flex-col justify-end items-center"
                    >

                      <span className="text-xs font-medium text-slate-500 mb-2">
                        {item.count}
                      </span>

                      <div
                        className="
                          w-full
                          max-w-12
                          bg-blue-500
                          hover:bg-blue-600
                          rounded-t-lg
                          transition-all
                          duration-300
                        "
                        style={{
                          height: `${height}%`,
                        }}
                        title={`${item.count} registrations`}
                      />

                      <span className="text-xs text-slate-500 mt-3">
                        {item.month}
                      </span>
                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>
      </div>

      {/* =====================================================
          LOWER ANALYTICS
      ===================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* =================================================
            USER DISTRIBUTION
        ================================================= */}

        <div className="bg-white border border-slate-200 rounded-2xl p-6">

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              User Distribution
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Current account distribution
            </p>
          </div>

          <div className="space-y-6">

            <Progress
              label="Active Users"
              value={`${stats?.activePercentage ?? 0}%`}
              width={`${stats?.activePercentage ?? 0}%`}
            />

            <Progress
              label="Inactive Users"
              value={`${stats?.inactivePercentage ?? 0}%`}
              width={`${stats?.inactivePercentage ?? 0}%`}
            />

            <Progress
              label="Clients"
              value={`${stats?.clientPercentage ?? 0}%`}
              width={`${stats?.clientPercentage ?? 0}%`}
            />

            <Progress
              label="Administrators"
              value={`${stats?.administratorPercentage ?? 0}%`}
              width={`${stats?.administratorPercentage ?? 0}%`}
            />
          </div>
        </div>

        {/* =================================================
            PLATFORM ACTIVITY
        ================================================= */}

        <div className="bg-white border border-slate-200 rounded-2xl p-6">

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Platform Activity
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Current user activity overview
            </p>
          </div>

          <div className="space-y-3">

            <ActivityItem
              title="New registrations this month"
              value={`+${stats?.currentMonthUsers ?? 0}`}
              positive
            />

            <ActivityItem
              title="Previous month registrations"
              value={
                stats?.previousMonthUsers ?? 0
              }
            />

            <ActivityItem
              title="Active accounts"
              value={
                stats?.activeUsers ?? 0
              }
              positive
            />

            <ActivityItem
              title="Accounts in Bin"
              value={
                stats?.deletedUsers ?? 0
              }
            />

          </div>
        </div>
      </div>

      {/* =====================================================
          RECENT USERS
      ===================================================== */}

      <div className="bg-white border border-slate-200 rounded-2xl">

        <div className="p-6 border-b border-slate-100">

          <h2 className="text-lg font-semibold text-slate-900">
            Recent Users
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Latest accounts registered on the platform
          </p>

        </div>

        <div className="overflow-x-auto">

          {recentUsers.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No users found.
            </div>
          ) : (
            <table className="w-full">

              <thead>
                <tr className="border-b border-slate-100 text-left">

                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                    User
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Role
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Registered
                  </th>

                </tr>
              </thead>

              <tbody>

                {recentUsers.map((user) => (

                  <tr
                    key={user._id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition"
                  >

                    <td className="px-6 py-4">

                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {user.name}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {user.email}
                        </p>
                      </div>

                    </td>

                    <td className="px-6 py-4">

                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {user.role === "admin"
                          ? "Administrator"
                          : "Client"}
                      </span>

                    </td>

                    <td className="px-6 py-4">

                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          user.isActive
                            ? "text-emerald-600"
                            : "text-slate-500"
                        }`}
                      >

                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.isActive
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }`}
                        />

                        {user.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>

                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(user.createdAt)}
                    </td>

                  </tr>

                ))}

              </tbody>
            </table>
          )}

        </div>
      </div>

      {/* =====================================================
          PERFORMANCE SUMMARY
      ===================================================== */}

      <div className="bg-white border border-slate-200 rounded-2xl p-6">

        <div className="flex items-center justify-between mb-6">

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Performance Summary
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Overall platform statistics
            </p>
          </div>

          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

          <SummaryItem
            title="Growth Rate"
            value={`${formatChange(
              stats?.growthRate
            )}%`}
            description="Compared with previous month"
          />

          <SummaryItem
            title="User Activity"
            value={`${stats?.activityRate ?? 0}%`}
            description="Currently active accounts"
          />

          <SummaryItem
            title="Platform Health"
            value="Operational"
            description="User services are running normally"
          />

        </div>

      </div>
    </div>
  );
};

// =========================================================
// STAT CARD
// =========================================================

const StatCard = ({
  title,
  value,
  change,
  positive,
  icon: Icon,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <h3 className="text-2xl font-bold text-slate-900 mt-2">
            {value}
          </h3>

          <div
            className={`flex items-center gap-1 text-sm mt-2 ${
              positive
                ? "text-emerald-600"
                : "text-slate-500"
            }`}
          >

            {positive ? (
              <ArrowUpRight size={15} />
            ) : (
              <ArrowDownRight size={15} />
            )}

            <span>{change}</span>

            {change.includes("%") && (
              <span className="text-slate-400">
                vs previous month
              </span>
            )}

          </div>

        </div>

        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Icon size={21} />
        </div>

      </div>
    </div>
  );
};

// =========================================================
// PROGRESS
// =========================================================

const Progress = ({
  label,
  value,
  width,
}) => {
  return (
    <div>

      <div className="flex justify-between text-sm mb-2">

        <span className="text-slate-600">
          {label}
        </span>

        <span className="font-semibold text-slate-900">
          {value}
        </span>

      </div>

      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">

        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{
            width,
          }}
        />

      </div>
    </div>
  );
};

// =========================================================
// ACTIVITY ITEM
// =========================================================

const ActivityItem = ({
  title,
  value,
  positive,
}) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition">

      <div className="flex items-center gap-3">

        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <TrendingUp size={17} />
        </div>

        <span className="text-sm text-slate-700">
          {title}
        </span>

      </div>

      <span
        className={`font-semibold ${
          positive
            ? "text-emerald-600"
            : "text-slate-700"
        }`}
      >
        {value}
      </span>

    </div>
  );
};

// =========================================================
// SUMMARY ITEM
// =========================================================

const SummaryItem = ({
  title,
  value,
  description,
}) => {
  return (
    <div className="bg-slate-50 rounded-xl p-5">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <h3 className="text-xl font-bold text-slate-900 mt-2">
        {value}
      </h3>

      <p className="text-xs text-slate-500 mt-1">
        {description}
      </p>

    </div>
  );
};

// =========================================================
// HELPERS
// =========================================================

const formatChange = (value) => {
  const number = Number(value || 0);

  return number > 0
    ? `+${number}`
    : number.toString();
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

export default AdminAnalytics;