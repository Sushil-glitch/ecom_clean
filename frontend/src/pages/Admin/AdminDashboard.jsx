import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  UserPlus,
  Activity,
  RefreshCw,
  AlertCircle,
  ShoppingBag,
  Clock3,
  Truck,
  CheckCircle2,
  Banknote,
  Package,
  ChevronRight,
  CreditCard,
  QrCode,
  Eye,
  X,
  Zap,
  Sliders,
  FileSpreadsheet,
  PlusCircle,
  Ticket,
  Smartphone,
} from "lucide-react";

import { USER_API_URL, PRODUCT_API_URL, PAYMENT_API_URL } from "../../config/api";
import { toast } from "../../utils/toast.js";
import ProductCard from "../../components/ProductCard.jsx";
import { exportSalesToCSV } from "../../utils/csvExporter.js";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    administrators: 0,
    clients: 0,
    deletedUsers: 0,
  });

  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [storeProducts, setStoreProducts] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
  const [togglingAutoAssign, setTogglingAutoAssign] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get(`${PAYMENT_API_URL}/settings`);
      if (res.data?.settings) {
        setAutoAssignEnabled(res.data.settings.enableAutoAssignment ?? true);
      }
    } catch (e) {
      console.error("Fetch settings error:", e);
    }
  }, []);

  const handleToggleAutoAssign = async () => {
    try {
      setTogglingAutoAssign(true);
      const token = localStorage.getItem("token");
      const nextState = !autoAssignEnabled;
      const res = await axios.put(
        `${PAYMENT_API_URL}/settings`,
        { enableAutoAssignment: nextState },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setAutoAssignEnabled(nextState);
        toast.success(
          nextState
            ? "⚡ Auto-Assignment Mode Activated! Orders will be auto-dispatched."
            : "🖐️ Manual Assignment Mode Activated! Admin can assign orders manually."
        );
      }
    } catch (err) {
      console.error("Toggle auto assignment error:", err);
      toast.error(err.response?.data?.message || "Failed to update assignment mode.");
    } finally {
      setTogglingAutoAssign(false);
    }
  };

  // =====================================================
  // FETCH DASHBOARD DATA
  // =====================================================

  const fetchDashboardStats = useCallback(
    async (isRefresh = false) => {
      try {
        setError("");

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const token = localStorage.getItem("token");

        const response = await axios.get(
          `${USER_API_URL}/dashboard-stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Unable to load dashboard"
          );
        }

        setStats(
          response.data.stats || {
            totalUsers: 0,
            activeUsers: 0,
            administrators: 0,
            clients: 0,
            deletedUsers: 0,
          }
        );

        setOrderStats(
          response.data.orderStats || {
            totalOrders: 0,
            pendingOrders: 0,
            processingOrders: 0,
            shippedOrders: 0,
            deliveredOrders: 0,
            cancelledOrders: 0,
            totalRevenue: 0,
          }
        );

        setRecentOrders(response.data.recentOrders || []);
        setLowStockProducts(response.data.lowStockProducts || []);

        try {
          const prodRes = await axios.get(PRODUCT_API_URL);
          if (prodRes.data?.products) {
            setStoreProducts(prodRes.data.products);
          }
        } catch (pErr) {
          console.error("Store products fetch note:", pErr);
        }
      } catch (error) {
        console.error(
          "Dashboard statistics error:",
          error
        );

        setError(
          error.response?.data?.message ||
            error.message ||
            "Unable to load dashboard statistics."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchDashboardStats();
    fetchSettings();
  }, [fetchDashboardStats, fetchSettings]);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    ["Smartphones", "Electronics", "Books", "Gadgets", "Computer Accessories"].forEach((cat) => {
      map[cat] = 0;
    });

    storeProducts.forEach((p) => {
      if (p.category) {
        const existingKey = Object.keys(map).find((k) => k.toLowerCase() === p.category.toLowerCase());
        if (existingKey) {
          map[existingKey] += 1;
        } else {
          map[p.category] = (map[p.category] || 0) + 1;
        }
      }
    });

    const total = storeProducts.length || 1;
    return Object.entries(map).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }));
  }, [storeProducts]);

  const handleConfirmOrderByOwner = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `${PAYMENT_API_URL}/confirm-owner/${orderId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data?.success) {
        toast.success(res.data.message || "Order confirmed! Client notified via email & in-app notification.");
        fetchDashboardStats(true);
        if (selectedOrder && (selectedOrder._id === orderId || selectedOrder.orderId === orderId)) {
          setSelectedOrder({ ...selectedOrder, orderStatus: "Confirmed" });
        }
      }
    } catch (err) {
      console.error("Order confirmation error:", err);
      toast.error(err.response?.data?.message || "Failed to confirm order.");
    }
  };

  const handleExportCSV = async () => {
    try {
      toast.info("Generating full sales CSV report...");
      const token = localStorage.getItem("token");
      const res = await axios.get(`${PAYMENT_API_URL}/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allOrdersList = (res.data?.success && Array.isArray(res.data.orders))
        ? res.data.orders
        : recentOrders;

      if (!allOrdersList || allOrdersList.length === 0) {
        toast.error("No sales or orders data available to export.");
        return;
      }

      const success = exportSalesToCSV(allOrdersList, `electrozone-full-sales-report-${new Date().toISOString().split("T")[0]}.csv`);
      if (success) {
        toast.success(`Exported complete sales report (${allOrdersList.length} total orders)!`);
      }
    } catch (err) {
      console.error("Export CSV error:", err);
      // Fallback to recentOrders if fetch fails
      exportSalesToCSV(recentOrders, `electrozone-sales-report-${new Date().toISOString().split("T")[0]}.csv`);
      toast.success(`Exported sales report (${recentOrders.length} orders)!`);
    }
  };

  const handleQuickRestock = async (product, addQty) => {
    try {
      const token = localStorage.getItem("token");
      const currentStock = Number(product.stock || 0);
      const updatedStock = currentStock + addQty;

      const res = await axios.put(
        `${PRODUCT_API_URL}/${product._id || product.id}`,
        { stock: updatedStock },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success || res.status === 200) {
        toast.success(`Restocked ${product.name} (+${addQty} items). New Stock: ${updatedStock}`);
        fetchDashboardStats(true);
      }
    } catch (err) {
      console.error("Quick restock error:", err);
      toast.error(err.response?.data?.message || "Failed to update product stock.");
    }
  };

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const clientPercentage = useMemo(() => {
    if (!stats.totalUsers) return 0;
    return Math.round(
      (stats.clients / stats.totalUsers) * 100
    );
  }, [stats]);

  const adminPercentage = useMemo(() => {
    if (!stats.totalUsers) return 0;
    return Math.round(
      (stats.administrators / stats.totalUsers) * 100
    );
  }, [stats]);

  const deletedPercentage = useMemo(() => {
    const total = stats.totalUsers + stats.deletedUsers;
    if (!total) return 0;
    return Math.round(
      (stats.deletedUsers / total) * 100
    );
  }, [stats]);

  // =====================================================
  // STAT CARD COMPONENT
  // =====================================================

  const StatCard = ({
    title,
    value,
    icon: Icon,
    iconStyle,
    subtext,
    onClick,
  }) => (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {title}
          </p>

          <p className="mt-2 text-2xl font-black text-slate-900 tracking-tight truncate">
            {loading ? "—" : value}
          </p>

          {subtext && (
            <p className="mt-1 text-xs text-slate-400 font-medium truncate">
              {subtext}
            </p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110 ${iconStyle}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">
      {/* HEADER HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900 p-6 sm:p-8 text-white shadow-md">
        {/* Decorative ambient background accent */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-blue-400 border border-blue-400/20">
                <Zap size={13} className="text-blue-400 animate-pulse" />
                Admin Control Center
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition border ${
                  autoAssignEnabled
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-400/30"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    autoAssignEnabled ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                {autoAssignEnabled ? "⚡ Auto Assign Mode" : "🖐️ Manual Assign Mode"}
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
              Welcome back, Administrator
            </h1>

            <p className="max-w-2xl text-xs text-slate-300 sm:text-sm leading-relaxed">
              Monitor live store metrics, customer orders, user management, and delivery dispatch controls in real time.
            </p>
          </div>

          {/* HEADER CONTROLS */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* ASSIGNMENT MODE TOGGLE */}
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-2.5 backdrop-blur-md border border-white/15">
              <div className="text-left px-1">
                <p className="text-[11px] font-bold text-white leading-none">Dispatch Mode</p>
                <p className="text-[10px] font-semibold text-slate-300 mt-1">
                  {autoAssignEnabled ? "Auto Dispatch (ON)" : "Manual Dispatch (OFF)"}
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleAutoAssign}
                disabled={togglingAutoAssign}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoAssignEnabled ? "bg-emerald-500" : "bg-slate-600"
                }`}
                title="Toggle Auto / Manual Delivery Assignment Mode"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    autoAssignEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* EXPORT CSV BUTTON */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition active:scale-95"
              title="Download complete sales report in CSV format"
            >
              <FileSpreadsheet size={16} />
              <span>Export Sales CSV</span>
            </button>

            {/* REFRESH BUTTON */}
            <button
              type="button"
              onClick={() => fetchDashboardStats(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md border border-white/15 shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin text-blue-400" : ""}
              />
              <span>{refreshing ? "Updating..." : "Refresh"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS BAR */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Quick Actions & Shortcuts
          </h2>
        </div>

        <section className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="group flex items-center gap-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs hover:border-emerald-300 hover:bg-emerald-100/80 hover:shadow-md transition text-left"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white group-hover:scale-105 transition shadow-xs">
              <Smartphone size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-emerald-950 group-hover:text-emerald-700 transition">Smartphones Category</p>
              <p className="text-[11px] font-semibold text-emerald-700 truncate">Mobile & 5G Catalog</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md transition text-left"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition">
              <PlusCircle size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900 group-hover:text-blue-600 transition">Add Product</p>
              <p className="text-[11px] font-medium text-slate-400 truncate">Inventory Catalog</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/coupons")}
            className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-purple-200 hover:bg-purple-50/40 hover:shadow-md transition text-left"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:scale-105 transition">
              <Ticket size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900 group-hover:text-purple-600 transition">Manage Coupons</p>
              <p className="text-[11px] font-medium text-slate-400 truncate">Promo Campaigns</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/delivery")}
            className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-md transition text-left"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition">
              <Truck size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-600 transition">Delivery Boys</p>
              <p className="text-[11px] font-medium text-slate-400 truncate">Rider Management</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/payments")}
            className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-amber-200 hover:bg-amber-50/40 hover:shadow-md transition text-left"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition">
              <Banknote size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900 group-hover:text-amber-600 transition">Driver Payouts</p>
              <p className="text-[11px] font-medium text-slate-400 truncate">COD Settlement</p>
            </div>
          </button>
        </section>
      </div>

      {/* ERROR */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle
            size={20}
            className="mt-0.5 text-red-600"
          />

          <div>
            <p className="text-sm font-semibold text-red-800">
              Unable to load dashboard
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          ORDER & SALES STATISTICS
      ===================================================== */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Order & Sales Statistics
          </h2>

          <button
            onClick={() => navigate("/admin/payments")}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
          >
            <span>Manage All Transactions</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Orders"
            value={orderStats.totalOrders.toString()}
            subtext="All time orders"
            icon={ShoppingBag}
            iconStyle="bg-blue-50 text-blue-600"
            onClick={() => navigate("/admin/payments")}
          />

          <StatCard
            title="Total Sales"
            value={`₹${Number(orderStats.totalRevenue || 0).toLocaleString("en-IN")}`}
            subtext="Paid transactions"
            icon={Banknote}
            iconStyle="bg-emerald-50 text-emerald-600"
            onClick={() => navigate("/admin/payments")}
          />

          <StatCard
            title="Processing"
            value={orderStats.processingOrders.toString()}
            subtext="Awaiting fulfillment"
            icon={Clock3}
            iconStyle="bg-amber-50 text-amber-600"
            onClick={() => navigate("/admin/payments")}
          />

          <StatCard
            title="Shipped"
            value={orderStats.shippedOrders.toString()}
            subtext="In transit"
            icon={Truck}
            iconStyle="bg-indigo-50 text-indigo-600"
            onClick={() => navigate("/admin/payments")}
          />

          <StatCard
            title="Delivered"
            value={orderStats.deliveredOrders.toString()}
            subtext="Completed orders"
            icon={CheckCircle2}
            iconStyle="bg-teal-50 text-teal-600"
            onClick={() => navigate("/admin/payments")}
          />
        </section>
      </div>

      {/* =====================================================
          USER STATISTICS
      ===================================================== */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            User Account Statistics
          </h2>

          <button
            onClick={() => navigate("/admin/users")}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
          >
            <span>Manage Platform Users</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            subtext="Registered platform accounts"
            icon={Users}
            iconStyle="bg-blue-50 text-blue-600"
            onClick={() => navigate("/admin/users")}
          />

          <StatCard
            title="Active Users"
            value={stats.activeUsers.toLocaleString()}
            subtext="Active client/admin accounts"
            icon={UserCheck}
            iconStyle="bg-emerald-50 text-emerald-600"
            onClick={() => navigate("/admin/users")}
          />

          <StatCard
            title="Administrators"
            value={stats.administrators.toLocaleString()}
            subtext="Admin role accounts"
            icon={ShieldCheck}
            iconStyle="bg-violet-50 text-violet-600"
            onClick={() => navigate("/admin/users")}
          />

          <StatCard
            title="Deleted Users"
            value={stats.deletedUsers.toLocaleString()}
            subtext="Stored in Bin"
            icon={UserX}
            iconStyle="bg-red-50 text-red-600"
            onClick={() => navigate("/admin/bin")}
          />

          <StatCard
            title="Delivery Management"
            value="Personnel"
            subtext="Manage delivery boys & status"
            icon={Truck}
            iconStyle="bg-indigo-50 text-indigo-600"
            onClick={() => navigate("/admin/delivery")}
          />
        </section>
      </div>

      {/* =====================================================
          STORE CATALOG CATEGORY BREAKDOWN
      ===================================================== */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold border border-emerald-100">
                <Smartphone size={17} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Store Categories Overview ({categoryBreakdown.length} Categories)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Live product counts, percentage share, and inventory metrics across all categories including Smartphones.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
          >
            <span>Manage Products Catalog</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {categoryBreakdown.map((cat) => {
            const isSmartphone = cat.name.toLowerCase().includes("phone") || cat.name.toLowerCase().includes("smartphone");
            return (
              <div
                key={cat.name}
                onClick={() => navigate("/admin/products")}
                className={`cursor-pointer group rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  isSmartphone
                    ? "border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 hover:border-emerald-300"
                    : "border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-blue-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-extrabold uppercase tracking-wider ${isSmartphone ? "text-emerald-800" : "text-slate-500"}`}>
                    {cat.name}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${isSmartphone ? "bg-emerald-600 text-white" : "bg-blue-100 text-blue-700"}`}>
                    {cat.count} {cat.count === 1 ? "item" : "items"}
                  </span>
                </div>

                <p className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
                  {cat.count}
                </p>

                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isSmartphone ? "bg-emerald-500" : "bg-blue-500"}`}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] font-bold text-slate-400 text-right">
                  {cat.percentage}% of catalog
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================
          RECENT LIVE ORDERS SECTION
      ===================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Recent Live Orders
            </h2>
            <p className="text-xs text-slate-500">
              Latest purchases made by store customers in real-time.
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/payments")}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            View All Payments & Orders <ChevronRight size={14} />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <Package size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">No orders placed yet</p>
            <p className="mt-1 text-xs text-slate-400">Customer checkout orders will appear here automatically.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Date</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr
                    key={order._id || order.orderId}
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-blue-50/60 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {order.orderId}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{order.clientInfo?.name || "Customer"}</p>
                      <p className="text-xs text-slate-400">{order.clientInfo?.email || order.clientInfo?.contact || "-"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {order.paymentMethod === "UPI" ? (
                          <QrCode size={13} className="text-purple-600" />
                        ) : order.paymentMethod === "Card" ? (
                          <CreditCard size={13} className="text-blue-600" />
                        ) : (
                          <Banknote size={13} className="text-emerald-600" />
                        )}
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          order.orderStatus === "Completed" || order.orderStatus === "Delivered"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : order.orderStatus === "Shipped"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : order.orderStatus === "Cancelled"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {order.orderStatus || "Processing"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-100 transition"
                      >
                        <Eye size={13} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MAIN CONTENT DISTRIBUTION */}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* USER OVERVIEW */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              User Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current platform user distribution.
            </p>
          </div>

          <div className="mt-8 space-y-7">
            {/* CLIENTS */}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus
                    size={17}
                    className="text-blue-600"
                  />

                  <span className="text-sm font-medium text-slate-600">
                    Clients
                  </span>
                </div>

                <span className="text-sm font-semibold text-slate-900">
                  {stats.clients}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-700"
                  style={{
                    width: `${clientPercentage}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                {clientPercentage}% of active users
              </p>
            </div>

            {/* ADMIN */}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    size={17}
                    className="text-violet-600"
                  />

                  <span className="text-sm font-medium text-slate-600">
                    Administrators
                  </span>
                </div>

                <span className="text-sm font-semibold text-slate-900">
                  {stats.administrators}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-700"
                  style={{
                    width: `${adminPercentage}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                {adminPercentage}% of active users
              </p>
            </div>

            {/* DELETED */}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserX
                    size={17}
                    className="text-red-600"
                  />

                  <span className="text-sm font-medium text-slate-600">
                    Deleted Accounts
                  </span>
                </div>

                <span className="text-sm font-semibold text-slate-900">
                  {stats.deletedUsers}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-red-500 transition-all duration-700"
                  style={{
                    width: `${deletedPercentage}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Currently stored in Bin
              </p>
            </div>
          </div>
        </div>

        {/* PLATFORM HEALTH */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Platform Health
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current system overview.
            </p>
          </div>

          <div className="mt-7 space-y-6">
            <HealthItem
              label="Active Users"
              value={
                stats.totalUsers > 0
                  ? "100%"
                  : "0%"
              }
              width={
                stats.totalUsers > 0
                  ? "100%"
                  : "0%"
              }
            />

            <HealthItem
              label="Client Accounts"
              value={`${clientPercentage}%`}
              width={`${clientPercentage}%`}
            />

            <HealthItem
              label="Administrator Accounts"
              value={`${adminPercentage}%`}
              width={`${adminPercentage}%`}
            />

            <HealthItem
              label="System Health"
              value="100%"
              width="100%"
            />
          </div>

          <div className="mt-8 rounded-xl bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Activity size={19} />
              </div>

              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  System operational
                </p>

                <p className="text-xs text-emerald-600">
                  Platform is operating normally.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOW STOCK ALERT SECTION */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Package size={20} className="text-amber-500" />
              Low Stock Alerts (Stock ≤ 5)
            </h2>
            <p className="text-xs text-slate-500">
              Products that need restocked soon.
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/products")}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            Manage Inventory <ChevronRight size={14} />
          </button>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="p-6 text-center">
            <CheckCircle2 size={28} className="mx-auto text-emerald-500" />
            <p className="mt-2 text-xs font-semibold text-slate-700">All products have healthy inventory levels!</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {lowStockProducts.map((prod) => (
              <div key={prod._id || prod.id} className="relative flex flex-col justify-between rounded-2xl border border-amber-200/80 bg-amber-50/20 p-2.5 shadow-xs hover:border-amber-300 transition">
                <ProductCard
                  product={prod}
                  isAdmin={true}
                  onViewDetails={(product) => setViewingProduct(product)}
                />
                <div className="mt-2 flex items-center justify-between border-t border-amber-200/60 pt-2 gap-1">
                  <span className="text-[10px] font-bold text-amber-800">Restock:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickRestock(prod, 10)}
                      className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                      title="Add +10 to stock"
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickRestock(prod, 50)}
                      className="rounded-lg bg-blue-600 px-2 py-1 text-[10px] font-bold text-white shadow-xs hover:bg-blue-700 transition"
                      title="Add +50 to stock"
                    >
                      +50
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STORE CATALOG OVERVIEW PRODUCT CARDS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag size={20} className="text-blue-600" />
              Store Catalog Preview
            </h2>
            <p className="text-xs text-slate-500">
              Live products available in the client shop.
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/products")}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            View Full Inventory <ChevronRight size={14} />
          </button>
        </div>

        {storeProducts.length === 0 ? (
          <div className="p-8 text-center">
            <Package size={32} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">No products created yet</p>
            <button
              onClick={() => navigate("/admin/products")}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
            >
              + Create First Product
            </button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {storeProducts.slice(0, 10).map((prod) => (
              <ProductCard
                key={prod._id || prod.id}
                product={prod}
                isAdmin={true}
                onViewDetails={(product) => setViewingProduct(product)}
              />
            ))}
          </div>
        )}
      </div>

      {/* QUICK STATS */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MiniStat
          label="Clients"
          value={stats.clients}
          icon={<Users size={18} />}
        />

        <MiniStat
          label="Administrators"
          value={stats.administrators}
          icon={<ShieldCheck size={18} />}
        />

        <MiniStat
          label="In Bin"
          value={stats.deletedUsers}
          icon={<UserX size={18} />}
        />
      </section>

      {/* ORDER DETAILS POPUP MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/70">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Order Details ({selectedOrder.orderId || selectedOrder.id})
                </h3>
                <p className="text-xs text-slate-400">
                  Placed on {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString("en-IN") : selectedOrder.date || "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* CUSTOMER INFO */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-2 text-xs bg-slate-50/50">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Customer Information</p>
                <div className="flex justify-between">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-semibold text-slate-900">{selectedOrder.clientInfo?.name || "Customer"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.clientInfo?.email || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.clientInfo?.contact || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Address:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[220px]">
                    {selectedOrder.clientInfo?.address || selectedOrder.shippingAddress || "-"}
                  </span>
                </div>
              </div>

              {/* PAYMENT & LOGISTICS STATUS */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Payment & Status</p>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="font-bold text-blue-600">{selectedOrder.paymentMethod || "UPI"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status:</span>
                  <span className={`font-bold ${
                    selectedOrder.paymentStatus === "Completed" || selectedOrder.paymentStatus === "Verified"
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}>
                    {selectedOrder.paymentStatus || (selectedOrder.paymentMethod === "COD" ? "Processing" : "Completed")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fulfillment Status:</span>
                  <span className={`font-bold ${
                    selectedOrder.orderStatus === "Completed" || selectedOrder.orderStatus === "Delivered"
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}>
                    {selectedOrder.orderStatus || "Processing"}
                  </span>
                </div>
                {selectedOrder.paymentDetails?.upiTransactionRef && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">UPI Transaction Ref:</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedOrder.paymentDetails.upiTransactionRef}</span>
                  </div>
                )}
                {selectedOrder.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tracking #:</span>
                    <span className="font-semibold text-slate-800">{selectedOrder.trackingNumber}</span>
                  </div>
                )}
              </div>

              {/* PURCHASED ITEMS */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Items Purchased</h4>
                <div className="space-y-2 border-t border-slate-100 pt-2">
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm items-center">
                        <span className="text-slate-700 font-medium">
                          {item.name} <span className="text-xs text-slate-400">x{item.qty || 1}</span>
                        </span>
                        <span className="font-bold text-slate-900">₹{(item.price * (item.qty || 1)).toLocaleString("en-IN")}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400">No item breakdown available.</div>
                  )}
                </div>
              </div>

              {/* FINANCIAL BREAKDOWN */}
              <div className="rounded-xl bg-slate-900 p-4 text-white text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal</span>
                  <span>₹{Number(selectedOrder.subtotal || selectedOrder.totalAmount || 0).toLocaleString("en-IN")}</span>
                </div>
                {selectedOrder.shippingFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Shipping</span>
                    <span>₹{selectedOrder.shippingFee}</span>
                  </div>
                )}
                {selectedOrder.codCharge > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>COD Handling Fee</span>
                    <span>+₹{selectedOrder.codCharge}</span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-sm">
                  <span>Grand Total</span>
                  <span className="text-emerald-400 text-base">₹{Number(selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 p-4 flex items-center justify-between bg-slate-50/50">
              {selectedOrder.orderStatus !== "Confirmed" && selectedOrder.orderStatus !== "Completed" && selectedOrder.orderStatus !== "Delivered" && selectedOrder.orderStatus !== "Cancelled" ? (
                <button
                  type="button"
                  onClick={() => handleConfirmOrderByOwner(selectedOrder._id || selectedOrder.orderId)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-md transition"
                >
                  <CheckCircle2 size={15} />
                  Approve & Confirm Order
                </button>
              ) : (
                <span className="text-xs font-semibold text-slate-400">
                  Status: <strong className="text-slate-800">{selectedOrder.orderStatus}</strong>
                </span>
              )}
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-sm"
              >
                Close Order Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT DETAILS POPUP MODAL FOR ADMIN */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/70">
              <h3 className="text-lg font-bold text-slate-900">Product Details</h3>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-center bg-slate-50 p-4 rounded-xl border">
                <img
                  src={viewingProduct.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80"}
                  alt={viewingProduct.name}
                  className="h-44 object-contain"
                />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">{viewingProduct.category || "General"}</span>
                <h4 className="text-lg font-bold text-slate-900 mt-1">{viewingProduct.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{viewingProduct.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Selling Price:</span>
                  <span className="text-base font-extrabold text-slate-900">₹{viewingProduct.price}</span>
                  {viewingProduct.originalPrice > viewingProduct.price && (
                    <span className="text-xs text-slate-400 line-through block">₹{viewingProduct.originalPrice}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Stock Status:</span>
                  <span className={`font-bold ${
                    Number(viewingProduct.stock) <= 0
                      ? "text-rose-600"
                      : Number(viewingProduct.stock) <= 5
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}>
                    {Number(viewingProduct.stock) <= 0 ? "Out of Stock (0)" : `${viewingProduct.stock} Units`}
                  </span>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 p-4 flex justify-between bg-slate-50/70 items-center">
              <button
                onClick={() => {
                  setViewingProduct(null);
                  navigate("/admin/products");
                }}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                Edit in Inventory <ChevronRight size={14} />
              </button>
              <button
                onClick={() => setViewingProduct(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================
// HEALTH ITEM
// =====================================================

const HealthItem = ({
  label,
  value,
  width,
}) => {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-slate-600">
          {label}
        </span>

        <span className="text-sm font-semibold text-slate-800">
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-700"
          style={{ width }}
        />
      </div>
    </div>
  );
};

// =====================================================
// MINI STAT
// =====================================================

const MiniStat = ({
  label,
  value,
  icon,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;