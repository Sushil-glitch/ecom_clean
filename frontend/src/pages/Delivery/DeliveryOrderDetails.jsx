import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "../../utils/toast.js";
import { DELIVERY_API_URL } from "../../config/api.js";
import {
  ArrowLeft,
  Package,
  Clock,
  Navigation,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  User,
  AlertCircle,
  MessageCircle,
} from "lucide-react";

const DeliveryOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(`${DELIVERY_API_URL}/orders/${id}`, { headers });
      if (res.data?.success) {
        setOrder(res.data.order || null);
      }
    } catch (err) {
      console.error("Fetch order details error:", err);
      toast.error(err.response?.data?.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [inputOtp, setInputOtp] = useState("");

  // STATUS UPDATE HANDLER
  const handleUpdateStatus = async (targetAction, otpValue = null) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      let endpoint = "";
      if (targetAction === "accept") endpoint = `${DELIVERY_API_URL}/orders/${id}/accept`;
      else if (targetAction === "pickup") endpoint = `${DELIVERY_API_URL}/orders/${id}/pickup`;
      else if (targetAction === "out-for-delivery") endpoint = `${DELIVERY_API_URL}/orders/${id}/out-for-delivery`;
      else if (targetAction === "delivered") endpoint = `${DELIVERY_API_URL}/orders/${id}/delivered`;

      const payload = otpValue ? { otp: otpValue } : {};
      const res = await axios.put(endpoint, payload, { headers });

      if (res.data?.success) {
        toast.success(res.data.message || "Status updated successfully!");
        setShowOtpModal(false);
        setInputOtp("");
        fetchOrderDetails();
      }
    } catch (err) {
      console.error("Status update error:", err);
      toast.error(err.response?.data?.message || "Failed to update order status");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
          <RefreshCw size={20} className="animate-spin text-blue-600" />
          Loading order details...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertCircle size={28} />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-800">Order Not Found</h3>
        <p className="mt-1 text-xs text-slate-400">
          The requested order does not exist or is not assigned to your account.
        </p>
        <button
          onClick={() => navigate("/delivery/orders")}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <ArrowLeft size={15} /> Back to My Deliveries
        </button>
      </div>
    );
  }

  const currentStatus = order.deliveryStatus || order.delivery?.assignmentStatus || "Assigned";

  // Visual Timeline Steps Config
  const timelineSteps = [
    {
      key: "Assigned",
      label: "Assigned",
      date: order.assignedAt || order.delivery?.assignedAt,
      icon: Clock,
      completed: ["Assigned", "Accepted", "Picked Up", "Out for Delivery", "Delivered"].includes(currentStatus),
    },
    {
      key: "Accepted",
      label: "Accepted",
      date: order.acceptedAt || order.delivery?.acceptedAt,
      icon: CheckCircle2,
      completed: ["Accepted", "Picked Up", "Out for Delivery", "Delivered"].includes(currentStatus),
    },
    {
      key: "Picked Up",
      label: "Picked Up",
      date: order.pickedUpAt || order.delivery?.pickedUpAt,
      icon: Package,
      completed: ["Picked Up", "Out for Delivery", "Delivered"].includes(currentStatus),
    },
    {
      key: "Out for Delivery",
      label: "In Transit",
      date: order.outForDeliveryAt || order.delivery?.outForDeliveryAt,
      icon: Navigation,
      completed: ["Out for Delivery", "Delivered"].includes(currentStatus),
    },
    {
      key: "Delivered",
      label: "Delivered",
      date: order.deliveredAt || order.delivery?.deliveredAt,
      icon: CheckCircle2,
      completed: currentStatus === "Delivered",
    },
  ];

  return (
    <div className="space-y-6">
      {/* TOP HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/delivery/orders")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-xs"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="text-xs font-semibold text-blue-600">Order Details</span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{order.orderId}</h1>
          </div>
        </div>

        {/* STATUS TRANSITION BUTTON */}
        <div>
          {currentStatus === "Assigned" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateStatus("accept")}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
              >
                {actionLoading ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Accept Delivery
              </button>

              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition disabled:opacity-50"
                title="Reject this delivery assignment"
              >
                <XCircle size={15} />
                Reject Order
              </button>
            </div>
          )}

          {currentStatus === "Accepted" && (
            <button
              onClick={() => handleUpdateStatus("pickup")}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
            >
              {actionLoading ? <RefreshCw size={15} className="animate-spin" /> : <Package size={16} />}
              Mark Order Picked Up
            </button>
          )}

          {currentStatus === "Picked Up" && (
            <button
              onClick={() => handleUpdateStatus("out-for-delivery")}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-700 transition shadow-sm disabled:opacity-50"
            >
              {actionLoading ? <RefreshCw size={15} className="animate-spin" /> : <Navigation size={16} />}
              Start Out for Delivery
            </button>
          )}

          {currentStatus === "Out for Delivery" && (
            <button
              onClick={() => {
                setShowOtpModal(true);
                setInputOtp("");
              }}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
            >
              {actionLoading ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Enter OTP to Complete Delivery
            </button>
          )}

          {currentStatus === "Delivered" && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={16} /> Completed & Delivered
            </span>
          )}
        </div>
      </div>

      {/* VISUAL TIMELINE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6">
          Delivery Status Progress Timeline
        </h3>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-5 relative">
          {timelineSteps.map((step, idx) => {
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                {/* Step Circle */}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition-all ${
                    step.completed
                      ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "border-slate-200 bg-slate-50 text-slate-400"
                  }`}
                >
                  <Icon size={20} />
                </div>

                {/* Step Title */}
                <p className={`mt-3 text-xs font-bold ${step.completed ? "text-slate-900" : "text-slate-400"}`}>
                  {step.label}
                </p>

                {/* Step Timestamp */}
                <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
                  {step.date ? new Date(step.date).toLocaleDateString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Pending"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* TWO COLUMNS DETAILS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN: CUSTOMER & PAYMENT DETAILS */}
        <div className="space-y-6 lg:col-span-1">
          {/* Customer Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Customer Information
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <User size={15} className="text-slate-400 shrink-0" />
                <span className="font-bold text-slate-900 text-sm">{order.clientInfo?.name || "Customer"}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Phone size={15} className="text-slate-400 shrink-0" />
                  <a href={`tel:${order.clientInfo?.contact}`} className="font-bold text-blue-600 hover:underline">
                    {order.clientInfo?.contact || "N/A"}
                  </a>
                </div>
                <a
                  href={`https://wa.me/${(order.clientInfo?.contact || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    `Hello ${order.clientInfo?.name || "Customer"}, I am your ElectroZone delivery partner regarding your order #${
                      order.orderId || ""
                    }. I am en route for delivery!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition active:scale-95 shrink-0"
                  title="Chat with Customer on WhatsApp"
                >
                  <MessageCircle size={13} />
                  <span>WhatsApp Chat</span>
                </a>
              </div>

              <div className="flex items-center gap-2">
                <Mail size={15} className="text-slate-400 shrink-0" />
                <span className="text-slate-700">{order.clientInfo?.email || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Shipping & Delivery Address
              </h3>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.clientInfo?.address || order.shippingAddress || "Bengaluru")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition active:scale-95"
              >
                <Navigation size={13} />
                <span>Navigate GPS</span>
              </a>
            </div>

            <div className="flex items-start gap-2 text-xs">
              <MapPin size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="font-semibold text-slate-800 leading-relaxed">
                {order.clientInfo?.address || order.shippingAddress || "No address specified"}
              </p>
            </div>
          </div>

          {/* Payment & Tracking Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Payment & Tracking Details
            </h3>

            <div className="flex justify-between">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-bold text-slate-900">{order.paymentMethod || "COD"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Payment Status:</span>
              <span className={`font-bold ${order.paymentStatus === "Completed" ? "text-emerald-600" : "text-amber-600"}`}>
                {order.paymentStatus || "Pending"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Tracking Number:</span>
              <span className="font-mono font-semibold text-slate-800">{order.trackingNumber || "N/A"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Estimated Delivery:</span>
              <span className="font-semibold text-slate-800">{order.estimatedDelivery || "Standard Delivery"}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PURCHASED ITEMS & SUMMARY */}
        <div className="space-y-6 lg:col-span-2">
          {/* Purchased Items Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">
              Ordered Items Breakdown
            </h3>

            <div className="divide-y divide-slate-100">
              {Array.isArray(order.items) && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold text-xs">
                        {item.quantity || item.qty || 1}x
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.category || "General"}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-slate-900">
                        ₹{((item.price || 0) * (item.quantity || item.qty || 1)).toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-slate-400">₹{item.price} each</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4">No item breakdown recorded.</p>
              )}
            </div>

            {/* Financial Summary */}
            <div className="rounded-2xl bg-slate-900 p-5 text-white text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal Amount</span>
                <span>₹{Number(order.subtotal || order.totalAmount || 0).toLocaleString("en-IN")}</span>
              </div>

              {order.shippingFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Shipping Charges</span>
                  <span>₹{order.shippingFee}</span>
                </div>
              )}

              {order.codCharge > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>COD Handling Fee</span>
                  <span>+₹{order.codCharge}</span>
                </div>
              )}

              <div className="border-t border-slate-700 pt-3 flex justify-between font-bold text-sm">
                <span>Grand Total To Collect/Paid</span>
                <span className="text-emerald-400 text-lg">
                  ₹{Number(order.totalAmount || order.total || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DELIVERY OTP VERIFICATION MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={28} />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Enter Customer Delivery OTP</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Please ask customer <strong className="text-slate-800">{order.clientInfo?.name}</strong> for the 4-digit Delivery OTP shown on their order details screen.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!inputOtp || inputOtp.trim().length !== 4) {
                  toast.error("Please enter a valid 4-digit OTP code");
                  return;
                }
                handleUpdateStatus("delivered", inputOtp.trim());
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
                    setShowOtpModal(false);
                    setInputOtp("");
                  }}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !inputOtp}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? (
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
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
              <XCircle size={24} />
            </div>

            <h3 className="text-center text-base font-bold text-slate-900">
              Reject Delivery Assignment?
            </h3>
            <p className="mt-2 text-center text-xs text-slate-500 leading-relaxed">
              Are you sure you want to reject <strong className="text-slate-800">Order #{order?.orderId}</strong>? It will be automatically reassigned to another available delivery partner.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  handleUpdateStatus("reject");
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

export default DeliveryOrderDetails;
