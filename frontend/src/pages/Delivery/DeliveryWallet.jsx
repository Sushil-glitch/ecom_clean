import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "../../utils/toast.js";
import { DELIVERY_API_URL } from "../../config/api.js";
import RiderEarningsChart from "../../components/delivery/RiderEarningsChart.jsx";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  DollarSign,
  Info,
  Clock,
  Sparkles,
  Edit2,
  Check,
  X,
  CreditCard,
} from "lucide-react";

const DeliveryWallet = () => {
  const [wallet, setWallet] = useState({
    balance: 0,
    upiId: "",
    minWithdrawalAmount: 1000,
    minMaintainBalance: 500,
    maxWithdrawable: 0,
  });

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UPI Editing State
  const [upiInput, setUpiInput] = useState("");
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [upiLoading, setUpiLoading] = useState(false);

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // COD Cash Deposit State
  const [depositAmountInput, setDepositAmountInput] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  const handleDepositCash = async (e) => {
    e.preventDefault();
    const numDeposit = Number(depositAmountInput);

    if (!numDeposit || isNaN(numDeposit) || numDeposit <= 0) {
      toast.error("Please enter a valid deposit amount.");
      return;
    }

    const currentCash = wallet.cashInHand || 0;
    if (numDeposit > currentCash) {
      toast.error(`Deposit amount cannot exceed pending Cash in Hand (₹${currentCash.toLocaleString("en-IN")})`);
      return;
    }

    try {
      setDepositLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.post(
        `${DELIVERY_API_URL}/wallet/deposit`,
        { amount: numDeposit },
        { headers }
      );

      if (res.data?.success) {
        toast.success(res.data.message || "COD Cash Deposited & Settled to store successfully!");
        setDepositAmountInput("");
        setShowDepositModal(false);
        fetchWallet(true);
      }
    } catch (err) {
      console.error("Deposit cash error:", err);
      toast.error(err.response?.data?.message || "Failed to deposit cash");
    } finally {
      setDepositLoading(false);
    }
  };

  const fetchWallet = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(`${DELIVERY_API_URL}/wallet`, { headers });

      if (res.data?.success) {
        setWallet(res.data.wallet || {});
        setTransactions(res.data.transactions || []);
        if (res.data.wallet?.upiId) {
          setUpiInput(res.data.wallet.upiId);
        }
      }
    } catch (err) {
      console.error("Fetch wallet error:", err);
      toast.error(err.response?.data?.message || "Failed to load wallet information");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // UPDATE UPI HANDLER
  const handleSaveUpi = async (e) => {
    e.preventDefault();
    if (!upiInput || !upiInput.trim()) {
      toast.error("Please enter a valid UPI ID (e.g. driver@upi)");
      return;
    }

    try {
      setUpiLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.put(
        `${DELIVERY_API_URL}/wallet/upi`,
        { upiId: upiInput.trim() },
        { headers }
      );

      if (res.data?.success) {
        toast.success("UPI ID updated successfully!");
        setWallet((prev) => ({ ...prev, upiId: res.data.upiId }));
        setIsEditingUpi(false);
      }
    } catch (err) {
      console.error("Update UPI error:", err);
      toast.error(err.response?.data?.message || "Failed to update UPI ID");
    } finally {
      setUpiLoading(false);
    }
  };

  // WITHDRAW CASH HANDLER
  const handleWithdraw = async (e) => {
    e.preventDefault();
    const numAmount = Number(withdrawAmount);

    if (!wallet.upiId) {
      toast.error("Please set and save your UPI ID before withdrawing.");
      return;
    }

    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid withdrawal amount.");
      return;
    }

    if (numAmount < wallet.minWithdrawalAmount) {
      toast.error(`Minimum withdrawal amount is ₹${wallet.minWithdrawalAmount.toLocaleString("en-IN")}`);
      return;
    }

    const remaining = wallet.balance - numAmount;
    if (remaining < wallet.minMaintainBalance) {
      toast.error(`Wallet balance after withdrawal must remain at least ₹${wallet.minMaintainBalance.toLocaleString("en-IN")}`);
      return;
    }

    try {
      setWithdrawLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.post(
        `${DELIVERY_API_URL}/wallet/withdraw`,
        { amount: numAmount, upiId: wallet.upiId },
        { headers }
      );

      if (res.data?.success) {
        toast.success(res.data.message || "Withdrawal successful!");
        setWithdrawAmount("");
        fetchWallet(true);
      }
    } catch (err) {
      console.error("Withdrawal error:", err);
      toast.error(err.response?.data?.message || "Cash withdrawal failed");
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Dynamic Validation helpers for cash withdrawal
  const numWithdraw = Number(withdrawAmount) || 0;
  const projectedRemaining = wallet.balance - numWithdraw;
  const isAmountTooLow = numWithdraw > 0 && numWithdraw < wallet.minWithdrawalAmount;
  const isBalanceTooLow = numWithdraw > 0 && projectedRemaining < wallet.minMaintainBalance;
  const isExceedsBalance = numWithdraw > wallet.balance;

  const isValidWithdrawal =
    numWithdraw >= wallet.minWithdrawalAmount &&
    projectedRemaining >= wallet.minMaintainBalance &&
    numWithdraw <= wallet.balance &&
    Boolean(wallet.upiId);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
          <RefreshCw size={20} className="animate-spin text-blue-600" />
          Loading your driver wallet...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Driver Earnings & Cash Out</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Delivery Wallet
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your UPI ID, withdraw cash directly to your bank, and track payout history.
          </p>
        </div>

        <button
          onClick={() => fetchWallet(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
        >
          <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh Balance"}
        </button>
      </div>

      {/* WALLET METRICS & RULES BANNER */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* DRIVER EARNED COMMISSION BALANCE CARD */}
        <div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 text-white shadow-xl relative overflow-hidden flex flex-col justify-between border border-slate-800">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-emerald-400 border border-white/10 backdrop-blur-md">
                <Wallet size={16} /> Earned Delivery Commission
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <ShieldCheck size={14} className="text-blue-400" /> Instant UPI Withdrawal
              </span>
            </div>

            <div className="mt-5">
              <p className="text-xs uppercase tracking-wider font-medium text-slate-400">
                Driver Withdrawable Balance
              </p>
              <div className="mt-1 flex items-baseline gap-3">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  ₹{wallet.balance.toLocaleString("en-IN")}
                </h2>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-800/80 pt-4 text-sm">
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10 backdrop-blur-xs">
              <p className="text-[11px] text-slate-400 font-medium">Withdrawable Now</p>
              <p className="text-base font-bold text-emerald-400 mt-0.5">
                ₹{wallet.maxWithdrawable.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Balance above min ₹{wallet.minMaintainBalance}
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 p-3 border border-white/10 backdrop-blur-xs">
              <p className="text-[11px] text-slate-400 font-medium">Maintain Reserve</p>
              <p className="text-base font-bold text-amber-400 mt-0.5">
                ₹{wallet.minMaintainBalance.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Required minimum balance
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 p-3 border border-white/10 backdrop-blur-xs">
              <p className="text-[11px] text-slate-400 font-medium">Delivered Orders</p>
              <p className="text-base font-bold text-blue-400 mt-0.5">
                {wallet.stats?.deliveredCount || 0} Delivered
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                ₹{wallet.stats?.totalEarned || 0} earned
              </p>
            </div>
          </div>
        </div>

        {/* WITHDRAWAL CONDITIONS INFO BOX */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
              <Info size={18} />
              <span>Withdrawal Rules & Conditions</span>
            </div>

            <ul className="mt-4 space-y-3.5 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-[11px]">
                  1
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Minimum Withdrawal:</span>
                  <p className="text-slate-500 mt-0.5">
                    You can only withdraw amounts of <strong className="text-slate-900">₹1,000 or above</strong> per transaction.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-[11px]">
                  2
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Wallet Balance Maintained:</span>
                  <p className="text-slate-500 mt-0.5">
                    Your wallet balance after withdrawal must remain at least <strong className="text-slate-900">₹500</strong>.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-[11px]">
                  3
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Instant UPI Payout:</span>
                  <p className="text-slate-500 mt-0.5">
                    Funds will be sent directly to your registered UPI address.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 border border-slate-100 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500 shrink-0" />
            <span>Complete more deliveries to increase your withdrawable balance!</span>
          </div>
        </div>
      </div>

      {/* RIDER WEEKLY EARNINGS & PERFORMANCE ANALYTICS CHART */}
      <RiderEarningsChart
        transactions={transactions}
        completedDeliveries={transactions.filter((t) => t.type === "credit" || t.type === "delivery_fee").length}
      />

      {/* UPI CONFIG & CASH WITHDRAWAL SECTION */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* UPI DETAILS MANAGEMENT */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">UPI Payout Address</h3>
                <p className="text-xs text-slate-500">Registered UPI ID for instant cash transfers</p>
              </div>
            </div>

            {wallet.upiId && !isEditingUpi && (
              <button
                type="button"
                onClick={() => setIsEditingUpi(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <Edit2 size={13} /> Change
              </button>
            )}
          </div>

          <div className="mt-5">
            {!wallet.upiId || isEditingUpi ? (
              <form onSubmit={handleSaveUpi} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Enter UPI ID (e.g., driver@ybl, 9876543210@paytm)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={upiInput}
                      onChange={(e) => setUpiInput(e.target.value)}
                      placeholder="e.g. rahul@upi"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Supports Google Pay, PhonePe, Paytm, BHIM, and net banking UPI handles.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={upiLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {upiLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check size={14} /> Save UPI ID
                      </>
                    )}
                  </button>

                  {wallet.upiId && (
                    <button
                      type="button"
                      onClick={() => {
                        setUpiInput(wallet.upiId);
                        setIsEditingUpi(false);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                      <X size={14} /> Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Active UPI ID</p>
                      <p className="text-base font-bold text-slate-900 font-mono">
                        {wallet.upiId}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                    Verified
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CASH WITHDRAWAL ACTION CARD */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ArrowUpRight size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Withdraw Cash to UPI</h3>
                <p className="text-xs text-slate-500">Transfer money directly to your UPI account</p>
              </div>
            </div>

            <form onSubmit={handleWithdraw} className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Withdrawal Amount (₹)
                  </label>
                  <span className="text-[11px] font-medium text-slate-500">
                    Max: ₹{wallet.maxWithdrawable.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={wallet.minWithdrawalAmount}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount (min ₹1,000)"
                    className="w-full rounded-xl border border-slate-300 pl-8 pr-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* PRESET CHIPS */}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {[1000, 1500, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setWithdrawAmount(amt.toString())}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      ₹{amt.toLocaleString("en-IN")}
                    </button>
                  ))}
                  {wallet.maxWithdrawable >= wallet.minWithdrawalAmount && (
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(wallet.maxWithdrawable.toString())}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      Max (₹{wallet.maxWithdrawable.toLocaleString("en-IN")})
                    </button>
                  )}
                </div>

                {/* LIVE DYNAMIC VALIDATION FEEDBACK */}
                {numWithdraw > 0 && (
                  <div className="mt-3 rounded-xl p-3 text-xs space-y-1 bg-slate-50 border border-slate-200">
                    <div className="flex justify-between font-medium text-slate-600">
                      <span>Projected Wallet Balance after payout:</span>
                      <span
                        className={`font-bold ${
                          projectedRemaining >= wallet.minMaintainBalance
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        ₹{projectedRemaining.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {isAmountTooLow && (
                      <p className="text-red-600 font-semibold flex items-center gap-1 pt-1">
                        <AlertCircle size={14} /> Minimum withdrawal condition is ₹1,000.
                      </p>
                    )}

                    {isBalanceTooLow && (
                      <p className="text-red-600 font-semibold flex items-center gap-1 pt-1">
                        <AlertCircle size={14} /> Wallet balance must remain at least ₹500.
                      </p>
                    )}

                    {isExceedsBalance && (
                      <p className="text-red-600 font-semibold flex items-center gap-1 pt-1">
                        <AlertCircle size={14} /> Withdrawal amount exceeds total wallet balance.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={withdrawLoading || !isValidWithdrawal}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {withdrawLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Processing Withdrawal...
                  </>
                ) : (
                  <>
                    <ArrowUpRight size={18} /> Withdraw ₹{numWithdraw ? numWithdraw.toLocaleString("en-IN") : "Cash"}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* TRANSACTION HISTORY */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Wallet Transactions</h3>
            <p className="text-xs text-slate-500">History of driver income credits and UPI cash withdrawals</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Total Logs: {transactions.length}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm font-medium">
            No transactions found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Transaction Type</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">UPI / Details</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Balance After</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {transactions.map((tx) => {
                  const isWithdrawal = tx.type === "withdrawal";
                  const isCodCollection = tx.type === "cod_collection";
                  const isCashDeposit = tx.type === "cash_deposit";

                  let typeTitle = "Driver Commission Credit";
                  let amountColor = "text-emerald-600";
                  let sign = "+";
                  let Icon = ArrowDownLeft;
                  let iconBg = "bg-emerald-50 text-emerald-600";

                  if (isWithdrawal) {
                    typeTitle = "UPI Cash Withdrawal";
                    amountColor = "text-amber-600";
                    sign = "-";
                    Icon = ArrowUpRight;
                    iconBg = "bg-amber-50 text-amber-600";
                  } else if (isCodCollection) {
                    typeTitle = "COD Cash Collected";
                    amountColor = "text-orange-600";
                    sign = "+";
                    Icon = Coins;
                    iconBg = "bg-orange-50 text-orange-600";
                  } else if (isCashDeposit) {
                    typeTitle = "COD Cash Deposited to Store";
                    amountColor = "text-blue-600";
                    sign = "-";
                    Icon = CheckCircle2;
                    iconBg = "bg-blue-50 text-blue-600";
                  }

                  return (
                    <tr key={tx._id || tx.createdAt} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{typeTitle}</p>
                            <p className="text-[11px] text-slate-400">{tx.description || "-"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-bold text-sm">
                        <span className={amountColor}>
                          {sign}₹{tx.amount?.toLocaleString("en-IN")}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-mono text-slate-700">
                        {tx.upiId || (isCodCollection ? "Cash Received" : isCashDeposit ? "Deposit Settled" : "-")}
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }) : "-"}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-800">
                        ₹{tx.balanceAfter?.toLocaleString("en-IN")}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            tx.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : tx.status === "Pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {tx.status || "Completed"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DEPOSIT COD CASH MODAL */}
      {showDepositModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-base">
                <Coins size={20} />
                <span>Deposit Collected COD Cash</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDepositModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Enter the amount of collected COD cash you are depositing/handing over to the store admin.
            </p>

            <form onSubmit={handleDepositCash} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deposit Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    max={wallet.cashInHand || 0}
                    min={1}
                    value={depositAmountInput}
                    onChange={(e) => setDepositAmountInput(e.target.value)}
                    placeholder="Enter deposit amount"
                    className="w-full rounded-xl border border-slate-300 pl-8 pr-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Max available pending deposit: ₹{(wallet.cashInHand || 0).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={depositLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition disabled:opacity-50"
                >
                  {depositLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Depositing...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Confirm Cash Deposit
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryWallet;
