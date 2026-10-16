import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "../../utils/toast.js";
import { DELIVERY_API_URL } from "../../config/api.js";
import {
  Truck,
  Package,
  Clock,
  Navigation,
  CheckCircle2,
  RefreshCw,
  MapPin,
  Phone,
  Eye,
  ChevronRight,
  Coins,
  Trophy,
  Zap,
  Award,
  TrendingUp,
  Target,
  Sparkles,
  Gift,
  Wallet,
  ArrowUpRight,
  XCircle,
} from "lucide-react";

import RiderEarningsChart from "../../components/delivery/RiderEarningsChart.jsx";

const DeliveryDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalOrders: 0,
    assigned: 0,
    accepted: 0,
    pickedUp: 0,
    outForDelivery: 0,
    delivered: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [rejectConfirmOrder, setRejectConfirmOrder] = useState(null);
  const [isOnDuty, setIsOnDuty] = useState(true);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, ordersRes, walletRes] = await Promise.all([
        axios.get(`${DELIVERY_API_URL}/stats`, { headers }),
        axios.get(`${DELIVERY_API_URL}/orders`, { headers }),
        axios.get(`${DELIVERY_API_URL}/wallet`, { headers }),
      ]);

      if (statsRes.data?.success) {
        const walletData = walletRes.data?.wallet || {};
        setStats({
          ...statsRes.data.stats,
          walletBalance: typeof walletData.balance === "number" ? walletData.balance : (statsRes.data.stats?.walletBalance || 0),
          cashInHand: typeof walletData.cashInHand === "number" ? walletData.cashInHand : (statsRes.data.stats?.cashInHand || 0),
        });
        if (Array.isArray(walletRes.data?.transactions)) {
          setTransactions(walletRes.data.transactions);
        }
      }

      if (ordersRes.data?.success) {
        setRecentOrders(ordersRes.data.orders || []);
      }
    } catch (err) {
      console.error("Delivery dashboard error:", err);
      toast.error(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [otpModalOrder, setOtpModalOrder] = useState(null);
  const [inputOtp, setInputOtp] = useState("");

  // STATUS UPDATE HANDLERS
  const handleUpdateStatus = async (orderId, targetAction, otpValue = null) => {
    try {
      setActionLoading(orderId);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      let endpoint = "";
      if (targetAction === "accept") endpoint = `${DELIVERY_API_URL}/orders/${orderId}/accept`;
      else if (targetAction === "reject") endpoint = `${DELIVERY_API_URL}/orders/${orderId}/reject`;
      else if (targetAction === "pickup") endpoint = `${DELIVERY_API_URL}/orders/${orderId}/pickup`;
      else if (targetAction === "out-for-delivery") endpoint = `${DELIVERY_API_URL}/orders/${orderId}/out-for-delivery`;
      else if (targetAction === "delivered") endpoint = `${DELIVERY_API_URL}/orders/${orderId}/delivered`;

      const payload = otpValue ? { otp: otpValue } : {};
      const res = await axios.put(endpoint, payload, { headers });

      if (res.data?.success) {
        toast.success(res.data.message || "Order status updated successfully!");
        setOtpModalOrder(null);
        setInputOtp("");
        fetchData(true);
      }
    } catch (err) {
      console.error("Status transition error:", err);
      toast.error(err.response?.data?.message || "Failed to update order status");
    } finally {
      setActionLoading("");
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Assigned":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Accepted":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Picked Up":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Out for Delivery":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
          <RefreshCw size={20} className="animate-spin text-blue-600" />
          Loading delivery dashboard...
        </div>
      </div>
    );
  }

  const activeDeliveries = recentOrders.filter(
    (o) => (o.deliveryStatus || o.delivery?.assignmentStatus) !== "Delivered"
  );

  const QUEST_TARGET = 5;
  const deliveredCount = stats.delivered || 0;
  const deliveryPay = deliveredCount * 50; // ₹50 per delivery
  const questBonus = deliveredCount >= QUEST_TARGET ? 500 : 0; // ₹500 bonus unlocked at 5 completed orders
  const totalIncome = deliveryPay + questBonus;
  const questProgressPercent = Math.min(100, Math.round((deliveredCount / QUEST_TARGET) * 100));

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-blue-600">Driver Partner Portal</p>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <button
              type="button"
              onClick={() => {
                const nextDuty = !isOnDuty;
                setIsOnDuty(nextDuty);
                toast.success(nextDuty ? "🟢 You are now Online & Ready for Orders!" : "🔴 You are now On Break (Offline).");
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-extrabold border transition shadow-2xs active:scale-95 ${
                isOnDuty
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
              title="Click to toggle your duty availability status"
            >
              <span className={`h-2 w-2 rounded-full ${isOnDuty ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              {isOnDuty ? "🟢 Duty Active (Online)" : "🔴 On Break (Offline)"}
            </button>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Delivery Overview & Earnings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your assigned packages, monitor your generated income, and complete delivery quests.
          </p>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
        >
          <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* DRIVER EARNINGS & QUEST CHALLENGE BANNER */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* EARNINGS & WALLET SUMMARY CARD */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between border border-slate-700/50">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                <Coins size={14} /> My Driver Wallet
              </span>
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <TrendingUp size={13} className="text-emerald-400" /> Live Balance
              </span>
            </div>

            <div className="mt-4">
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                ₹{(stats.walletBalance || 0).toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Withdrawable wallet balance ({deliveredCount} completed orders)
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700/60 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl bg-slate-800/80 p-3.5 border border-slate-600/50 shadow-inner">
                <span className="text-slate-300 font-medium block text-[11px]">COD Cash in Hand</span>
                <span className="font-black text-amber-400 text-base mt-0.5 block tracking-wide">
                  ₹{(stats.cashInHand || 0).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="rounded-2xl bg-emerald-500/10 p-3.5 border border-emerald-400/30 shadow-inner">
                <span className="text-emerald-200 font-medium block text-[11px]">Deliveries Done</span>
                <span className="font-black text-emerald-300 text-base mt-0.5 block tracking-wide">
                  {deliveredCount} Orders
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/delivery/wallet")}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-xs font-bold text-slate-950 transition shadow-md"
            >
              <Wallet size={15} /> My Wallet & UPI Payouts <ArrowUpRight size={15} />
            </button>
          </div>
        </div>

        {/* 5 DELIVERIES QUEST CHALLENGE CARD */}
        <div className="lg:col-span-2 rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/60 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-10 pointer-events-none">
            <Trophy size={140} className="text-amber-700" />
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-900 border border-amber-400/40">
                <Sparkles size={14} className="text-amber-600 animate-pulse" />
                Active Quest Challenge
              </div>

              {deliveredCount >= QUEST_TARGET ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-extrabold text-white shadow-sm animate-bounce">
                  <Award size={14} /> 🎉 ₹500 Bonus Unlocked & Claimed!
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1 text-xs font-extrabold text-white shadow-sm">
                  <Target size={14} /> {QUEST_TARGET - deliveredCount} More Deliveries Needed
                </span>
              )}
            </div>

            <div className="mt-3">
              <h3 className="text-xl font-black text-slate-900 flex flex-wrap items-center gap-2">
                {QUEST_TARGET} Deliveries Milestone Reward
                <span className="text-amber-700 text-xs font-bold bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-300">
                  +₹500 Cash Bonus
                </span>
              </h3>
              <p className="mt-1 text-xs text-slate-600 max-w-lg leading-relaxed">
                Complete {QUEST_TARGET} successful deliveries to unlock an exclusive <strong>₹500 Performance Bonus</strong> credited straight to your driver income account! <strong>This quest renews everyday at 04:00:00.</strong>
              </p>
            </div>
          </div>

          {/* PROGRESS BAR & MILESTONES */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700 flex items-center gap-1">
                <Zap size={14} className="text-amber-600" /> Quest Progress:
                <span className="text-amber-900 font-extrabold ml-1">
                  {Math.min(QUEST_TARGET, deliveredCount)} / {QUEST_TARGET} Deliveries
                </span>
              </span>
              <span className="text-amber-800 font-extrabold">
                {questProgressPercent}% Completed
              </span>
            </div>

            <div className="h-3.5 w-full rounded-full bg-amber-200/80 overflow-hidden p-0.5 border border-amber-300/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500 shadow-sm"
                style={{
                  width: `${questProgressPercent}%`,
                }}
              />
            </div>

            <div className="flex justify-between text-[11px] font-bold text-slate-500 pt-1">
              <span>0 (Start)</span>
              <span>3 Deliveries</span>
              <span className="text-amber-900 font-extrabold flex items-center gap-1">
                <Gift size={12} className="text-amber-600" /> {QUEST_TARGET} Deliveries (+₹500 Bonus {deliveredCount >= QUEST_TARGET ? "Claimed!" : ""})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total Assigned */}
        <div
          onClick={() => navigate("/delivery/orders")}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Allocated
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Package size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.totalOrders || 0}</p>
          <p className="mt-0.5 text-xs text-slate-500">All assigned orders</p>
        </div>

        {/* Pending Acceptance */}
        <div
          onClick={() => navigate("/delivery/orders?status=Assigned")}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pending Accept
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.assigned || 0}</p>
          <p className="mt-0.5 text-xs text-amber-600 font-semibold">Requires acceptance</p>
        </div>

        {/* Accepted */}
        <div
          onClick={() => navigate("/delivery/orders?status=Accepted")}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Accepted
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Truck size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.accepted || 0}</p>
          <p className="mt-0.5 text-xs text-slate-500">Ready for pickup</p>
        </div>

        {/* Picked Up */}
        <div
          onClick={() => navigate("/delivery/orders?status=Picked Up")}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Picked Up
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Package size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.pickedUp || 0}</p>
          <p className="mt-0.5 text-xs text-slate-500">In driver possession</p>
        </div>

        {/* Out for Delivery */}
        <div
          onClick={() => navigate("/delivery/orders?status=Out for Delivery")}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              In Transit
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Navigation size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.outForDelivery || 0}</p>
          <p className="mt-0.5 text-xs text-teal-600 font-semibold">Out for delivery</p>
        </div>

        {/* Completed */}
        <div
          onClick={() => navigate("/delivery/orders?status=Delivered")}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Delivered
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.delivered || 0}</p>
          <p className="mt-0.5 text-xs text-emerald-600 font-semibold">Completed</p>
        </div>
      </div>

      {/* RIDER WEEKLY PERFORMANCE ANALYTICS CHART */}
      <RiderEarningsChart
        transactions={transactions}
        completedDeliveries={stats.delivered || 0}
      />

      {/* ACTIVE DELIVERIES SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Active Delivery Workload</h2>
            <p className="text-xs text-slate-500">Orders requiring your attention or transit update</p>
          </div>
          <button
            onClick={() => navigate("/delivery/orders")}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
          >
            View All Deliveries <ChevronRight size={14} />
          </button>
        </div>

        {activeDeliveries.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={26} />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-800">No active pending deliveries</h3>
            <p className="mt-1 text-xs text-slate-400">
              You are all caught up! New orders assigned by admin will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {activeDeliveries.slice(0, 6).map((order) => {
              const currentStatus = order.deliveryStatus || order.delivery?.assignmentStatus || "Assigned";
              const isUpdating = actionLoading === order._id;

              return (
                <div
                  key={order._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <button
                        onClick={() => navigate(`/delivery/orders/${order._id}`)}
                        className="font-bold text-blue-600 text-base hover:underline text-left block"
                      >
                        {order.orderId}
                      </button>
                      <p className="text-xs text-slate-400">
                        Assigned on {order.assignedAt ? new Date(order.assignedAt).toLocaleDateString("en-IN") : "Recent"}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getStatusBadgeColor(
                        currentStatus
                      )}`}
                    >
                      {currentStatus}
                    </span>
                  </div>

                  {/* Customer info */}
                  <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1.5 border border-slate-100">
                    <p className="font-bold text-slate-800 text-sm">
                      {order.clientInfo?.name || "Customer"}
                    </p>
                    <p className="text-slate-600 flex items-center gap-1">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      {order.clientInfo?.contact || "N/A"}
                    </p>
                    <p className="text-slate-600 flex items-start gap-1">
                      <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <span>{order.clientInfo?.address || "Address not recorded"}</span>
                    </p>
                  </div>

                  {/* Amount & Method */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400">Total Amount: </span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        ₹{Number(order.totalAmount || order.total || 0).toLocaleString("en-IN")}
                      </span>
                      <span className="ml-2 font-bold text-blue-600">({order.paymentMethod || "COD"})</span>
                    </div>

                    <button
                      onClick={() => navigate(`/delivery/orders/${order._id}`)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-blue-600 transition"
                    >
                      <Eye size={13} /> View Details
                    </button>
                  </div>

                  {/* Contextual Action Button */}
                  <div className="pt-2">
                    {currentStatus === "Assigned" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(order._id, "accept")}
                          disabled={isUpdating}
                          className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                        >
                          {isUpdating ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={15} />}
                          Accept Delivery
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectConfirmOrder(order)}
                          disabled={isUpdating}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                          title="Reject this delivery assignment"
                        >
                          <XCircle size={15} />
                          Reject Order
                        </button>
                      </div>
                    )}

                    {currentStatus === "Accepted" && (
                      <button
                        onClick={() => handleUpdateStatus(order._id, "pickup")}
                        disabled={isUpdating}
                        className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                      >
                        {isUpdating ? <RefreshCw size={14} className="animate-spin" /> : <Package size={15} />}
                        Mark Order Picked Up
                      </button>
                    )}

                    {currentStatus === "Picked Up" && (
                      <button
                        onClick={() => handleUpdateStatus(order._id, "out-for-delivery")}
                        disabled={isUpdating}
                        className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                      >
                        {isUpdating ? <RefreshCw size={14} className="animate-spin" /> : <Navigation size={15} />}
                        Start Out For Delivery
                      </button>
                    )}

                    {currentStatus === "Out for Delivery" && (
                      <button
                        onClick={() => {
                          setOtpModalOrder(order);
                          setInputOtp("");
                        }}
                        disabled={isUpdating}
                        className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                      >
                        {isUpdating ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={15} />}
                        Enter Customer OTP to Complete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DELIVERY OTP VERIFICATION MODAL */}
      {otpModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={28} />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Enter Customer Delivery OTP</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Please ask customer <strong className="text-slate-800">{otpModalOrder.clientInfo?.name}</strong> for the 4-digit Delivery OTP shown on their order details screen.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!inputOtp || inputOtp.trim().length !== 4) {
                  toast.error("Please enter a valid 4-digit OTP code");
                  return;
                }
                handleUpdateStatus(otpModalOrder._id, "delivered", inputOtp.trim());
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                  4-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={inputOtp}
                  onChange={(e) => setInputOtp(e.target.value)}
                  placeholder="e.g. 4819"
                  className="w-full text-center text-2xl font-mono font-extrabold tracking-widest rounded-xl border border-slate-300 bg-slate-50 py-3 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOtpModalOrder(null);
                    setInputOtp("");
                  }}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === otpModalOrder._id || !inputOtp}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading === otpModalOrder._id ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    "Verify & Complete"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT ORDER CONFIRMATION MODAL */}
      {rejectConfirmOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
              <XCircle size={24} />
            </div>

            <h3 className="text-center text-base font-bold text-slate-900">
              Reject Delivery Assignment?
            </h3>
            <p className="mt-2 text-center text-xs text-slate-500 leading-relaxed">
              Are you sure you want to reject <strong className="text-slate-800">Order #{rejectConfirmOrder.orderId}</strong>? It will be automatically reassigned to another available delivery partner.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRejectConfirmOrder(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = rejectConfirmOrder._id;
                  setRejectConfirmOrder(null);
                  handleUpdateStatus(id, "reject");
                }}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
