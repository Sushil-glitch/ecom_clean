import { useState, useEffect } from "react";
import {
  Package,
  Clock3,
  CheckCircle2,
  Truck,
  XCircle,
  ShoppingBag,
  ChevronRight,
  CreditCard,
  QrCode,
  Banknote,
  Receipt,
  Star,
  Sparkles,
  ThumbsUp,
  X,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "../../utils/toast.js";
import { addNotification } from "../../utils/notificationUtils";
import { launchRazorpayPayment } from "../../utils/razorpay.js";

import { PAYMENT_API_URL } from "../../config/api.js";
import OrderInvoiceModal from "../../components/OrderInvoiceModal.jsx";
import OrderTimeline from "../../components/client/OrderTimeline.jsx";
import { Printer } from "lucide-react";
const PAYMENT_API = `${PAYMENT_API_URL}/orders`;

const getOrderTrackingSteps = (order) => {
  const oStatus = (order.orderStatus || order.status || "").trim();
  const dStatus = (order.deliveryStatus || order.delivery?.assignmentStatus || "").trim();

  let currentRank = 1;

  if (oStatus === "Completed" || (order.paymentStatus === "Completed" && (oStatus === "Delivered" || dStatus === "Delivered"))) {
    currentRank = 6;
  } else if (oStatus === "Completed") {
    currentRank = 6;
  } else if (dStatus === "Delivered" || oStatus === "Delivered") {
    currentRank = 5;
  } else if (dStatus === "Out for Delivery") {
    currentRank = 4;
  } else if (dStatus === "Picked Up" || oStatus === "Shipped" || oStatus === "Picked Up") {
    currentRank = 3;
  } else if (oStatus === "Processing") {
    currentRank = 2;
  } else if (oStatus === "Confirmed" || oStatus === "Awaiting Confirmation") {
    currentRank = 1;
  }

  const isCancelled = oStatus === "Cancelled" || dStatus === "Cancelled";

  const steps = [
    { label: "Confirmed", rank: 1 },
    { label: "Processing", rank: 2 },
    { label: "Picked Up", rank: 3 },
    { label: "Out for Delivery", rank: 4 },
    { label: "Delivered", rank: 5 },
    { label: "Completed", rank: 6 },
  ];

  return steps.map((s, idx) => ({
    stepNum: idx + 1,
    label: s.label,
    done: !isCancelled && currentRank >= s.rank,
  }));
};

const Orders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [activeSection, setActiveSection] = useState("pending"); // "pending" | "history"
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await axios.get(PAYMENT_API);
      if (res.data?.success && Array.isArray(res.data.orders)) {
        setOrders(res.data.orders);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error("Failed to load orders from MongoDB API:", e);
      if (!silent) setOrders([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

    useEffect(() => {
      fetchOrders();
      const interval = setInterval(() => {
        fetchOrders(true);
      }, 4000);
      return () => clearInterval(interval);
    }, []);

  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [receivedModalOrder, setReceivedModalOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  // RIDER RATING MODAL STATE
  const [rateModalOrder, setRateModalOrder] = useState(null);
  const [starRating, setStarRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [submittingRating, setSubmittingRating] = useState(false);

  const openRatingModal = (order) => {
    setRateModalOrder(order);
    setStarRating(order.riderRating?.rating || 5);
    setHoverRating(0);
    setReviewText(order.riderRating?.review || "");
    setSelectedTags(order.riderRating?.tags || []);
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const submitRiderRating = async () => {
    if (!rateModalOrder) return;
    try {
      setSubmittingRating(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${PAYMENT_API_URL}/orders/${rateModalOrder._id || rateModalOrder.orderId}/rate-rider`,
        {
          rating: starRating,
          review: reviewText,
          tags: selectedTags,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data?.success) {
        toast.success("Thank you! Delivery partner rating submitted successfully ⭐");
        addNotification(
          "Rating Submitted",
          "Thank you! Your delivery partner rating has been recorded.",
          "order",
          rateModalOrder.orderId
        );
        setOrders((prev) =>
          prev.map((o) =>
            o._id === rateModalOrder._id || o.orderId === rateModalOrder.orderId
              ? { ...o, riderRating: res.data.riderRating }
              : o
          )
        );
        setRateModalOrder(null);
      }
    } catch (err) {
      console.error("Failed to submit delivery rating:", err);
      toast.error(err.response?.data?.message || "Failed to submit delivery rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  const confirmCancelOrder = async () => {
    if (!cancelModalOrder) return;
    const targetOrder = cancelModalOrder;
    const targetId = targetOrder._id || targetOrder.id || targetOrder.orderId;
    setCancelModalOrder(null);

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.patch(`${PAYMENT_API_URL}/cancel/${targetId}`, {}, { headers });
    } catch (e) {
      console.error("Cancellation API note:", e);
    }

    const updated = orders.map((ord) => {
      if (ord.id === targetId || ord._id === targetId || ord.orderId === targetId) {
        return { ...ord, status: "Cancelled", orderStatus: "Cancelled" };
      }
      return ord;
    });

    setOrders(updated);
    localStorage.setItem("clientOrders", JSON.stringify(updated));
    if (selectedOrder && (selectedOrder.id === targetId || selectedOrder._id === targetId || selectedOrder.orderId === targetId)) {
      setSelectedOrder({ ...selectedOrder, status: "Cancelled", orderStatus: "Cancelled" });
    }

    addNotification({
      title: "Order Cancelled",
      message: `Your order ${targetOrder.orderId || targetOrder.id} has been cancelled successfully.`,
      type: "order",
    });

    fetchOrders();
  };

  const confirmReceivedOrder = async () => {
    if (!receivedModalOrder) return;
    const targetOrder = receivedModalOrder;
    const targetId = targetOrder._id || targetOrder.id || targetOrder.orderId;
    setReceivedModalOrder(null);

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.patch(`${PAYMENT_API_URL}/confirm-received/${targetId}`, {}, { headers });
    } catch (e) {
      console.error("Confirm received API note:", e);
    }

    const updated = orders.map((ord) => {
      if (ord.id === targetId || ord._id === targetId || ord.orderId === targetId) {
        return {
          ...ord,
          status: "Completed",
          orderStatus: "Completed",
          paymentStatus: "Completed",
        };
      }
      return ord;
    });

    setOrders(updated);
    localStorage.setItem("clientOrders", JSON.stringify(updated));
    if (selectedOrder && (selectedOrder.id === targetId || selectedOrder._id === targetId || selectedOrder.orderId === targetId)) {
      setSelectedOrder({
        ...selectedOrder,
        status: "Completed",
        orderStatus: "Completed",
        paymentStatus: "Completed",
      });
    }

    addNotification({
      title: "Order Received & Completed",
      message: `Order ${targetOrder.orderId || targetOrder.id} has been confirmed as received! Thank you for shopping.`,
      type: "order",
    });

    fetchOrders();
  };

  const isOrderFinished = (ord) => {
    const oStatus = (ord.orderStatus || ord.status || "").trim();
    const dStatus = (ord.deliveryStatus || ord.delivery?.assignmentStatus || "").trim();
    return (
      oStatus === "Completed" ||
      oStatus === "Delivered" ||
      oStatus === "Cancelled" ||
      dStatus === "Delivered" ||
      dStatus === "Cancelled"
    );
  };

  // PENDING vs HISTORY SEPARATION
  const pendingOrders = orders.filter((ord) => !isOrderFinished(ord));
  const historyOrders = orders.filter((ord) => isOrderFinished(ord));

  const currentSectionOrders = activeSection === "pending" ? pendingOrders : historyOrders;

  const filteredOrders = currentSectionOrders.filter((ord) => {
    const currentStatus = (ord.status || ord.orderStatus || "Processing").trim();
    if (selectedFilter === "All") return true;
    return currentStatus.toLowerCase() === selectedFilter.toLowerCase();
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Awaiting Confirmation":
        return {
          icon: Clock3,
          color: "bg-amber-50 text-amber-800 border-amber-300 font-bold",
        };
      case "Confirmed":
        return {
          icon: CheckCircle2,
          color: "bg-blue-50 text-blue-700 border-blue-200 font-bold",
        };
      case "Completed":
      case "Delivered":
        return {
          icon: CheckCircle2,
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "Shipped":
        return {
          icon: Truck,
          color: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "Processing":
        return {
          icon: Clock3,
          color: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "Cancelled":
        return {
          icon: XCircle,
          color: "bg-red-50 text-red-700 border-red-200",
        };
      default:
        return {
          icon: Package,
          color: "bg-slate-50 text-slate-700 border-slate-200",
        };
    }
  };

  const getPaymentBadge = (method) => {
    switch (method) {
      case "Razorpay":
        return { icon: Zap, label: "Razorpay Online", color: "text-blue-700 bg-blue-50 border-blue-200" };
      case "UPI":
        return { icon: QrCode, label: "UPI", color: "text-purple-700 bg-purple-50 border-purple-200" };
      case "Card":
        return { icon: CreditCard, label: "Card", color: "text-blue-700 bg-blue-50 border-blue-200" };
      case "COD":
        return { icon: Banknote, label: "Cash on Delivery", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      default:
        return { icon: CreditCard, label: method || "Card", color: "text-slate-700 bg-slate-50 border-slate-200" };
    }
  };

  const [payingOrderId, setPayingOrderId] = useState(null);

  const handlePayPendingRazorpay = async (order) => {
    try {
      const targetId = order._id || order.id || order.orderId;
      setPayingOrderId(targetId);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post(
        `${PAYMENT_API_URL}/razorpay/create-order`,
        {
          orderId: targetId,
          amount: order.totalAmount || order.total,
        },
        { headers }
      );

      if (res.data?.success && res.data.razorpayOrder) {
        await launchRazorpayPayment({
          razorpayOrder: res.data.razorpayOrder,
          order,
          shippingInfo: order.clientInfo || {},
          onSuccess: async (rzpResp) => {
            try {
              const verifyRes = await axios.post(
                `${PAYMENT_API_URL}/razorpay/verify-payment`,
                {
                  orderId: targetId,
                  razorpay_order_id: rzpResp.razorpay_order_id,
                  razorpay_payment_id: rzpResp.razorpay_payment_id,
                  razorpay_signature: rzpResp.razorpay_signature,
                },
                { headers }
              );
              if (verifyRes.data?.success) {
                toast.success("Payment verified successfully via Razorpay!");
                fetchOrders();
              }
            } catch (vErr) {
              console.error("Verification error:", vErr);
              toast.warning("Payment recorded! Our team is confirming your order.");
              fetchOrders();
            }
          },
          onDismiss: () => {
            toast.warning("Payment window was closed.");
          },
          onFailure: (err) => {
            toast.error(`Payment failed: ${err?.description || err?.reason || "Transaction was declined"}`);
          },
        });
      } else {
        toast.error("Could not generate Razorpay payment order.");
      }
    } catch (err) {
      console.error("Pay pending Razorpay error:", err);
      toast.error(err.response?.data?.message || "Failed to initiate Razorpay payment.");
    } finally {
      setPayingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Client Portal</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Orders & Delivery History
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track active packages in real-time and review past completed orders.
          </p>
        </div>

        <button
          onClick={() => navigate("/client/shop")}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <ShoppingBag size={17} />
          Browse Shop
        </button>
      </div>

      {/* MAIN SECTION TABS: PENDING DELIVERIES vs COMPLETED HISTORY */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveSection("pending");
              setSelectedFilter("All");
            }}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold transition-all shadow-xs ${
              activeSection === "pending"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Clock3 size={17} />
            Pending Deliveries
            <span
              className={`ml-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                activeSection === "pending" ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {pendingOrders.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveSection("history");
              setSelectedFilter("All");
            }}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold transition-all shadow-xs ${
              activeSection === "history"
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <CheckCircle2 size={17} />
            Order History
            <span
              className={`ml-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                activeSection === "history" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {historyOrders.length}
            </span>
          </button>
        </div>

        {/* SUB STATUS FILTER BADGES */}
        <div className="flex gap-1.5 overflow-x-auto">
          {(activeSection === "pending"
            ? ["All", "Awaiting Confirmation", "Confirmed", "Processing", "Shipped"]
            : ["All", "Completed", "Cancelled"]
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedFilter(tab)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                selectedFilter === tab
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ORDERS LIST */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Package size={36} className="mx-auto text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-800">
            {activeSection === "pending" ? "No Pending Deliveries" : "No Order History Found"}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {activeSection === "pending"
              ? "You currently have no active orders in transit."
              : "You have no past completed or cancelled orders in history."}
          </p>
          <button
            onClick={() => navigate("/client/shop")}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const currentStatus = order.status || order.orderStatus || "Processing";
            const badge = getStatusBadge(currentStatus);
            const StatusIcon = badge.icon;

            const paymentInfo = getPaymentBadge(order.paymentMethod);
            const PaymentIcon = paymentInfo.icon;
            const orderTotal = order.total || order.totalAmount || 0;
            const trackingSteps = getOrderTrackingSteps(order);

            return (
              <div
                key={order.id || order.orderId}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300"
              >
                {/* TOP SUMMARY BAR */}
                <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Order Reference</span>
                      <p className="text-sm font-extrabold text-slate-900">{order.id || order.orderId}</p>
                    </div>

                    <div className="h-6 w-px bg-slate-200" />
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Placed Date</span>
                      <p className="text-xs font-semibold text-slate-700">{order.date || new Date(order.createdAt || Date.now()).toLocaleDateString()}</p>
                    </div>

                    <div className="h-6 w-px bg-slate-200" />
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Payment Method</span>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-800 mt-0.5">
                        <PaymentIcon size={14} className="text-blue-600" />
                        {paymentInfo.label}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap pt-2 sm:pt-0 border-t border-slate-100 sm:border-0">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badge.color}`}>
                      <StatusIcon size={14} />
                      {currentStatus}
                    </span>

                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                    >
                      Receipt & Details
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* LIVE DELIVERY TRACKING PROGRESSION ON CARD */}
                <div className="border-b border-slate-100 bg-slate-50/30 p-4 sm:px-6">
                  <OrderTimeline
                    orderStatus={currentStatus}
                    createdAt={order.createdAt}
                    updatedAt={order.updatedAt}
                  />

                  {/* DELIVERY OTP DISPLAY FOR CLIENT */}

                  {/* DELIVERY OTP DISPLAY FOR CLIENT */}
                  {order.deliveryOtp && (currentStatus === "Out for Delivery" || order.deliveryStatus === "Out for Delivery") && (
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-2 text-xs">
                      <span className="font-bold text-blue-800 flex items-center gap-1.5">
                        🔐 Delivery OTP:
                        <span className="text-slate-500 font-normal hidden sm:inline">(Share with driver upon arrival)</span>
                      </span>
                      <span className="font-mono font-extrabold text-blue-900 text-sm tracking-widest bg-white px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-xs">
                        {order.deliveryOtp}
                      </span>
                    </div>
                  )}
                </div>

                {/* ITEMS LIST PREVIEW */}
                <div className="p-4 sm:p-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                  <div className="space-y-2.5 flex-1">
                    {Array.isArray(order.items) &&
                      order.items.map((item, index) => {
                        const itemQty = Number(item.qty || item.quantity || 1);
                        const rawPrice = Number(item.price || item.unitPrice || 0);
                        const hasPrice = !isNaN(rawPrice) && rawPrice > 0;
                        const itemTotal = hasPrice ? rawPrice * itemQty : 0;

                        return (
                          <div key={index} className="flex items-center justify-between text-sm gap-4">
                            <span className="font-medium text-slate-800">
                              {item.name} <span className="text-xs font-bold text-slate-400">x{itemQty}</span>
                            </span>
                            {hasPrice && (
                              <span className="font-semibold text-slate-700 shrink-0">
                                ₹{itemTotal.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        );
                      })}

                    {/* EXTRA COD CHARGE NOTICE */}
                    {order.codCharge > 0 && (
                      <div className="flex items-center justify-between text-xs text-emerald-700 font-medium pt-2 border-t border-slate-100">
                        <span>Cash on Delivery Handling Charge</span>
                        <span>+₹{order.codCharge}</span>
                      </div>
                    )}
                  </div>

                  {/* TOTAL AMOUNT & ACTIONS CONTAINER */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-4 lg:border-0 lg:pt-0 lg:pl-6 lg:border-l shrink-0">
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Total Amount</span>
                      <p className="text-xl font-extrabold text-slate-900">
                        ₹{Number(orderTotal || 0).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {(currentStatus === "Processing" || currentStatus === "Shipped" || currentStatus === "Confirmed" || currentStatus === "Picked Up" || currentStatus === "Out for Delivery") && (
                        <button
                          onClick={() => setReceivedModalOrder(order)}
                          className="w-full sm:w-auto rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                          <CheckCircle2 size={14} />
                          Confirm Order Received
                        </button>
                      )}

                      <button
                        onClick={() => setInvoiceOrder(order)}
                        className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                        title="Download Tax Invoice"
                      >
                        <Printer size={14} className="text-blue-600" />
                        <span>Tax Invoice</span>
                      </button>

                      {(currentStatus === "Delivered" || currentStatus === "Completed") && (
                        order.riderRating?.rating ? (
                          <button
                            onClick={() => openRatingModal(order)}
                            className="w-full sm:w-auto rounded-xl bg-amber-50 border border-amber-200/80 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                            title="View or Edit Delivery Rating"
                          >
                            <Star size={14} className="fill-amber-400 text-amber-500" />
                            <span>Partner Rated: {order.riderRating.rating}/5 ⭐</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => openRatingModal(order)}
                            className="w-full sm:w-auto rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap animate-pulse hover:animate-none"
                          >
                            <Star size={14} className="fill-white" />
                            <span>Rate Delivery Partner</span>
                          </button>
                        )
                      )}

                      {order.paymentMethod === "Razorpay" && order.paymentStatus === "Pending" && currentStatus !== "Cancelled" && (
                        <button
                          onClick={() => handlePayPendingRazorpay(order)}
                          disabled={payingOrderId === (order._id || order.id || order.orderId)}
                          className="w-full sm:w-auto rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 disabled:opacity-50"
                        >
                          <Zap size={14} className="fill-white" />
                          <span>
                            {payingOrderId === (order._id || order.id || order.orderId)
                              ? "Opening Razorpay..."
                              : "Pay Now (Razorpay)"}
                          </span>
                        </button>
                      )}

                      {(currentStatus === "Processing" || currentStatus === "Awaiting Confirmation") && (
                        <button
                          onClick={() => setCancelModalOrder(order)}
                          className="w-full sm:w-auto rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition whitespace-nowrap"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILS & RECEIPT MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/70">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Order {selectedOrder.id || selectedOrder.orderId}</h3>
                <p className="text-xs text-slate-400">Placed on {selectedOrder.date || new Date(selectedOrder.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* STATUS & LOGISTICS */}
              <div className="rounded-xl bg-slate-50 p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Status:</span>
                  <span className="font-bold text-blue-600">
                    {selectedOrder.deliveryStatus || selectedOrder.delivery?.assignmentStatus || "Unassigned"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Partner:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedOrder.deliveryBoy?.name || (selectedOrder.deliveryStatus ? "Assigned Partner" : "Preparing Assignment")}
                  </span>
                </div>
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
                  <span className="font-semibold text-slate-800 text-right max-w-[220px]">{selectedOrder.shippingAddress || selectedOrder.clientInfo?.address || "123 Innovation Way, CA"}</span>
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
                  <span className={`font-semibold ${selectedOrder.paymentStatus === "Completed" ? "text-emerald-600" : "text-amber-600"}`}>
                    {selectedOrder.paymentStatus || "Completed"}
                  </span>
                </div>

                {selectedOrder.paymentMethod === "Razorpay" && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gateway:</span>
                    <span className="font-semibold text-blue-600 inline-flex items-center gap-1">
                      <Zap size={13} className="text-blue-600" /> Razorpay Secure
                    </span>
                  </div>
                )}

                {selectedOrder.paymentDetails?.razorpayPaymentId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Razorpay Payment ID:</span>
                    <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {selectedOrder.paymentDetails.razorpayPaymentId}
                    </span>
                  </div>
                )}

                {selectedOrder.deliveryOtp && (selectedOrder.orderStatus === "Out for Delivery" || selectedOrder.deliveryStatus === "Out for Delivery" || selectedOrder.delivery?.assignmentStatus === "Out for Delivery") && (
                  <div className="flex justify-between items-center bg-blue-50 border border-blue-200 p-2 rounded-lg mt-1">
                    <span className="font-bold text-blue-700 text-xs">🔐 Delivery OTP:</span>
                    <span className="font-mono font-extrabold text-blue-900 text-sm tracking-widest bg-white px-2 py-0.5 rounded border border-blue-200 shadow-xs">
                      {selectedOrder.deliveryOtp}
                    </span>
                  </div>
                )}

                {selectedOrder.paymentDetails?.upiTransactionRef && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">UPI Ref #:</span>
                    <span className="font-semibold text-slate-800">{selectedOrder.paymentDetails.upiTransactionRef}</span>
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
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item, i) => {
                    const itemQty = Number(item.qty || item.quantity || 1);
                    const itemPrice = Number(item.price || item.unitPrice || 0);
                    return (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-slate-700 font-medium">{item.name} (x{itemQty})</span>
                        <span className="font-semibold text-slate-900">₹{(itemPrice * itemQty).toLocaleString("en-IN")}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RECEIPT SUMMARY BREAKDOWN */}
              <div className="rounded-xl bg-slate-900 p-4 text-white text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal</span>
                  <span>₹{selectedOrder.subtotal || (selectedOrder.total - (selectedOrder.codCharge || 0) - (selectedOrder.shippingFee || 10))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shipping Charge</span>
                  <span>₹{selectedOrder.shippingFee || 10}</span>
                </div>
                {selectedOrder.codCharge > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>COD Extra Charge</span>
                    <span>+₹{selectedOrder.codCharge}</span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-sm">
                  <span>Grand Total</span>
                  <span className="text-emerald-400 text-base">₹{selectedOrder.total || selectedOrder.totalAmount}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 p-4 flex justify-between items-center bg-slate-50/50">
              <span className="text-xs text-slate-500">Status: <span className="font-semibold text-slate-800">{selectedOrder.status || selectedOrder.orderStatus}</span></span>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
              <XCircle size={26} />
            </div>

            <h3 className="text-center text-base font-bold text-slate-900">
              Cancel Order {cancelModalOrder.orderId || cancelModalOrder.id}?
            </h3>
            <p className="mt-2 text-center text-xs text-slate-500 leading-relaxed">
              Are you sure you want to cancel this order? Reserved items will be restored to store inventory.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={confirmCancelOrder}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM ORDER RECEIVED POPUP MODAL */}
      {receivedModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
              <CheckCircle2 size={26} />
            </div>

            <h3 className="text-center text-base font-bold text-slate-900">
              Confirm Order Received?
            </h3>
            <p className="mt-2 text-center text-xs text-slate-500 leading-relaxed">
              Have you received order <strong className="text-slate-800">{receivedModalOrder.orderId || receivedModalOrder.id}</strong>? Marking as received will complete the order fulfillment.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setReceivedModalOrder(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Not Yet
              </button>
              <button
                type="button"
                onClick={confirmReceivedOrder}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                Yes, Order Received
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RIDER STAR RATING & REVIEW MODAL */}
      {rateModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-amber-50/60">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white font-extrabold shadow-sm">
                  <Star size={20} className="fill-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Rate Delivery Partner</h3>
                  <p className="text-xs text-slate-500">Order #{rateModalOrder.orderId || rateModalOrder.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRateModalOrder(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* STAR SELECTOR */}
              <div className="text-center space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">How was your delivery experience?</p>
                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= (hoverRating || starRating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setStarRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                      >
                        <Star
                          size={32}
                          className={`${
                            active
                              ? "fill-amber-400 text-amber-500 drop-shadow-sm"
                              : "text-slate-300"
                          } transition-colors`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm font-extrabold text-amber-600">
                  {starRating === 5 && "⭐ Excellent Service!"}
                  {starRating === 4 && "👍 Good Delivery!"}
                  {starRating === 3 && "😐 Average"}
                  {starRating === 2 && "🙁 Poor Experience"}
                  {starRating === 1 && "⚠️ Terrible"}
                </p>
              </div>

              {/* QUICK TAGS */}
              <div>
                <p className="text-xs font-bold text-slate-600 mb-2">What went well? (Optional)</p>
                <div className="flex flex-wrap gap-2">
                  {["🚀 Fast Delivery", "😊 Polite Behavior", "📦 Safe Handling", "⚡ Great Communication", "📍 Followed Instructions"].map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                          isSelected
                            ? "bg-amber-500 border-amber-500 text-white shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* REVIEW TEXTAREA */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Write a quick review for the rider (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="e.g. Driver arrived on time and was super courteous!"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                />
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setRateModalOrder(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitRiderRating}
                  disabled={submittingRating}
                  className="flex-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-600 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submittingRating ? "Submitting..." : "Submit Rating ⭐"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* INVOICE MODAL */}
      <OrderInvoiceModal
        order={invoiceOrder}
        isOpen={Boolean(invoiceOrder)}
        onClose={() => setInvoiceOrder(null)}
      />
    </div>
  );
};

export default Orders;
