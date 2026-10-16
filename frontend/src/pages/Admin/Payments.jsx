import { useEffect, useState } from "react";
import {
  CreditCard,
  QrCode,
  Banknote,
  Search,
  Clock,
  SlidersHorizontal,
  RefreshCw,
  CheckCircle2,
  Package,
  Eye,
  X,
  Wallet,
  CheckCircle,
  XCircle,
  Send,
  UserCheck,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "../../utils/toast.js";
import { PAYMENT_API_URL, ADMIN_API_URL } from "../../config/api.js";

const AdminPayments = () => {
  const navigate = useNavigate();

  const [activeMainTab, setActiveMainTab] = useState("payments"); // 'payments' or 'payouts'

  const [payments, setPayments] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Payout Requests State
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [approveModalReq, setApproveModalReq] = useState(null);
  const [utrInput, setUtrInput] = useState("");
  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actioningPayout, setActioningPayout] = useState(false);

  // =====================================================
  // FETCH REAL PAYMENTS FROM BACKEND
  // =====================================================

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${PAYMENT_API_URL}/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.payments)
        ? data.payments
        : [];

      setPayments(list);
    } catch (err) {
      console.error("Failed to load payments:", err);
      setError("Unable to load payment information.");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchPayoutRequests();
  }, []);

  const fetchPayoutRequests = async () => {
    try {
      setLoadingPayouts(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${ADMIN_API_URL}/payouts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.requests) {
        setPayoutRequests(res.data.requests);
      }
    } catch (err) {
      console.error("Fetch payout requests error:", err);
    } finally {
      setLoadingPayouts(false);
    }
  };

  const handleApprovePayout = async (e) => {
    e.preventDefault();
    if (!approveModalReq) return;
    try {
      setActioningPayout(true);
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${ADMIN_API_URL}/payouts/${approveModalReq._id}/approve`,
        { transactionRef: utrInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data?.message || "Transaction approved successfully!");
      setApproveModalReq(null);
      setUtrInput("");
      fetchPayoutRequests();
    } catch (err) {
      console.error("Approve payout error:", err);
      toast.error(err.response?.data?.message || "Failed to approve request.");
    } finally {
      setActioningPayout(false);
    }
  };

  const handleRejectPayout = async (e) => {
    e.preventDefault();
    if (!rejectModalReq) return;
    try {
      setActioningPayout(true);
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${ADMIN_API_URL}/payouts/${rejectModalReq._id}/reject`,
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data?.message || "Transaction rejected.");
      setRejectModalReq(null);
      setRejectReason("");
      fetchPayoutRequests();
    } catch (err) {
      console.error("Reject payout error:", err);
      toast.error(err.response?.data?.message || "Failed to reject request.");
    } finally {
      setActioningPayout(false);
    }
  };

  // =====================================================
  // UPDATE STATUS (ORDER & PAYMENT)
  // =====================================================

  const handleStatusChange = async (paymentId, newOrderStatus, newPaymentStatus, paymentMethod) => {
    try {
      let finalPaymentStatus = newPaymentStatus;
      if ((newOrderStatus === "Completed" || newOrderStatus === "Delivered") && paymentMethod === "COD") {
        finalPaymentStatus = "Completed";
      }

      const token = localStorage.getItem("token");
      await axios.patch(
        `${PAYMENT_API_URL}/status/${paymentId}`,
        { orderStatus: newOrderStatus, paymentStatus: finalPaymentStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Order & Payment status updated successfully!");
      fetchPayments();
    } catch (err) {
      console.error("Status update error:", err);
      toast.error(err.response?.data?.message || "Failed to update status.");
    }
  };

  const handleConfirmOrderByOwner = async (paymentId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `${PAYMENT_API_URL}/confirm-owner/${paymentId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data?.success) {
        toast.success(res.data.message || "Order confirmed! Client notified via email & in-app notification.");
        fetchPayments();
        if (selectedOrder && (selectedOrder._id === paymentId || selectedOrder.orderId === paymentId)) {
          setSelectedOrder({ ...selectedOrder, orderStatus: "Confirmed" });
        }
      }
    } catch (err) {
      console.error("Order confirmation error:", err);
      toast.error(err.response?.data?.message || "Failed to confirm order.");
    }
  };

  // =====================================================
  // FILTER PAYMENTS
  // =====================================================

  const filteredPayments = payments.filter((payment) => {
    const query = searchQuery.toLowerCase();

    const orderId = payment.orderId?.toLowerCase() || "";
    const name = payment.clientInfo?.name?.toLowerCase() || "";
    const email = payment.clientInfo?.email?.toLowerCase() || "";
    const method = payment.paymentMethod?.toLowerCase() || "";

    const matchesSearch =
      orderId.includes(query) ||
      name.includes(query) ||
      email.includes(query) ||
      method.includes(query);

    if (!matchesSearch) return false;

    if (selectedFilter === "All") return true;

    if (selectedFilter === "Razorpay") return payment.paymentMethod === "Razorpay";
    if (selectedFilter === "UPI") return payment.paymentMethod === "UPI";
    if (selectedFilter === "Card") return payment.paymentMethod === "Card";
    if (selectedFilter === "COD") return payment.paymentMethod === "COD";

    if (selectedFilter === "Completed") {
      return (
        payment.paymentStatus === "Completed" ||
        payment.paymentStatus === "Verified"
      );
    }

    if (selectedFilter === "Pending") {
      return payment.paymentStatus === "Pending";
    }

    return true;
  });

  // =====================================================
  // DYNAMIC STATISTICS
  // =====================================================

  const totalRevenue = payments.reduce((total, payment) => {
    if (
      payment.paymentStatus === "Completed" ||
      payment.paymentStatus === "Verified"
    ) {
      return total + Number(payment.totalAmount || payment.total || 0);
    }
    return total;
  }, 0);

  const pendingCodRevenue = payments.reduce((total, payment) => {
    if (
      payment.paymentMethod === "COD" &&
      payment.paymentStatus === "Pending"
    ) {
      return total + Number(payment.totalAmount || payment.total || 0);
    }
    return total;
  }, 0);

  const razorpayPayments = payments.filter(
    (payment) => payment.paymentMethod === "Razorpay"
  );
  const razorpayCount = razorpayPayments.length;
  const razorpayRevenue = razorpayPayments.reduce((total, payment) => {
    if (
      payment.paymentStatus === "Completed" ||
      payment.paymentStatus === "Verified"
    ) {
      return total + Number(payment.totalAmount || payment.total || 0);
    }
    return total;
  }, 0);

  const upiCount = payments.filter(
    (payment) => payment.paymentMethod === "UPI"
  ).length;

  const cardCount = payments.filter(
    (payment) => payment.paymentMethod === "Card"
  ).length;

  const codCount = payments.filter(
    (payment) => payment.paymentMethod === "COD"
  ).length;

  // =====================================================
  // PAYMENT METHOD BADGE
  // =====================================================

  const getMethodBadge = (method) => {
    switch (method) {
      case "Razorpay":
        return {
          icon: Zap,
          color: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "UPI":
        return {
          icon: QrCode,
          color: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "Card":
        return {
          icon: CreditCard,
          color: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "COD":
        return {
          icon: Banknote,
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      default:
        return {
          icon: CreditCard,
          color: "bg-slate-50 text-slate-700 border-slate-200",
        };
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
          <RefreshCw size={20} className="animate-spin text-blue-600" />
          Loading payment transactions...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Administration</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Payment Transactions & Orders
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor customer payments, manage fulfillment status and transaction details.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              fetchPayments();
              fetchPayoutRequests();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            onClick={() => navigate("/admin/settings")}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <SlidersHorizontal size={17} />
            Payment Settings
          </button>
        </div>
      </div>

      {/* MAIN TAB SWITCHER */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveMainTab("payments")}
          className={`flex items-center gap-2 border-b-2 py-3 px-5 text-sm font-bold transition ${
            activeMainTab === "payments"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CreditCard size={18} />
          <span>Customer Order Payments ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab("payouts")}
          className={`flex items-center gap-2 border-b-2 py-3 px-5 text-sm font-bold transition relative ${
            activeMainTab === "payouts"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Wallet size={18} />
          <span>Driver Payouts & COD Settlements</span>
          {payoutRequests.filter((r) => r.status === "Pending").length > 0 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
              {payoutRequests.filter((r) => r.status === "Pending").length} Pending
            </span>
          )}
        </button>
      </div>

      {/* RENDER BASED ON ACTIVE TAB */}
      {activeMainTab === "payouts" ? (
        /* DRIVER PAYOUT & COD SETTLEMENT CENTER */
        <div className="space-y-6">
          <div className="rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                <Wallet size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Driver Payout & Cash Settlement Approval Center
                </h3>
                <p className="text-xs text-slate-600">
                  Review pending delivery driver withdrawal requests and verify collected COD cash settlements.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
            {loadingPayouts ? (
              <div className="p-12 text-center text-slate-400 font-medium">
                Loading payout requests...
              </div>
            ) : payoutRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Wallet size={40} className="mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-700">No Payout Requests Found</p>
                <p className="text-xs text-slate-400">Driver cash requests will appear here for admin approval.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Driver</th>
                      <th className="px-6 py-4">Request Type</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">UPI / Destination</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date & Time</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payoutRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{req.driver?.name || "Driver"}</p>
                          <p className="text-xs text-slate-400">{req.driver?.email || req.driver?.contact || ""}</p>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-xl px-2.5 py-1 text-xs font-bold ${
                              req.type === "withdrawal"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {req.type === "withdrawal" ? "UPI Withdrawal Request" : "COD Cash Settlement"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-base font-extrabold text-slate-900">
                          ₹{Number(req.amount || 0).toLocaleString("en-IN")}
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-700 text-xs">
                          {req.upiId || req.driver?.upiId || "Store Cash Counter"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              req.status === "Pending"
                                ? "bg-amber-100 text-amber-800"
                                : req.status === "Completed" || req.status === "Approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(req.createdAt).toLocaleString("en-IN")}
                        </td>

                        <td className="px-6 py-4 text-right">
                          {req.status === "Pending" ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setApproveModalReq(req);
                                  setUtrInput("");
                                }}
                                className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                              >
                                <CheckCircle size={14} />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRejectModalReq(req);
                                  setRejectReason("");
                                }}
                                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                              >
                                <XCircle size={14} />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CUSTOMER ORDERS PAYMENTS TAB (ORIGINAL VIEW) */
        <>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* REVENUE */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Paid Revenue
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <span className="text-lg font-bold">₹</span>
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            {payments.filter(p => p.paymentStatus === "Completed" || p.paymentStatus === "Verified").length} completed orders
          </p>
        </div>

        {/* RAZORPAY */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Razorpay Gateway
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Zap size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            ₹{razorpayRevenue.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {razorpayCount} verified transactions
          </p>
        </div>

        {/* COD */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pending COD
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            ₹{pendingCodRevenue.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            {codCount} COD transactions
          </p>
        </div>

        {/* UPI */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              UPI Transactions
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <QrCode size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {upiCount}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Processed via UPI/QR
          </p>
        </div>

        {/* CARD */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Card Direct
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <CreditCard size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {cardCount}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Credit/Debit Card demo
          </p>
        </div>
      </div>

      {/* SEARCH / FILTER */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payments by order ID, customer name or method..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {["All", "Razorpay", "UPI", "Card", "COD", "Completed", "Pending"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedFilter(tab)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                selectedFilter === tab
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* PAYMENT TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {filteredPayments.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Package size={30} />
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-800">
              No transaction records found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              When customers complete checkout in the shop, their live orders and payment transactions will appear here dynamically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Transaction / Order</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4">Fulfillment Status</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPayments.map((payment) => {
                  const methodConfig = getMethodBadge(payment.paymentMethod);
                  const MethodIcon = methodConfig.icon;

                  return (
                    <tr key={payment._id} className="hover:bg-slate-50/60">
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(payment)}
                          className="font-bold text-blue-600 hover:underline text-left"
                        >
                          {payment.orderId}
                        </button>
                        <div className="text-xs text-slate-400">
                          {payment.createdAt
                            ? new Date(payment.createdAt).toLocaleDateString("en-IN")
                            : "-"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">
                          {payment.clientInfo?.name || "Customer"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {payment.clientInfo?.email || payment.clientInfo?.contact || "-"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${methodConfig.color}`}
                        >
                          <MethodIcon size={14} />
                          {payment.paymentMethod}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-900">
                        ₹{Number(payment.totalAmount || payment.total || 0).toLocaleString("en-IN")}
                      </td>

                      {/* PAYMENT STATUS SELECTOR */}
                      <td className="px-6 py-4">
                        <select
                          value={payment.paymentStatus || "Pending"}
                          onChange={(e) =>
                            handleStatusChange(payment._id, payment.orderStatus, e.target.value, payment.paymentMethod)
                          }
                          className={`rounded-lg border px-2.5 py-1 text-xs font-bold outline-none cursor-pointer ${
                            payment.paymentStatus === "Completed" || payment.paymentStatus === "Verified"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : payment.paymentStatus === "Failed"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Completed">Completed</option>
                          <option value="Verified">Verified</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </td>

                      {/* ORDER FULFILLMENT STATUS SELECTOR & CONFIRM BUTTON */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={payment.orderStatus || "Awaiting Confirmation"}
                            onChange={(e) =>
                              handleStatusChange(payment._id, e.target.value, payment.paymentStatus, payment.paymentMethod)
                            }
                            className={`rounded-lg border px-2.5 py-1 text-xs font-bold outline-none cursor-pointer ${
                              payment.orderStatus === "Completed" || payment.orderStatus === "Delivered" || payment.orderStatus === "Confirmed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : payment.orderStatus === "Awaiting Confirmation"
                                ? "bg-amber-50 text-amber-700 border-amber-300 font-extrabold"
                                : payment.orderStatus === "Shipped"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : payment.orderStatus === "Cancelled"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            <option value="Awaiting Confirmation">Awaiting Confirmation</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>

                          {payment.orderStatus !== "Confirmed" && payment.orderStatus !== "Completed" && payment.orderStatus !== "Delivered" && payment.orderStatus !== "Cancelled" && (
                            <button
                              type="button"
                              onClick={() => handleConfirmOrderByOwner(payment._id)}
                              className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                              title="Confirm Order (Sends Client Email & In-App Notification)"
                            >
                              <CheckCircle2 size={13} />
                              Confirm Order
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(payment)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-100 transition"
                        >
                          <Eye size={13} />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TRANSACTION / ORDER DETAILS POPUP MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/70">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Transaction & Order Details ({selectedOrder.orderId || selectedOrder.id})
                </h3>
                <p className="text-xs text-slate-400">
                  Created on {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString("en-IN") : selectedOrder.date || "-"}
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
              {/* CUSTOMER INFORMATION */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-2 text-xs bg-slate-50/50">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Customer & Delivery Info</p>
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

              {/* PAYMENT DETAILS */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Payment Audit Details</p>
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
                    {selectedOrder.paymentStatus || "Processing"}
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

                {selectedOrder.paymentDetails?.razorpayPaymentId && (
                  <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/80 p-2.5">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        Razorpay Payment ID
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {selectedOrder.paymentDetails.razorpayPaymentId}
                      </span>
                    </div>
                    <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      HMAC Verified
                    </span>
                  </div>
                )}
                {selectedOrder.paymentDetails?.razorpayOrderId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Razorpay Order ID:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {selectedOrder.paymentDetails.razorpayOrderId}
                    </span>
                  </div>
                )}
                {selectedOrder.paymentDetails?.upiTransactionRef && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">UPI Transaction Ref:</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedOrder.paymentDetails.upiTransactionRef}</span>
                  </div>
                )}
                {selectedOrder.paymentDetails?.cardLast4 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Card Last 4:</span>
                    <span className="font-semibold text-slate-800">•••• {selectedOrder.paymentDetails.cardLast4}</span>
                  </div>
                )}
                {selectedOrder.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tracking Number:</span>
                    <span className="font-semibold text-slate-800">{selectedOrder.trackingNumber}</span>
                  </div>
                )}
              </div>

              {/* PURCHASED ITEMS */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Purchased Items Breakdown</h4>
                <div className="space-y-2 border-t border-slate-100 pt-2">
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm items-center">
                        <span className="text-slate-700 font-medium">
                          {item.name} <span className="text-xs text-slate-400">x{item.qty || 1}</span>
                        </span>
                        <span className="font-bold text-slate-900">₹{((item.price || 0) * (item.qty || 1)).toLocaleString("en-IN")}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400">No item breakdown recorded for this order.</div>
                  )}
                </div>
              </div>

              {/* FINANCIAL BREAKDOWN */}
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
                    <span>COD Handling Charge</span>
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
                  onClick={() => handleConfirmOrderByOwner(selectedOrder._id)}
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
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* APPROVE PAYOUT MODAL */}
      {approveModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Approve Driver Transaction</h3>
              </div>
              <button onClick={() => setApproveModalReq(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApprovePayout} className="mt-4 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium">Driver Name</p>
                <p className="text-sm font-extrabold text-slate-900">{approveModalReq.driver?.name || "Driver"}</p>

                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-slate-500">Request Amount:</span>
                  <span className="font-extrabold text-emerald-600">₹{Number(approveModalReq.amount || 0).toLocaleString("en-IN")}</span>
                </div>

                <div className="mt-1 flex justify-between text-xs">
                  <span className="text-slate-500">Destination UPI / Account:</span>
                  <span className="font-bold text-slate-800">{approveModalReq.upiId || approveModalReq.driver?.upiId || "Store Cash Counter"}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bank UTR / Transaction Reference Number (Optional)
                </label>
                <input
                  type="text"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  placeholder="e.g. UTR1234567890"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApproveModalReq(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actioningPayout}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {actioningPayout ? "Approving..." : "Confirm & Approve"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT PAYOUT MODAL */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <XCircle size={20} className="text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">Reject Transaction Request</h3>
              </div>
              <button onClick={() => setRejectModalReq(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRejectPayout} className="mt-4 space-y-4">
              <p className="text-xs text-slate-600">
                Are you sure you want to reject this request of <strong>₹{Number(rejectModalReq.amount || 0).toLocaleString("en-IN")}</strong> from <strong>{rejectModalReq.driver?.name}</strong>?
                {rejectModalReq.type === "withdrawal" && " The requested amount will be refunded to the driver's wallet balance."}
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Rejection</label>
                <input
                  type="text"
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Invalid UPI ID or pending cash settlement"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalReq(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actioningPayout}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition disabled:opacity-50"
                >
                  {actioningPayout ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;