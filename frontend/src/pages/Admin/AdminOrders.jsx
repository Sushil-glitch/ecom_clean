import { useEffect, useState } from "react";
import {
  Package,
  Search,
  RefreshCw,
  CheckCircle2,
  Eye,
  X,
  CreditCard,
  QrCode,
  Banknote,
  ChevronRight,
  Zap,
  Hand,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "../../utils/toast.js";
import { PAYMENT_API_URL, ADMIN_API_URL } from "../../config/api.js";
import OrderInvoiceModal from "../../components/OrderInvoiceModal.jsx";
import { Printer, FileSpreadsheet } from "lucide-react";
import { exportSalesToCSV } from "../../utils/csvExporter.js";

const AdminOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoAssignMode, setAutoAssignMode] = useState(true);
  const [updatingMode, setUpdatingMode] = useState(false);

  // =====================================================
  // FETCH ALL ORDERS & DELIVERY BOYS (ADMIN)
  // =====================================================

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [response, boysRes] = await Promise.all([
        axios.get(`${PAYMENT_API_URL}/history`, { headers }),
        axios.get(`${ADMIN_API_URL}/delivery-boys`, { headers }).catch(() => ({ data: { deliveryBoys: [] } })),
      ]);

      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.payments)
        ? data.payments
        : [];

      setOrders(list);
      setDeliveryBoys(boysRes.data?.deliveryBoys || []);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError("Unable to load orders list.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${PAYMENT_API_URL}/settings`);
      if (res.data?.success && res.data.settings) {
        setAutoAssignMode(res.data.settings.enableAutoAssignment !== false);
      }
    } catch (err) {
      console.error("Failed to fetch store settings:", err);
    }
  };

  const handleToggleAutoAssignMode = async () => {
    try {
      setUpdatingMode(true);
      const newStatus = !autoAssignMode;
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${PAYMENT_API_URL}/settings`,
        { enableAutoAssignment: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        setAutoAssignMode(newStatus);
        toast.success(
          newStatus
            ? "⚡ Switched to Automatic Delivery Assignment Mode!"
            : "🖐️ Switched to Manual Delivery Assignment Mode (Ideal for low order volume)."
        );
      }
    } catch (err) {
      console.error("Failed to toggle mode:", err);
      toast.error(err.response?.data?.message || "Failed to update assignment mode.");
    } finally {
      setUpdatingMode(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSettings();
    const interval = setInterval(() => {
      fetchOrders();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // =====================================================
  // ASSIGN / UNASSIGN DELIVERY BOY
  // =====================================================

  const handleAssignDelivery = async (orderItem, deliveryBoyId) => {
    if (!deliveryBoyId) return;

    const targetId = typeof orderItem === "object" ? (orderItem._id || orderItem.orderId) : orderItem;

    if (deliveryBoyId === "UNASSIGN") {
      return handleUnassignDelivery(targetId);
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${ADMIN_API_URL}/orders/${targetId}/assign-delivery`,
        { deliveryBoyId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        toast.success(res.data.message || "Order assigned to delivery boy successfully!");
        fetchOrders();
      }
    } catch (err) {
      console.error("Delivery assignment error:", err);
      toast.error(err.response?.data?.message || "Failed to assign delivery boy.");
    }
  };

  const handleUnassignDelivery = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${ADMIN_API_URL}/orders/${orderId}/unassign-delivery`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        toast.success(res.data.message || "Delivery boy unassigned successfully!");
        fetchOrders();
      }
    } catch (err) {
      console.error("Unassign delivery error:", err);
      toast.error(err.response?.data?.message || "Failed to unassign delivery boy.");
    }
  };

  const getDeliveryBadgeColor = (status) => {
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

  // =====================================================
  // CONFIRM ORDER BY OWNER / ADMIN
  // =====================================================

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
        const autoMsg = res.data.autoAssignment?.message
          ? ` ${res.data.autoAssignment.message}`
          : "";
        toast.success(
          (res.data.message || "Order confirmed!") + autoMsg
        );
        fetchOrders();
        if (selectedOrder && (selectedOrder._id === orderId || selectedOrder.orderId === orderId)) {
          setSelectedOrder({ ...selectedOrder, orderStatus: "Confirmed" });
        }
      }
    } catch (err) {
      console.error("Order confirmation error:", err);
      toast.error(err.response?.data?.message || "Failed to confirm order.");
    }
  };

  const handleAutoAssignDelivery = async (orderItem) => {
    const targetId = typeof orderItem === "object" ? (orderItem._id || orderItem.orderId) : orderItem;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${ADMIN_API_URL}/orders/${targetId}/auto-assign`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        toast.success(res.data.message || "Delivery partner assigned automatically!");
        fetchOrders();
      }
    } catch (err) {
      console.error("Auto assign error:", err);
      toast.error(err.response?.data?.message || "Failed to auto-assign delivery partner.");
    }
  };

  // =====================================================
  // UPDATE ORDER & PAYMENT STATUS
  // =====================================================

  const handleStatusChange = async (orderDbId, newOrderStatus, newPaymentStatus, paymentMethod) => {
    try {
      let finalPaymentStatus = newPaymentStatus;
      if ((newOrderStatus === "Completed" || newOrderStatus === "Delivered") && paymentMethod === "COD") {
        finalPaymentStatus = "Completed";
      }

      const token = localStorage.getItem("token");
      await axios.patch(
        `${PAYMENT_API_URL}/status/${orderDbId}`,
        { orderStatus: newOrderStatus, paymentStatus: finalPaymentStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Order & payment status updated successfully!");
      fetchOrders();
    } catch (err) {
      console.error("Status update error:", err);
      toast.error(err.response?.data?.message || "Failed to update status.");
    }
  };

  // =====================================================
  // FILTER ORDERS
  // =====================================================

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();

    const orderId = order.orderId?.toLowerCase() || "";
    const name = order.clientInfo?.name?.toLowerCase() || "";
    const email = order.clientInfo?.email?.toLowerCase() || "";
    const method = order.paymentMethod?.toLowerCase() || "";

    const matchesSearch =
      orderId.includes(query) ||
      name.includes(query) ||
      email.includes(query) ||
      method.includes(query);

    if (!matchesSearch) return false;

    if (selectedFilter === "All") return true;

    if (selectedFilter === "Awaiting Confirmation") {
      return order.orderStatus === "Awaiting Confirmation";
    }
    if (selectedFilter === "Confirmed") return order.orderStatus === "Confirmed";
    if (selectedFilter === "Processing") return order.orderStatus === "Processing";
    if (selectedFilter === "Shipped") return order.orderStatus === "Shipped";
    if (selectedFilter === "Delivered" || selectedFilter === "Completed") {
      return order.orderStatus === "Delivered" || order.orderStatus === "Completed";
    }
    if (selectedFilter === "Cancelled") return order.orderStatus === "Cancelled";

    return true;
  });

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
  // RENDER
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
          <RefreshCw size={20} className="animate-spin text-blue-600" />
          Loading store orders...
        </div>
      </div>
    );
  }

  const awaitingCount = orders.filter((o) => o.orderStatus === "Awaiting Confirmation").length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Administration</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            View & Manage Orders
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review incoming customer orders, approve pending checkouts, and dispatch email updates.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              const exportList = (selectedFilter === "All" && !searchQuery.trim()) ? orders : filteredOrders;
              if (!exportList || exportList.length === 0) {
                toast.error("No order records available to export.");
                return;
              }
              exportSalesToCSV(exportList, `electrozone-orders-export-${new Date().toISOString().split("T")[0]}.csv`);
              toast.success(`Exported CSV spreadsheet (${exportList.length} orders)!`);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
            title="Export full orders list into a CSV spreadsheet"
          >
            <FileSpreadsheet size={17} />
            <span>Export CSV ({orders.length})</span>
          </button>

          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            onClick={() => navigate("/admin/payments")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <CreditCard size={17} />
            View Payments
          </button>
        </div>
      </div>



      {/* AWAITING CONFIRMATION ALERT BANNER */}
      {awaitingCount > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold">
              {awaitingCount}
            </div>
            <div>
              <p className="text-sm font-bold">
                {awaitingCount} Order{awaitingCount > 1 ? "s" : ""} Awaiting Admin Confirmation
              </p>
              <p className="text-xs text-amber-700">
                Clients are waiting for store approval. Confirming will automatically trigger a confirmation email to the customer.
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedFilter("Awaiting Confirmation")}
            className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition"
          >
            View Pending Orders <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

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
            placeholder="Search orders by order ID, customer name or method..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            "All",
            "Awaiting Confirmation",
            "Confirmed",
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedFilter(tab)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
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

      {/* ORDERS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {filteredOrders.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Package size={30} />
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-800">
              No orders found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              When customers complete checkout, their live orders will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Order ID & Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4">Order Status</th>
                  <th className="px-6 py-4">Assigned Delivery Boy</th>
                  <th className="px-6 py-4">Delivery Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredOrders.map((order) => {
                  const methodConfig = getMethodBadge(order.paymentMethod);
                  const MethodIcon = methodConfig.icon;

                  // Delivery assignment data
                  const assignedBoyObj =
                    typeof order.deliveryBoy === "object" && order.deliveryBoy !== null
                      ? order.deliveryBoy
                      : deliveryBoys.find(
                          (b) =>
                            b._id === order.deliveryBoy ||
                            b._id === order.delivery?.deliveryBoy
                        );

                  const assignedBoyId =
                    assignedBoyObj?._id ||
                    (typeof order.deliveryBoy === "string" ? order.deliveryBoy : null) ||
                    (typeof order.delivery?.deliveryBoy === "string" ? order.delivery.deliveryBoy : null);

                  const deliveryStatus =
                    order.deliveryStatus ||
                    order.delivery?.assignmentStatus ||
                    "Unassigned";

                  const isConfirmed =
                    order.orderStatus !== "Awaiting Confirmation" &&
                    order.orderStatus !== "Cancelled";

                  const isAssignable =
                    isConfirmed &&
                    order.orderStatus !== "Completed" &&
                    order.orderStatus !== "Delivered" &&
                    order.orderStatus !== "Cancelled";

                  const activeBoysList = deliveryBoys.filter((b) => b.isActive);

                  return (
                    <tr key={order._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="font-bold text-blue-600 hover:underline text-left block"
                        >
                          {order.orderId}
                        </button>
                        <div className="text-xs text-slate-400">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString("en-IN")
                            : "-"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">
                          {order.clientInfo?.name || "Customer"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {order.clientInfo?.email || order.clientInfo?.contact || "-"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${methodConfig.color}`}
                        >
                          <MethodIcon size={14} />
                          {order.paymentMethod}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-900">
                        ₹{Number(order.totalAmount || order.total || 0).toLocaleString("en-IN")}
                      </td>

                      {/* PAYMENT STATUS */}
                      <td className="px-6 py-4">
                        <select
                          value={order.paymentStatus || "Pending"}
                          onChange={(e) =>
                            handleStatusChange(
                              order._id,
                              order.orderStatus,
                              e.target.value,
                              order.paymentMethod
                            )
                          }
                          className={`rounded-lg border px-2.5 py-1 text-xs font-bold outline-none cursor-pointer ${
                            order.paymentStatus === "Completed" || order.paymentStatus === "Verified"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : order.paymentStatus === "Failed"
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

                      {/* ORDER STATUS & CONFIRM BUTTON */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={order.orderStatus || "Awaiting Confirmation"}
                            onChange={(e) =>
                              handleStatusChange(
                                order._id,
                                e.target.value,
                                order.paymentStatus,
                                order.paymentMethod
                              )
                            }
                            className={`rounded-lg border px-2.5 py-1 text-xs font-bold outline-none cursor-pointer ${
                              order.orderStatus === "Completed" ||
                              order.orderStatus === "Delivered" ||
                              order.orderStatus === "Confirmed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : order.orderStatus === "Awaiting Confirmation"
                                ? "bg-amber-50 text-amber-700 border-amber-300 font-extrabold"
                                : order.orderStatus === "Shipped"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : order.orderStatus === "Cancelled"
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

                          {order.orderStatus === "Awaiting Confirmation" && (
                            <button
                              type="button"
                              onClick={() => handleConfirmOrderByOwner(order._id)}
                              className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                              title="Confirm Order (Sends Client Confirmation Email)"
                            >
                              <CheckCircle2 size={13} />
                              Confirm Order
                            </button>
                          )}

                          {order.orderStatus === "Confirmed" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(
                                  order._id,
                                  "Processing",
                                  order.paymentStatus,
                                  order.paymentMethod
                                )
                              }
                              className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition"
                              title="Start Processing & Packing Package"
                            >
                              <Package size={13} />
                              Start Processing
                            </button>
                          )}
                        </div>
                      </td>

                      {/* ASSIGNED DELIVERY BOY DROPDOWN */}
                      <td className="px-6 py-4">
                        {isAssignable ? (
                          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                            <select
                              value={assignedBoyId || ""}
                              onChange={(e) =>
                                handleAssignDelivery(order, e.target.value)
                              }
                              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 max-w-[170px] cursor-pointer"
                            >
                              <option value="">-- Assign Delivery --</option>
                              {activeBoysList.map((boy) => (
                                <option key={boy._id} value={boy._id}>
                                  {boy.name} ({boy.contact})
                                </option>
                              ))}
                              {assignedBoyId && (
                                <option value="UNASSIGN" className="text-rose-600 font-bold">
                                  ❌ Unassign Delivery Boy
                                </option>
                              )}
                            </select>
                          </div>
                        ) : (
                          <div className="text-xs">
                            {assignedBoyObj ? (
                              <span className="font-bold text-slate-800">
                                {assignedBoyObj.name}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium italic">
                                {order.orderStatus === "Awaiting Confirmation"
                                  ? "Confirm order to assign"
                                  : "Unassigned"}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* DELIVERY STATUS BADGE */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getDeliveryBadgeColor(
                            deliveryStatus
                          )}`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              deliveryStatus === "Delivered"
                                ? "bg-emerald-500"
                                : deliveryStatus === "Unassigned"
                                ? "bg-slate-400"
                                : "bg-blue-500"
                            }`}
                          />
                          {deliveryStatus}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
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

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl my-auto animate-in zoom-in-95 duration-150">
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
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Customer & Delivery Information</p>
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

              {/* PAYMENT & STATUS DETAILS */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Status & Payment</p>
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
                  <span className="text-slate-500">Order Status:</span>
                  <span className={`font-bold ${
                    selectedOrder.orderStatus === "Completed" || selectedOrder.orderStatus === "Delivered" || selectedOrder.orderStatus === "Confirmed"
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}>
                    {selectedOrder.orderStatus || "Awaiting Confirmation"}
                  </span>
                </div>
                {selectedOrder.deliveryOtp && (["Out for Delivery", "Delivered", "Completed"].includes(selectedOrder.orderStatus) || ["Out for Delivery", "Delivered"].includes(selectedOrder.deliveryStatus)) && (
                  <div className="flex justify-between items-center bg-blue-50 border border-blue-200 p-2 rounded-lg mt-1">
                    <span className="font-bold text-blue-700 text-xs">Client Delivery OTP:</span>
                    <span className="font-mono font-extrabold text-blue-900 text-sm tracking-widest bg-white px-2 py-0.5 rounded border border-blue-200">
                      {selectedOrder.deliveryOtp}
                    </span>
                  </div>
                )}
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
                      Verified
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
                    <span className="text-slate-500">UPI Ref:</span>
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
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Purchased Items Breakdown</h4>
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
                    <div className="text-xs text-slate-400">No item breakdown recorded for this order.</div>
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
              {selectedOrder.orderStatus === "Awaiting Confirmation" ? (
                <button
                  type="button"
                  onClick={() => handleConfirmOrderByOwner(selectedOrder._id)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-md transition"
                >
                  <CheckCircle2 size={15} />
                  Approve & Confirm Order
                </button>
              ) : selectedOrder.orderStatus === "Confirmed" ? (
                <button
                  type="button"
                  onClick={() =>
                    handleStatusChange(
                      selectedOrder._id,
                      "Processing",
                      selectedOrder.paymentStatus,
                      selectedOrder.paymentMethod
                    )
                  }
                  className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-md transition"
                >
                  <Package size={15} />
                  Start Processing Order
                </button>
              ) : (
                <span className="text-xs font-semibold text-slate-400">
                  Status: <strong className="text-slate-800">{selectedOrder.orderStatus}</strong>
                </span>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInvoiceOrder(selectedOrder)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-xs transition"
                >
                  <Printer size={15} className="text-blue-600" />
                  Print Tax Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-sm"
                >
                  Close
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

export default AdminOrders;
