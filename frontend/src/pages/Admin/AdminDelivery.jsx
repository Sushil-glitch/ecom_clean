import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "../../utils/toast.js";
import { ADMIN_API_URL, PAYMENT_API_URL } from "../../config/api.js";
import {
  Truck,
  UserPlus,
  Search,
  RefreshCw,
  UserCheck,
  Package,
  Pencil,
  Power,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Bike,
  Zap,
  Hand,
  Coins,
  Star,
  Award,
  TrendingUp,
  ThumbsUp,
  MessageSquare,
} from "lucide-react";

const AdminDelivery = () => {
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [codSettlementFilter, setCodSettlementFilter] = useState("all");
  const [codDeposits, setCodDeposits] = useState([]);
  const [depositFilter, setDepositFilter] = useState("all");
  const [activeSection, setActiveSection] = useState("boys");
  const [autoAssignMode, setAutoAssignMode] = useState(true);
  const [updatingMode, setUpdatingMode] = useState(false);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState(null);

  // Appraisal Modal State
  const [appraisalModalBoy, setAppraisalModalBoy] = useState(null);
  const [appraisalData, setAppraisalData] = useState(null);
  const [loadingAppraisal, setLoadingAppraisal] = useState(false);

  const openAppraisalModal = async (boy) => {
    setAppraisalModalBoy(boy);
    setAppraisalData(null);
    setLoadingAppraisal(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${ADMIN_API_URL}/delivery-boys/${boy._id}/appraisal`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data?.success) {
        setAppraisalData(res.data.appraisalReport);
      }
    } catch (err) {
      console.error("Fetch appraisal error:", err);
      toast.error("Failed to load driver appraisal report");
    } finally {
      setLoadingAppraisal(false);
    }
  };

  // Form states
  const [createForm, setCreateForm] = useState({
    name: "",
    contact: "",
    email: "",
    password: "",
    vehicleType: "Bike",
    vehicleModel: "",
    bikeNumber: "",
    licenseNumber: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    contact: "",
    email: "",
    password: "",
    isActive: true,
    vehicleType: "Bike",
    vehicleModel: "",
    bikeNumber: "",
    licenseNumber: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // =====================================================
  // FETCH DATA
  // =====================================================
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch delivery boys
      const boysRes = await axios.get(`${ADMIN_API_URL}/delivery-boys`, { headers });
      if (boysRes.data?.success) {
        setDeliveryBoys(boysRes.data.deliveryBoys || []);
      }

      // Fetch orders to calculate workloads
      const ordersRes = await axios.get(`${PAYMENT_API_URL}/history`, { headers });
      const orderList = Array.isArray(ordersRes.data)
        ? ordersRes.data
        : Array.isArray(ordersRes.data.payments)
        ? ordersRes.data.payments
        : [];
      setAllOrders(orderList);

      // Fetch COD cash deposit submissions
      try {
        const depRes = await axios.get(`${ADMIN_API_URL}/delivery-boys/cod-deposits`, { headers });
        if (depRes.data?.success) {
          setCodDeposits(depRes.data.deposits || []);
        }
      } catch (depErr) {
        console.log("COD deposits fetch error:", depErr.message);
      }
    } catch (err) {
      console.error("Failed to load delivery boys data:", err);
      toast.error(err.response?.data?.message || "Failed to load delivery boys data");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleSettleCash = (boy) => {
    const currentCash = boy.cashInHand || 0;
    if (currentCash <= 0) {
      toast.info(`No cash in hand pending settlement for ${boy.name}`);
      return;
    }
    openSettleModal(boy);
  };

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, [fetchData]);

  // =====================================================
  // CALCULATE PER-DELIVERY-BOY METRICS
  // =====================================================
  const getBoyMetrics = (boyId) => {
    if (!boyId) return { activeWorkload: 0, completedCount: 0 };

    const boyOrders = allOrders.filter((order) => {
      const assignedId = order.deliveryBoy?._id || order.deliveryBoy || order.delivery?.deliveryBoy;
      return assignedId && assignedId.toString() === boyId.toString();
    });

    const activeWorkload = boyOrders.filter((o) => {
      const status = o.deliveryStatus || o.delivery?.assignmentStatus;
      return ["Assigned", "Accepted", "Picked Up", "Out for Delivery"].includes(status);
    }).length;

    const completedCount = boyOrders.filter((o) => {
      const status = o.deliveryStatus || o.delivery?.assignmentStatus;
      return status === "Delivered" || o.orderStatus === "Delivered" || o.orderStatus === "Completed";
    }).length;

    return { activeWorkload, completedCount };
  };

  // =====================================================
  // CREATE DELIVERY BOY
  // =====================================================
  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    if (!createForm.name || !createForm.contact || !createForm.email || !createForm.password) {
      toast.error("All basic fields (Name, Contact, Email, Password) are required");
      return;
    }

    if (!/^\d{10}$/.test(createForm.contact.trim())) {
      toast.error("Contact number must be exactly 10 digits");
      return;
    }

    if (createForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      const payload = {
        name: createForm.name,
        contact: createForm.contact,
        email: createForm.email,
        password: createForm.password,
        vehicleDetails: {
          vehicleType: createForm.vehicleType,
          vehicleModel: createForm.vehicleModel,
          bikeNumber: createForm.bikeNumber.toUpperCase(),
          licenseNumber: createForm.licenseNumber.toUpperCase(),
        },
      };

      const res = await axios.post(
        `${ADMIN_API_URL}/delivery-boys`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        toast.success(res.data.message || "Delivery boy created successfully!");
        setShowCreateModal(false);
        setCreateForm({
          name: "",
          contact: "",
          email: "",
          password: "",
          vehicleType: "Bike",
          vehicleModel: "",
          bikeNumber: "",
          licenseNumber: "",
        });
        fetchData();
      }
    } catch (err) {
      console.error("Create error:", err);
      toast.error(err.response?.data?.message || "Failed to create delivery boy");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // EDIT DELIVERY BOY
  // =====================================================
  const [deactivateConfirmBoy, setDeactivateConfirmBoy] = useState(null);
  const [settleModalBoy, setSettleModalBoy] = useState(null);
  const [settleAmountInput, setSettleAmountInput] = useState("");
  const [settling, setSettling] = useState(false);

  // =====================================================
  // EDIT DELIVERY BOY
  // =====================================================
  const openEditModal = (boy) => {
    setSelectedDeliveryBoy(boy);
    const v = boy.vehicleDetails || {};
    setEditForm({
      name: boy.name || "",
      contact: boy.contact || "",
      email: boy.email || "",
      password: "",
      cashInHand: Number(boy.cashInHand) || 0,
      isActive: boy.isActive !== false,
      vehicleType: v.vehicleType || "Bike",
      vehicleModel: v.vehicleModel || "",
      bikeNumber: v.bikeNumber || "",
      licenseNumber: v.licenseNumber || "",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDeliveryBoy) return;

    if (!editForm.name || !editForm.contact || !editForm.email) {
      toast.error("Name, contact, and email are required");
      return;
    }

    if (!/^\d{10}$/.test(editForm.contact.trim())) {
      toast.error("Contact number must be exactly 10 digits");
      return;
    }

    if (editForm.password && editForm.password.length < 6) {
      toast.error("Password must be at least 6 characters if updating");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      const payload = {
        name: editForm.name,
        contact: editForm.contact,
        email: editForm.email,
        isActive: editForm.isActive,
        cashInHand: Number(editForm.cashInHand) || 0,
        vehicleDetails: {
          vehicleType: editForm.vehicleType,
          vehicleModel: editForm.vehicleModel,
          bikeNumber: editForm.bikeNumber.toUpperCase(),
          licenseNumber: editForm.licenseNumber.toUpperCase(),
        },
      };

      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      const res = await axios.put(
        `${ADMIN_API_URL}/delivery-boys/${selectedDeliveryBoy._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        toast.success(res.data.message || "Delivery boy updated successfully!");
        setShowEditModal(false);
        setSelectedDeliveryBoy(null);
        fetchData();
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err.response?.data?.message || "Failed to update delivery boy");
    } finally {
      setSubmitting(false);
    }
  };

  const openSettleModal = (boy) => {
    setSettleModalBoy(boy);
    setSettleAmountInput((Number(boy.cashInHand) || 0).toString());
  };

  const confirmSettleCash = async (e) => {
    e.preventDefault();
    if (!settleModalBoy) return;

    const numAmount = Number(settleAmountInput);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid cash amount to settle.");
      return;
    }

    try {
      setSettling(true);
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${ADMIN_API_URL}/delivery-boys/${settleModalBoy._id}/settle-cash`,
        { amount: numAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        toast.success(res.data.message || `Settled ₹${numAmount} cash and released delivery commission!`);
        setSettleModalBoy(null);
        fetchData();
      }
    } catch (err) {
      console.error("Settle cash error:", err);
      toast.error(err.response?.data?.message || "Failed to settle driver cash deposit.");
    } finally {
      setSettling(false);
    }
  };

  // =====================================================
  // TOGGLE STATUS WITH CONFIRMATION ALERT FOR DEACTIVATION
  // =====================================================
  const handleToggleStatus = (boy) => {
    if (boy.isActive !== false) {
      // If active, show confirmation alert before deactivating
      setDeactivateConfirmBoy(boy);
    } else {
      // Activate directly
      executeStatusToggle(boy, true);
    }
  };

  const executeStatusToggle = async (boy, newStatus) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.put(
        `${ADMIN_API_URL}/delivery-boys/${boy._id}`,
        { isActive: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        toast.success(
          `Delivery boy '${boy.name}' ${newStatus ? "activated" : "deactivated"} successfully!`
        );
        fetchData();
      }
    } catch (err) {
      console.error("Toggle status error:", err);
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setDeactivateConfirmBoy(null);
    }
  };

  // =====================================================
  // FILTERING
  // =====================================================
  const filteredBoys = deliveryBoys.filter((boy) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      boy.name?.toLowerCase().includes(query) ||
      boy.email?.toLowerCase().includes(query) ||
      boy.contact?.toLowerCase().includes(query);

    if (!matchesQuery) return false;

    if (statusFilter === "active" && boy.isActive !== true) return false;
    if (statusFilter === "inactive" && boy.isActive !== false) return false;

    const cash = Number(boy.cashInHand || 0);
    if (codSettlementFilter === "pending" && cash <= 0) return false;
    if (codSettlementFilter === "completed" && cash > 0) return false;

    return true;
  });

  const filteredDeposits = codDeposits.filter((dep) => {
    const query = searchQuery.toLowerCase();
    const driverName = dep.driver?.name?.toLowerCase() || "";
    const driverEmail = dep.driver?.email?.toLowerCase() || "";
    const matchesQuery = driverName.includes(query) || driverEmail.includes(query) || (dep.description || "").toLowerCase().includes(query);

    if (!matchesQuery) return false;

    if (depositFilter === "Pending" && dep.status !== "Pending") return false;
    if (depositFilter === "Completed" && dep.status !== "Completed") return false;

    return true;
  });

  // Overall Stats
  const totalBoys = deliveryBoys.length;
  const activeBoys = deliveryBoys.filter((b) => b.isActive).length;
  const inactiveBoys = totalBoys - activeBoys;
  const pendingSettlementBoysCount = deliveryBoys.filter((b) => Number(b.cashInHand || 0) > 0).length;
  const completedSettlementBoysCount = deliveryBoys.filter((b) => Number(b.cashInHand || 0) === 0).length;
  const totalPendingCashAmount = deliveryBoys.reduce((sum, b) => sum + Number(b.cashInHand || 0), 0);

  const totalAssignedOrders = allOrders.filter(
    (o) => o.deliveryBoy || o.delivery?.deliveryBoy
  ).length;

  const totalDeliveredOrders = allOrders.filter((o) => {
    const status = o.deliveryStatus || o.delivery?.assignmentStatus;
    return status === "Delivered" || o.orderStatus === "Delivered";
  }).length;

  const ratedBoys = deliveryBoys.filter((b) => b.deliveryStats?.totalRatingsCount > 0);
  const avgStoreRiderRating =
    ratedBoys.length > 0
      ? (
          ratedBoys.reduce(
            (sum, b) => sum + Number(b.deliveryStats?.averageRating || 5.0),
            0
          ) / ratedBoys.length
        ).toFixed(1)
      : "5.0";

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
          <RefreshCw size={20} className="animate-spin text-blue-600" />
          Loading delivery management...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER WITH INTEGRATED DELIVERY ASSIGNMENT TOGGLE */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Administration</p>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold transition ${
                autoAssignMode
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  autoAssignMode ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              {autoAssignMode ? "⚡ Auto Assign Mode" : "🖐️ Manual Assign Mode"}
            </span>
          </div>

          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Delivery Boys Management
          </h1>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Create, monitor workload, and manage active status for all delivery personnel.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* INLINE TOGGLE WIDGET */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2">
            <div className="text-right">
              <p className="text-[11px] font-bold text-slate-900 leading-none">Assignment Mode</p>
              <p className="text-[10px] font-semibold text-slate-500 mt-1">
                {autoAssignMode ? "Auto Dispatch (ON)" : "Manual Dispatch (OFF)"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleAutoAssignMode}
              disabled={updatingMode}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoAssignMode ? "bg-blue-600" : "bg-slate-300"
              }`}
              title="Toggle Auto / Manual Delivery Assignment Mode"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  autoAssignMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <UserPlus size={16} />
            Create Delivery Boy
          </button>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {/* Card 1 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Delivery Boys
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Truck size={20} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-slate-900">{totalBoys}</p>
          <p className="mt-1 text-xs text-slate-500">Registered drivers</p>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Status
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck size={20} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-slate-900">{activeBoys}</p>
          <p className="mt-1 text-xs text-slate-500">{inactiveBoys} inactive accounts</p>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Assigned Orders
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Package size={20} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-slate-900">{totalAssignedOrders}</p>
          <p className="mt-1 text-xs text-slate-500">Allocated to drivers</p>
        </div>

        {/* Card 4 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Completed Deliveries
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-slate-900">{totalDeliveredOrders}</p>
          <p className="mt-1 text-xs text-slate-500">Successfully delivered</p>
        </div>

        {/* Card 5 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Avg Rider Rating
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Star size={20} className="fill-amber-400 text-amber-500" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-slate-900">⭐ {avgStoreRiderRating}</p>
          <p className="mt-1 text-xs text-slate-500">Overall feedback score</p>
        </div>
      </div>

      {/* SECTION TABS & SEARCH / FILTER */}
      <div className="flex flex-col gap-4">
        {/* TAB BUTTONS */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-1">
          <button
            type="button"
            onClick={() => setActiveSection("boys")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition ${
              activeSection === "boys"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Truck size={18} />
            <span>Delivery Personnel ({totalBoys})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("deposits")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition ${
              activeSection === "deposits"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Coins size={18} />
            <span>COD Cash Deposit Requests</span>
            {codDeposits.filter((d) => d.status === "Pending").length > 0 && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-white animate-pulse">
                {codDeposits.filter((d) => d.status === "Pending").length} pending
              </span>
            )}
          </button>
        </div>

        {/* SEARCH AND FILTER BAR */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeSection === "boys"
                  ? "Search delivery boys by name, email or phone..."
                  : "Search COD cash deposit requests by driver or description..."
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {activeSection === "boys" ? (
            <div className="flex flex-wrap items-center gap-3">
              {/* Account Status Filter */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                <span className="px-2 text-slate-400 font-semibold uppercase text-[10px]">Account:</span>
                {["all", "active", "inactive"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`rounded-lg px-3 py-1 font-bold capitalize transition ${
                      statusFilter === filter
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* COD Settlement Filter */}
              <div className="flex items-center gap-1 bg-amber-50/70 p-1 rounded-xl border border-amber-200 text-xs">
                <span className="px-2 text-amber-700 font-bold uppercase text-[10px] flex items-center gap-1">
                  <Coins size={12} /> COD Settlement:
                </span>
                <button
                  onClick={() => setCodSettlementFilter("all")}
                  className={`rounded-lg px-3 py-1 font-bold transition ${
                    codSettlementFilter === "all"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-amber-800 hover:bg-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setCodSettlementFilter("pending")}
                  className={`rounded-lg px-3 py-1 font-bold transition flex items-center gap-1 ${
                    codSettlementFilter === "pending"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-amber-800 hover:bg-white"
                  }`}
                >
                  Pending ({pendingSettlementBoysCount})
                </button>
                <button
                  onClick={() => setCodSettlementFilter("completed")}
                  className={`rounded-lg px-3 py-1 font-bold transition ${
                    codSettlementFilter === "completed"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-amber-800 hover:bg-white"
                  }`}
                >
                  Settled ({completedSettlementBoysCount})
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-amber-50/70 p-1 rounded-xl border border-amber-200 text-xs">
              <span className="px-2 text-amber-700 font-bold uppercase text-[10px]">Filter Status:</span>
              {["all", "Pending", "Completed"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDepositFilter(filter)}
                  className={`rounded-lg px-3.5 py-1 font-bold transition ${
                    depositFilter === filter
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-amber-800 hover:bg-white"
                  }`}
                >
                  {filter === "all" ? "All Deposits" : filter}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CONTENT TABLES */}
      {activeSection === "boys" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {filteredBoys.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Truck size={30} />
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-800">No delivery boys found</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Click "Create Delivery Boy" above to add your first delivery team member.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3.5 pl-5">Delivery Boy</th>
                  <th className="px-3.5 py-3.5">Vehicle</th>
                  <th className="px-3.5 py-3.5">Contact</th>
                  <th className="px-3.5 py-3.5">Status</th>
                  <th className="px-3.5 py-3.5">Workload</th>
                  <th className="px-3.5 py-3.5">Delivered</th>
                  <th className="px-3.5 py-3.5">COD Cash</th>
                  <th className="px-4 py-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredBoys.map((boy) => {
                  const { activeWorkload, completedCount } = getBoyMetrics(boy._id);
                  const cashInHand = Number(boy.cashInHand || 0);

                  return (
                    <tr key={boy._id} className="hover:bg-slate-50/60 transition">
                      {/* Name */}
                      <td className="px-4 py-3 pl-5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 font-extrabold text-blue-700 text-xs">
                            {boy.name?.charAt(0)?.toUpperCase() || "D"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                              <span>{boy.name}</span>
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-700 border border-amber-200/80" title={`${boy.deliveryStats?.totalRatingsCount || 0} customer reviews`}>
                                <Star size={10} className="fill-amber-400 text-amber-500" />
                                {Number(boy.deliveryStats?.averageRating || 5.0).toFixed(1)}
                              </span>
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Joined {boy.createdAt ? new Date(boy.createdAt).toLocaleDateString("en-IN") : "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle & Bike No */}
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        {boy.vehicleDetails?.bikeNumber ? (
                          <div>
                            <span className="font-mono font-bold text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded inline-block">
                              {boy.vehicleDetails.bikeNumber}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {boy.vehicleDetails.vehicleModel || boy.vehicleDetails.vehicleType || "Vehicle set"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium italic">
                            Not set
                          </span>
                        )}
                      </td>

                      {/* Contact & Email */}
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <p className="font-semibold text-slate-800 text-xs">{boy.contact}</p>
                        <p className="text-[11px] text-slate-400">{boy.email}</p>
                      </td>

                      {/* Status Badge */}
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            boy.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              boy.isActive ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {boy.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Workload */}
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                            activeWorkload > 0
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-50 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <Clock size={12} />
                          {activeWorkload} active
                        </span>
                      </td>

                      {/* Completed */}
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-lg">
                          <CheckCircle2 size={12} />
                          {completedCount} delivered
                        </span>
                      </td>

                      {/* COD Cash in Hand */}
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-lg border font-mono text-[11px] ${
                              cashInHand > 0
                                ? "text-amber-800 bg-amber-50 border-amber-200 font-bold"
                                : "text-slate-500 bg-slate-50 border-slate-200 font-medium"
                            }`}
                          >
                            ₹{cashInHand.toLocaleString("en-IN")}
                          </span>

                          {cashInHand > 0 && (
                            <button
                              type="button"
                              onClick={() => openSettleModal(boy)}
                              className="rounded-lg bg-amber-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-xs hover:bg-amber-700 transition whitespace-nowrap"
                              title="Confirm cash received & release driver commission"
                            >
                              Settle
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 pr-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Driver Appraisal Report Button */}
                          <button
                            type="button"
                            onClick={() => openAppraisalModal(boy)}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-100 transition shadow-2xs cursor-pointer whitespace-nowrap"
                            title="View Driver Appraisal & Performance Report"
                          >
                            <Award size={12} className="text-amber-500" />
                            Appraisal
                          </button>

                          {/* Toggle Active Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(boy)}
                            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition whitespace-nowrap ${
                              boy.isActive
                                ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            }`}
                            title={boy.isActive ? "Deactivate User" : "Activate User"}
                          >
                            <Power size={12} />
                            {boy.isActive ? "Deactivate" : "Activate"}
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => openEditModal(boy)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition whitespace-nowrap"
                          >
                            <Pencil size={12} />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      ) : (
        /* COD CASH DEPOSIT REQUESTS TABLE */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {filteredDeposits.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                <Coins size={30} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-800">No COD cash deposit requests found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                When delivery boys submit collected COD cash for settlement, the requests will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-amber-50/60 text-[11px] font-bold uppercase tracking-wider text-amber-800">
                    <th className="px-6 py-4">Delivery Driver</th>
                    <th className="px-6 py-4">Submitted Deposit Amount</th>
                    <th className="px-6 py-4">Current Driver Cash In Hand</th>
                    <th className="px-6 py-4">Submission Date</th>
                    <th className="px-6 py-4">Settlement Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredDeposits.map((dep) => {
                    const isPending = dep.status === "Pending";
                    const driver = dep.driver || {};
                    const driverObj = typeof driver === "object" ? driver : { _id: driver };

                    return (
                      <tr key={dep._id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-800">
                              {driverObj.name?.charAt(0)?.toUpperCase() || "D"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{driverObj.name || "Delivery Partner"}</p>
                              <p className="text-xs text-slate-400">{driverObj.email || driverObj.contact || "-"}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-bold text-sm text-amber-800 font-mono">
                          ₹{(dep.amount || 0).toLocaleString("en-IN")}
                        </td>

                        <td className="px-6 py-4 font-mono font-semibold text-slate-700">
                          ₹{Number(driverObj.cashInHand || 0).toLocaleString("en-IN")}
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-500">
                          {dep.createdAt ? new Date(dep.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                              isPending
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            <span className={`h-2 w-2 rounded-full ${isPending ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                            {isPending ? "Pending Admin Settlement" : "Completed Settlement"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          {isPending ? (
                            <button
                              type="button"
                              onClick={() => openSettleModal({ ...driverObj, cashInHand: dep.amount || driverObj.cashInHand })}
                              className="rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition"
                            >
                              Settle & Release Commission
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                              <CheckCircle2 size={13} /> Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================== */}
      {/* CREATE DELIVERY BOY MODAL */}
      {/* ===================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <UserPlus size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Add New Delivery Boy</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Contact Number (10 digits)
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={createForm.contact}
                  onChange={(e) => setCreateForm({ ...createForm, contact: e.target.value.replace(/\D/g, "") })}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="e.g. delivery.rahul@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Vehicle Details */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                  <Bike size={15} /> Vehicle Credentials
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={createForm.vehicleType}
                      onChange={(e) => setCreateForm({ ...createForm, vehicleType: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-blue-500 focus:bg-white"
                    >
                      <option value="Bike">Motorcycle / Bike</option>
                      <option value="Scooter">Scooter / Moped</option>
                      <option value="Electric Vehicle">Electric Bike / EV</option>
                      <option value="Bicycle">Bicycle</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Vehicle Model
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hero Splendor"
                      value={createForm.vehicleModel}
                      onChange={(e) => setCreateForm({ ...createForm, vehicleModel: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Bike Reg. Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MH-12-AB-1234"
                      value={createForm.bikeNumber}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, bikeNumber: e.target.value.toUpperCase() })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono uppercase tracking-wider outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Driving License No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DL-14201100..."
                      value={createForm.licenseNumber}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, licenseNumber: e.target.value.toUpperCase() })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono uppercase outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <RefreshCw size={15} className="animate-spin" />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* EDIT DELIVERY BOY MODAL */}
      {/* ===================================================== */}
      {showEditModal && selectedDeliveryBoy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Pencil size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Edit Delivery Boy</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Contact Number (10 digits)
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={editForm.contact}
                  onChange={(e) => setEditForm({ ...editForm, contact: e.target.value.replace(/\D/g, "") })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  COD Cash in Hand (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.cashInHand}
                  onChange={(e) => setEditForm({ ...editForm, cashInHand: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Collected COD cash pending admin settlement.
                </p>
              </div>

              {/* Vehicle Details */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                    <Bike size={15} /> Vehicle Credentials
                  </p>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Admin Override Mode
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={editForm.vehicleType}
                      onChange={(e) => setEditForm({ ...editForm, vehicleType: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-blue-500 focus:bg-white"
                    >
                      <option value="Bike">Motorcycle / Bike</option>
                      <option value="Scooter">Scooter / Moped</option>
                      <option value="Electric Vehicle">Electric Bike / EV</option>
                      <option value="Bicycle">Bicycle</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Vehicle Model
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hero Splendor"
                      value={editForm.vehicleModel}
                      onChange={(e) => setEditForm({ ...editForm, vehicleModel: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Bike Reg. Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MH-12-AB-1234"
                      value={editForm.bikeNumber}
                      onChange={(e) =>
                        setEditForm({ ...editForm, bikeNumber: e.target.value.toUpperCase() })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono uppercase tracking-wider outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Driving License No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DL-14201100..."
                      value={editForm.licenseNumber}
                      onChange={(e) =>
                        setEditForm({ ...editForm, licenseNumber: e.target.value.toUpperCase() })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono uppercase outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                <div>
                  <p className="text-xs font-bold text-slate-800">Account Active Status</p>
                  <p className="text-[11px] text-slate-500">Disabled users cannot be assigned to new orders</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    editForm.isActive ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      editForm.isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <RefreshCw size={15} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEACTIVATION CONFIRMATION ALERT POPUP MODAL */}
      {deactivateConfirmBoy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
              <AlertCircle size={26} />
            </div>

            <h3 className="text-center text-base font-bold text-slate-900">
              Deactivate Delivery Boy?
            </h3>
            <p className="mt-2 text-center text-xs text-slate-500 leading-relaxed">
              Are you sure you want to deactivate <strong className="text-slate-800">{deactivateConfirmBoy.name}</strong>? Deactivated delivery partners cannot be assigned to new customer orders.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeactivateConfirmBoy(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={() => executeStatusToggle(deactivateConfirmBoy, false)}
                className="flex-1 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition"
              >
                Yes, Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTLE COD CASH & RELEASE COMMISSION MODAL */}
      {settleModalBoy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-base">
                <Coins size={20} />
                <span>Settle COD Cash & Release Commission</span>
              </div>
              <button
                type="button"
                onClick={() => setSettleModalBoy(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Confirm receiving collected COD cash from driver <strong className="text-slate-900">{settleModalBoy.name}</strong>. Settling cash will automatically unlock and credit their delivery commission to their driver wallet balance!
            </p>

            <form onSubmit={confirmSettleCash} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Cash Amount Received (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={settleAmountInput}
                    onChange={(e) => setSettleAmountInput(e.target.value)}
                    placeholder="Enter cash received"
                    className="w-full rounded-xl border border-slate-300 pl-8 pr-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500 font-medium">
                  Current driver cash in hand: ₹{(Number(settleModalBoy.cashInHand) || 0).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <CheckCircle2 size={15} className="text-emerald-600" /> Commission Release Rule
                </p>
                <p className="text-emerald-700 leading-relaxed text-[11px]">
                  Upon confirming settlement, ₹50 commission per delivered COD order will be credited straight to the driver's wallet balance!
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleModalBoy(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={settling}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition disabled:opacity-50"
                >
                  {settling ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Settling Cash...
                    </>
                  ) : (
                    <>
                      <Hand size={15} /> Confirm & Release Commission
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRIVER APPRAISAL & PERFORMANCE REPORT MODAL */}
      {appraisalModalBoy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white font-extrabold shadow-md">
                  <Award size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Driver Performance Appraisal
                  </h3>
                  <p className="text-xs font-medium text-slate-600 flex items-center gap-1 mt-0.5">
                    <strong>{appraisalModalBoy.name}</strong> ({appraisalModalBoy.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAppraisalModalBoy(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {loadingAppraisal ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-3">
                  <RefreshCw size={30} className="animate-spin text-amber-500" />
                  <p className="text-xs font-bold uppercase tracking-wider">Generating Dynamic Appraisal Report...</p>
                </div>
              ) : appraisalData ? (
                <>
                  {/* APPRAISAL OVERVIEW TIER BADGE */}
                  <div className="rounded-2xl bg-slate-900 p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">Official Appraisal Grade</span>
                      <h4 className="text-xl font-extrabold mt-1 text-white flex items-center gap-2">
                        {appraisalData.performanceBadge}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 font-medium">{appraisalData.appraisalTier}</p>
                    </div>
                    <div className="text-right bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Customer Rating</span>
                      <span className="text-2xl font-black text-amber-400">⭐ {appraisalData.averageRating} <span className="text-xs text-slate-400 font-normal">/ 5.0</span></span>
                    </div>
                  </div>

                  {/* KEY PERFORMANCE METRICS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Reviews</p>
                      <p className="text-xl font-black text-slate-900 mt-1">{appraisalData.totalRatingsCount}</p>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">5-Star Ratio</p>
                      <p className="text-xl font-black text-amber-800 mt-1">{appraisalData.fiveStarPercentage}%</p>
                    </div>
                    <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Total Delivered</p>
                      <p className="text-xl font-black text-purple-900 mt-1">{appraisalData.totalCompletedDeliveries}</p>
                    </div>
                    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">5★ Count</p>
                      <p className="text-xl font-black text-blue-900 mt-1">{appraisalData.starCounts[5]}</p>
                    </div>
                  </div>

                  {/* RATING BREAKDOWN BARS */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2.5">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Star Rating Distribution Breakdown</h5>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = appraisalData.starCounts[star] || 0;
                      const pct = appraisalData.totalRatingsCount > 0 ? (count / appraisalData.totalRatingsCount) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-3 text-xs">
                          <span className="w-12 font-bold text-slate-700 flex items-center gap-1">
                            {star} <Star size={12} className="fill-amber-400 text-amber-500" />
                          </span>
                          <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-10 text-right font-semibold text-slate-500">{count}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* LIVE CUSTOMER REVIEWS FEED */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-blue-600" /> Customer Feedback & Reviews History ({appraisalData.reviews.length})
                    </h5>

                    {appraisalData.reviews.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 font-medium">
                        No written customer reviews recorded yet for this driver.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {appraisalData.reviews.map((rev, idx) => (
                          <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{rev.customerName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">Order #{rev.orderId}</span>
                              </div>
                              <span className="font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                ⭐ {rev.rating} / 5
                              </span>
                            </div>

                            {rev.review && (
                              <p className="text-slate-700 font-medium italic bg-white p-2.5 rounded-xl border border-slate-100">
                                "{rev.review}"
                              </p>
                            )}

                            {rev.tags && rev.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {rev.tags.map((t, ti) => (
                                  <span key={ti} className="rounded-lg bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}

                            <p className="text-[10px] text-slate-400 text-right">
                              {rev.ratedAt ? new Date(rev.ratedAt).toLocaleString("en-IN") : "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-xs text-slate-400">Failed to load report data.</div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 p-4 bg-slate-50/70 flex justify-end">
              <button
                type="button"
                onClick={() => setAppraisalModalBoy(null)}
                className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 shadow-sm transition"
              >
                Close Appraisal Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDelivery
