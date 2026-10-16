import {
  User,
  Bell,
  ShieldCheck,
  ArrowUpRight,
  ShoppingBag,
  ShoppingCart,
  Heart,
  Package,
  Clock3,
  CheckCircle2,
  Truck,
  MapPin,
  Eye,
  X,
  Smartphone,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import axios from "axios";
import { PAYMENT_API_URL, USER_API_URL } from "../../config/api.js";
import { getCartCount } from "../../utils/cartUtils.js";
import { getWishlistCount } from "../../utils/wishlistUtils.js";

import { useEffect, useState, useCallback } from "react";

const ClientDashboard = () => {
  const navigate = useNavigate();

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const firstName = user?.name?.split(" ")?.[0] || "Client";

  const [orders, setOrders] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // 1. Cart & Wishlist counts
    try {
      setCartCount(getCartCount());
      setWishlistCount(getWishlistCount());
    } catch (e) {
      console.error(e);
    }

    // 2. Default Address from MongoDB
    try {
      const addrRes = await axios.get(`${USER_API_URL}/addresses`, { headers });
      if (addrRes.data?.success && Array.isArray(addrRes.data.addresses)) {
        const addrs = addrRes.data.addresses;
        const def = addrs.find((a) => a.isDefault) || addrs[0] || null;
        setDefaultAddress(def);
      }
    } catch (e) {
      console.error("Address fetch note:", e);
    }

    // 3. Orders from MongoDB
    try {
      setLoading(true);
      const response = await axios.get(`${PAYMENT_API_URL}/orders`, { headers });
      if (response.data?.success && Array.isArray(response.data.orders)) {
        setOrders(response.data.orders);
        return;
      }
    } catch (e) {
      console.error("Dashboard order fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const handleUpdates = () => fetchDashboardData();
    window.addEventListener("cartUpdated", handleUpdates);
    window.addEventListener("wishlistUpdated", handleUpdates);
    window.addEventListener("storage", handleUpdates);

    return () => {
      window.removeEventListener("cartUpdated", handleUpdates);
      window.removeEventListener("wishlistUpdated", handleUpdates);
      window.removeEventListener("storage", handleUpdates);
    };
  }, [fetchDashboardData]);

  const totalOrdersCount = orders.length;
  const activeOrdersCount = orders.filter((o) => {
    const st = o.status || o.orderStatus;
    return st !== "Completed" && st !== "Delivered" && st !== "Cancelled";
  }).length;
  const completedOrdersCount = orders.filter((o) => {
    const st = o.status || o.orderStatus;
    return st === "Completed" || st === "Delivered";
  }).length;

  const recentOrders = orders.slice(0, 5).map((o) => ({
    id: o.orderId || o.id || o._id,
    date: o.date || (o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "-"),
    items: o.items ? o.items.length : 1,
    amount: `₹${o.totalAmount || o.total || 0}`,
    status: o.orderStatus || o.status || "Processing",
    rawOrder: o,
  }));

  const stats = [
    {
      title: "Total Orders",
      value: totalOrdersCount.toString(),
      description: "Lifetime purchases",
      icon: ShoppingBag,
      iconClass: "bg-blue-50 text-blue-600",
    },
    {
      title: "Active Orders",
      value: activeOrdersCount.toString(),
      description: "In processing / transit",
      icon: Clock3,
      iconClass: "bg-amber-50 text-amber-600",
    },
    {
      title: "Completed Orders",
      value: completedOrdersCount.toString(),
      description: "Delivered & received",
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Cart & Wishlist Items",
      value: `${cartCount} Cart / ${wishlistCount} Saved`,
      description: "Active cart & saved items",
      icon: ShoppingCart,
      iconClass: "bg-violet-50 text-violet-600",
    },
  ];

  // =====================================================
  // QUICK ACTIONS
  // =====================================================

  const quickActions = [
    {
      icon: ShoppingBag,
      title: "Start Shopping",
      description: "Browse our latest products",
      path: "/client/shop",
    },
    {
      icon: Package,
      title: "My Orders",
      description: "Track your previous orders",
      path: "/client/orders",
    },
    {
      icon: Heart,
      title: "Wishlist",
      description: "View your saved products",
      path: "/client/wishlist",
    },
    {
      icon: User,
      title: "My Profile",
      description: "Manage your personal information",
      path: "/client/profile",
    },
  ];

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

        <div>
          <p className="text-sm font-semibold text-blue-600">
            Client Portal
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back, {firstName}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your shopping, orders and account from one place.
          </p>
        </div>

        <button
          onClick={() => navigate("/client/shop")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <ShoppingBag size={17} />
          Start Shopping
        </button>

      </div>

      {/* =================================================
          WELCOME CARD
      ================================================= */}

      <div className="overflow-hidden rounded-2xl bg-blue-600 p-6 text-white shadow-sm sm:p-8">

        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">

          <div>

            <p className="text-sm font-medium text-blue-100">
              Your shopping dashboard
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Everything you need, in one place.
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
              Browse products, manage your cart, track your orders
              and keep your account information up to date.
            </p>

            <button
              onClick={() => navigate("/client/shop")}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              Explore Products
              <ArrowUpRight size={16} />
            </button>

          </div>

          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <ShoppingBag size={34} />
          </div>

        </div>

      </div>

      {/* =================================================
          STAT CARDS
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">

        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >

              <div className="flex items-start justify-between">

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconClass}`}
                >
                  <Icon size={20} />
                </div>

                <ArrowUpRight
                  size={18}
                  className="text-slate-300"
                />

              </div>

              <div className="mt-5">

                <p className="text-sm font-medium text-slate-500">
                  {stat.title}
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {stat.value}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {stat.description}
                </p>

              </div>

            </div>
          );
        })}

      </div>

      {/* =================================================
          SHOP BY CATEGORY SHORTCUTS
      ================================================= */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-bold border border-emerald-100">
              <Smartphone size={16} />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              Explore Store Categories
            </h2>
          </div>
          <button
            onClick={() => navigate("/client/shop")}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition flex items-center gap-1"
          >
            <span>View All Store Items</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {[
            { name: "Smartphones", color: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100", label: "Smartphones & 5G" },
            { name: "Electronics", color: "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100", label: "Electronics & Audio" },
            { name: "Gadgets", color: "bg-violet-50 text-violet-800 border-violet-200 hover:bg-violet-100", label: "Smart Gadgets" },
            { name: "Books", color: "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100", label: "Books & Literature" },
            { name: "Computer Accessories", color: "bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100", label: "PC Peripherals" },
          ].map((cat) => (
            <button
              key={cat.name}
              onClick={() => navigate(`/client/shop?category=${encodeURIComponent(cat.name)}`)}
              className={`flex items-center justify-between rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-xs ${cat.color}`}
            >
              <div>
                <p className="text-xs font-bold leading-tight">{cat.name}</p>
                <p className="text-[10px] font-medium opacity-80 mt-0.5">{cat.label}</p>
              </div>
              <ArrowUpRight size={14} className="shrink-0 opacity-70" />
            </button>
          ))}
        </div>
      </div>

      {/* =================================================
          RECENT ORDERS + ACCOUNT
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* =================================================
            RECENT ORDERS
        ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="font-semibold text-slate-900">
                Recent Orders
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Track your latest purchases.
              </p>
            </div>

            <button
              onClick={() => navigate("/client/orders")}
              className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
            >
              View all
            </button>

          </div>

          <div className="mt-6">

            {recentOrders.length === 0 ? (

              <div className="rounded-xl bg-slate-50 p-8 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                  <Package size={22} />
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-700">
                  No orders yet
                </p>

                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  Your recent orders will appear here after you
                  make your first purchase.
                </p>

                <button
                  onClick={() => navigate("/client/shop")}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                  <ShoppingBag size={15} />
                  Start Shopping
                </button>

              </div>

            ) : (

              <div className="space-y-3">

                {recentOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    onSelect={() => setSelectedOrder(order.rawOrder || order)}
                  />
                ))}

              </div>

            )}

          </div>

        </div>

        {/* =================================================
            ACCOUNT OVERVIEW
        ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="font-semibold text-slate-900">
                Account Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your account information.
              </p>
            </div>

            <ShieldCheck
              size={20}
              className="text-emerald-500"
            />

          </div>

          {/* STATUS */}

          <div className="mt-5 rounded-xl bg-emerald-50 p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={19} />
              </div>

              <div>

                <p className="text-sm font-semibold text-emerald-800">
                  Account Active
                </p>

                <p className="mt-0.5 text-xs text-emerald-600">
                  Your account is in good standing.
                </p>

              </div>

            </div>

          </div>

          {/* DETAILS */}

          <div className="mt-5 space-y-4">

            <InfoRow
              label="Name"
              value={user?.name || "Not available"}
            />

            <InfoRow
              label="Email"
              value={user?.email || "Not available"}
            />

            <InfoRow
              label="Contact"
              value={
                user?.contact ||
                user?.phone ||
                "Not available"
              }
            />

            <InfoRow
              label="Role"
              value="Client"
            />

          </div>

          <button
            onClick={() => navigate("/client/profile")}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <User size={16} />
            Manage Profile
          </button>

        </div>

      </div>

      {/* =================================================
          QUICK ACTIONS
      ================================================= */}

      <div>

        <div className="mb-4">

          <h2 className="font-semibold text-slate-900">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Quickly access your most-used options.
          </p>

        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {quickActions.map((action) => (
            <QuickAction
              key={action.title}
              icon={action.icon}
              title={action.title}
              description={action.description}
              onClick={() => navigate(action.path)}
            />
          ))}

        </div>

      </div>

      {/* =================================================
          NOTIFICATIONS + DELIVERY ADDRESS
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* NOTIFICATIONS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Bell size={19} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Notifications
              </h2>

              <p className="text-sm text-slate-500">
                Stay updated with your account.
              </p>
            </div>

          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-6 text-center">

            <Bell
              size={24}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-medium text-slate-600">
              No new notifications
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Order updates and account notifications
              will appear here.
            </p>

            <button
              onClick={() => navigate("/client/notifications")}
              className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View notifications
            </button>

          </div>

        </div>

        {/* ADDRESS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <MapPin size={19} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  Default Shipping Address
                </h2>
                <p className="text-sm text-slate-500">
                  Used automatically at checkout.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/client/addresses")}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Manage
            </button>
          </div>

          <div className="mt-5">
            {defaultAddress ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-blue-700 text-[10px]">
                    {defaultAddress.label || "HOME"}
                  </span>
                  {defaultAddress.isDefault && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Default
                    </span>
                  )}
                </div>
                <p className="font-bold text-slate-900">{defaultAddress.fullName}</p>
                {defaultAddress.phone && (
                  <p className="text-slate-500 font-medium">{defaultAddress.phone}</p>
                )}
                <p className="text-slate-600">
                  {defaultAddress.addressLine || defaultAddress.street}
                </p>
                <p className="text-slate-600 font-medium">
                  {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.pincode || defaultAddress.zip}
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-6 text-center">
                <MapPin size={24} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  No default address added
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Add an address to make checkout faster.
                </p>
                <button
                  onClick={() => navigate("/client/addresses")}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
                >
                  <MapPin size={14} />
                  Add Address
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ORDER DETAILS POPUP MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/70">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Order Receipt ({selectedOrder.id || selectedOrder.orderId})
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
              {/* LOGISTICS & DELIVERY */}
              <div className="rounded-xl bg-slate-50 p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tracking Number:</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.trackingNumber || "TRK-9821039"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Est. Delivery:</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.estimatedDelivery || "3-5 Business Days"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipping Address:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[220px]">
                    {selectedOrder.shippingAddress || selectedOrder.clientInfo?.address || "Address"}
                  </span>
                </div>
              </div>

              {/* PAYMENT DETAILS */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Payment Details</p>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="font-bold text-blue-600">{selectedOrder.paymentMethod || "UPI"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status:</span>
                  <span className={`font-bold ${
                    selectedOrder.paymentStatus === "Completed" || selectedOrder.status === "Completed"
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}>
                    {selectedOrder.paymentStatus || (selectedOrder.paymentMethod === "COD" ? "Processing" : "Completed")}
                  </span>
                </div>

                {selectedOrder.paymentDetails?.upiTransactionRef && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">UPI Ref #:</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedOrder.paymentDetails.upiTransactionRef}</span>
                  </div>
                )}

                {selectedOrder.paymentDetails?.cardLast4 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Card Used:</span>
                    <span className="font-semibold text-slate-800">•••• {selectedOrder.paymentDetails.cardLast4}</span>
                  </div>
                )}
              </div>

              {/* ITEMS LIST */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Purchased Items</h4>
                <div className="space-y-2 border-t border-slate-100 pt-2">
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, i) => {
                      const itemQty = Number(item.qty || item.quantity || 1);
                      const itemPrice = Number(item.price || item.unitPrice || 0);
                      return (
                        <div key={i} className="flex justify-between text-sm items-center">
                          <span className="text-slate-700 font-medium">
                            {item.name} <span className="text-xs font-bold text-slate-400">x{itemQty}</span>
                          </span>
                          <span className="font-bold text-slate-900">₹{(itemPrice * itemQty).toLocaleString("en-IN")}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-400">Items summary list available.</div>
                  )}
                </div>
              </div>

              {/* RECEIPT BREAKDOWN */}
              <div className="rounded-xl bg-slate-900 p-4 text-white text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal</span>
                  <span>₹{Number(selectedOrder.subtotal || selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString("en-IN")}</span>
                </div>
                {selectedOrder.shippingFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Shipping</span>
                    <span>₹{selectedOrder.shippingFee}</span>
                  </div>
                )}
                {selectedOrder.codCharge > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>COD Extra Charge</span>
                    <span>+₹{selectedOrder.codCharge}</span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-sm">
                  <span>Grand Total</span>
                  <span className="text-emerald-400 text-base">₹{Number(selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 p-4 flex justify-between items-center bg-slate-50/50">
              <span className="text-xs text-slate-500">Status: <span className="font-bold text-slate-800">{selectedOrder.orderStatus || selectedOrder.status || "Processing"}</span></span>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-sm"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================
// INFO ROW
// =====================================================

const InfoRow = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="max-w-[60%] truncate text-right text-sm font-medium text-slate-800">
        {value}
      </span>

    </div>
  );
};

// =====================================================
// QUICK ACTION
// =====================================================

const QuickAction = ({
  icon: Icon,
  title,
  description,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-blue-50 group-hover:text-blue-600">
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">

        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>

      </div>

      <ArrowUpRight
        size={17}
        className="text-slate-300 transition group-hover:text-blue-500"
      />

    </button>
  );
};

// =====================================================
// ORDER ROW
// =====================================================

const OrderRow = ({ order, onSelect }) => {

  const statusConfig = {
    Completed: {
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-600",
    },

    Delivered: {
      icon: CheckCircle2,
      className: "bg-emerald-600 text-white",
    },

    Shipped: {
      icon: Truck,
      className: "bg-blue-50 text-blue-600",
    },

    Processing: {
      icon: Clock3,
      className: "bg-amber-50 text-amber-600",
    },
  };

  const config =
    statusConfig[order.status] ||
    statusConfig.Processing;

  const Icon = config.icon;

  return (
    <div
      onClick={onSelect}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-slate-50/70 cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.className}`}
        >
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-slate-900 truncate">
            {order.id}
          </p>

          <p className="mt-0.5 text-xs font-medium text-slate-500">
            {order.date} • {order.items} {order.items === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-slate-100 pt-2 sm:border-0 sm:pt-0">
        <div className="text-left sm:text-right">
          <p className="text-sm font-extrabold text-slate-900">
            {order.amount}
          </p>

          <p className="mt-0.5 text-xs font-bold text-blue-600">
            {order.status}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onSelect) onSelect();
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition shadow-xs"
          title="View Details"
        >
          <Eye size={15} />
        </button>
      </div>
    </div>
  );
};

export default ClientDashboard;