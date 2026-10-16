import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "../../utils/toast.js";
import { DELIVERY_API_URL } from "../../config/api.js";
import {
  Truck,
  Package,
  Navigation,
  CheckCircle2,
  RefreshCw,
  MapPin,
  Phone,
  Eye,
  Search,
  Calendar,
  CreditCard,
  XCircle,
  MessageCircle,
} from "lucide-react";

const DeliveryOrders = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState(
    searchParams.get("status") || "All"
  );
  const [actionLoading, setActionLoading] = useState("");
  const [rejectConfirmOrder, setRejectConfirmOrder] = useState(null);

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam) {
      setSelectedFilter(statusParam);
    }
  }, [searchParams]);

  // FETCH ORDERS
  const fetchOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(`${DELIVERY_API_URL}/orders`, { headers });
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error("Fetch delivery orders error:", err);
      toast.error(err.response?.data?.message || "Failed to load assigned deliveries");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const [otpModalOrder, setOtpModalOrder] = useState(null);
  const [inputOtp, setInputOtp] = useState("");

  // STATUS UPDATE HANDLER
  const handleUpdateStatus = async (orderId, targetAction, otpValue = null) => {
    try {
      setActionLoading(orderId);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      let endpoint = "";
      if (targetAction === "accept") endpoint = `${DELIVERY_API_URL}/orders/${orderId}/accept`;
      else if (targetAction === "pickup") endpoint = `${DELIVERY_API_URL}/orders/${orderId}/pickup`;
      else if (targetAction === "out-for-delivery") endpoint = `${DELIVERY_API_URL}/orders/${orderId}/out-for-delivery`;
      else if (targetAction === "delivered") endpoint = `${DELIVERY_API_URL}/orders/${orderId}/delivered`;

      const payload = otpValue ? { otp: otpValue } : {};
      const res = await axios.put(endpoint, payload, { headers });

      if (res.data?.success) {
        toast.success(res.data.message || "Order status updated successfully!");
        setOtpModalOrder(null);
        setInputOtp("");
        fetchOrders(true);
      }
    } catch (err) {
      console.error("Status transition error:", err);
      toast.error(err.response?.data?.message || "Failed to update order status");
    } finally {
      setActionLoading("");
    }
  };

  // FILTERING LOGIC
  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    const orderId = order.orderId?.toLowerCase() || "";
    const name = order.clientInfo?.name?.toLowerCase() || "";
    const phone = order.clientInfo?.contact?.toLowerCase() || "";
    const address = (order.clientInfo?.address || order.shippingAddress || "").toLowerCase();

    const matchesSearch =
      orderId.includes(query) ||
      name.includes(query) ||
      phone.includes(query) ||
      address.includes(query);

    if (!matchesSearch) return false;

    if (selectedFilter === "All") return true;

    const currentStatus = order.deliveryStatus || order.delivery?.assignmentStatus || "Unassigned";
    return currentStatus === selectedFilter;
  });

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
          Loading your assigned deliveries...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Driver Partner Portal</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Assigned Deliveries
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View orders strictly assigned to your driver account and perform live status transitions.
          </p>
        </div>

        <button
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
        >
          <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID, client name, phone or address..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {["All", "Assigned", "Accepted", "Picked Up", "Out for Delivery", "Delivered"].map((tab) => {
            const count = tab === "All"
              ? orders.length
              : orders.filter((o) => (o.deliveryStatus || o.delivery?.assignmentStatus || "Unassigned") === tab).length;

            return (
              <button
                key={tab}
                onClick={() => {
                  setSelectedFilter(tab);
                  setSearchParams(tab === "All" ? {} : { status: tab });
                }}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedFilter === tab
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                    selectedFilter === tab
                      ? "bg-blue-700 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ORDERS CARDS LIST */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Truck size={32} />
          </div>
          <h3 className="mt-5 text-lg font-bold text-slate-800">No assigned deliveries found</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            {selectedFilter !== "All"
              ? `No deliveries found with status '${selectedFilter}'. Try selecting another filter tab.`
              : "When admin assigns customer orders to you, they will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredOrders.map((order) => {
            const currentStatus = order.deliveryStatus || order.delivery?.assignmentStatus || "Assigned";
            const isUpdating = actionLoading === order._id;

            return (
              <div
                key={order._id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 hover:shadow-md transition flex flex-col justify-between"
              >
                {/* TOP HEADER */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <button
                      onClick={() => navigate(`/delivery/orders/${order._id}`)}
                      className="font-extrabold text-blue-600 text-lg hover:underline text-left block"
                    >
                      {order.orderId}
                    </button>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar size={13} />
                      Order Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "-"}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getStatusBadgeColor(
                      currentStatus
                    )}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        currentStatus === "Delivered" ? "bg-emerald-500" : "bg-blue-500"
                      }`}
                    />
                    {currentStatus}
                  </span>
                </div>

                {/* CLIENT & ADDRESS DETAILS */}
                <div className="space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      {order.clientInfo?.name || "Customer Name"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${order.clientInfo?.contact}`}
                        className="inline-flex items-center gap-1 font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition"
                      >
                        <Phone size={13} /> {order.clientInfo?.contact || "N/A"}
                      </a>
                      <a
                        href={`https://wa.me/${(order.clientInfo?.contact || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                          `Hello ${order.clientInfo?.name || "Customer"}, I am your ElectroZone delivery partner regarding your order #${
                            order.orderId || ""
                          }. I am en route for delivery!`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition"
                        title="Chat with Customer on WhatsApp"
                      >
                        <MessageCircle size={13} className="text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-slate-600 flex items-start gap-1.5 min-w-0 flex-1">
                      <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="font-semibold text-slate-800">
                        {order.clientInfo?.address || order.shippingAddress || "Delivery Address not provided"}
                      </span>
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.clientInfo?.address || order.shippingAddress || "Bengaluru")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition shrink-0 ml-2 active:scale-95"
                      title="Open Turn-by-Turn GPS Directions in Google Maps"
                    >
                      <Navigation size={13} />
                      <span>GPS Map</span>
                    </a>
                  </div>
                </div>

                {/* FINANCIAL & ORDER STATUS INFO */}
                <div className="grid grid-cols-2 gap-2 text-xs py-1">
                  <div className="rounded-xl border border-slate-200 p-2.5 space-y-1">
                    <p className="text-slate-400 font-semibold">Total Amount</p>
                    <p className="font-extrabold text-slate-900 text-base">
                      ₹{Number(order.totalAmount || order.total || 0).toLocaleString("en-IN")}
                    </p>
                    <p className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                      <CreditCard size={11} /> {order.paymentMethod || "COD"} ({order.paymentStatus || "Pending"})
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-2.5 space-y-1">
                    <p className="text-slate-400 font-semibold">Order / Delivery Status</p>
                    <p className="font-bold text-slate-800">{order.orderStatus || "Confirmed"}</p>
                    <p className="text-[11px] text-slate-500">
                      Est. Delivery: {order.estimatedDelivery || "Standard 2-3 Days"}
                    </p>
                  </div>
                </div>

                {/* ACTION BUTTON & DETAILS LINK */}
                <div className="pt-2 space-y-2 border-t border-slate-100">
                  {/* Status transition action button */}
                  {currentStatus === "Assigned" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(order._id, "accept")}
                        disabled={isUpdating}
                        className="flex-1 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                      >
                        {isUpdating ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        Accept Delivery
                      </button>

                      <button
                        type="button"
                        onClick={() => setRejectConfirmOrder(order)}
                        disabled={isUpdating}
                        className="flex-1 rounded-xl border border-rose-200 bg-rose-50 py-3 text-xs font-bold text-rose-600 hover:bg-rose-100 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
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
                      className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                    >
                      {isUpdating ? <RefreshCw size={15} className="animate-spin" /> : <Package size={16} />}
                      Mark Picked Up
                    </button>
                  )}

                  {currentStatus === "Picked Up" && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, "out-for-delivery")}
                      disabled={isUpdating}
                      className="w-full rounded-xl bg-purple-600 py-3 text-xs font-bold text-white hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                    >
                      {isUpdating ? <RefreshCw size={15} className="animate-spin" /> : <Navigation size={16} />}
                      Out for Delivery
                    </button>
                  )}

                  {currentStatus === "Out for Delivery" && (
                    <button
                      onClick={() => {
                        setOtpModalOrder(order);
                        setInputOtp("");
                      }}
                      disabled={isUpdating}
                      className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                    >
                      {isUpdating ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      Enter Customer OTP to Complete
                    </button>
                  )}

                  {currentStatus === "Delivered" && (
                    <div className="w-full rounded-xl bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 border border-emerald-200 flex items-center justify-center gap-2">
                      <CheckCircle2 size={16} /> Completed & Delivered
                    </div>
                  )}

                  {/* View Details Link */}
                  <button
                    onClick={() => navigate(`/delivery/orders/${order._id}`)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                  >
                    <Eye size={14} /> View Order & Timeline Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DELIVERY OTP VERIFICATION MODAL */}
      {otpModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
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

export default DeliveryOrders;
