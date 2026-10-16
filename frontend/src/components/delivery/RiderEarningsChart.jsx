import { useMemo } from "react";
import { TrendingUp, Award, Calendar, DollarSign, ArrowUpRight, Coins, PackageCheck } from "lucide-react";

const RiderEarningsChart = ({ transactions = [], completedDeliveries = 0 }) => {
  // Process last 7 days earnings
  const chartData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split("T")[0];
      last7Days.push({
        dateStr,
        dayName,
        shortDate: `${d.getDate()} ${d.toLocaleString("en-IN", { month: "short" })}`,
        earnings: 0,
        codCollected: 0,
        count: 0,
      });
    }

    let totalEarnings = 0;
    let totalCod = 0;

    transactions.forEach((tx) => {
      if (!tx.createdAt) return;
      const txDate = new Date(tx.createdAt).toISOString().split("T")[0];
      const dayObj = last7Days.find((item) => item.dateStr === txDate);

      const amount = Number(tx.amount || 0);

      if (tx.type === "credit" || tx.type === "delivery_fee") {
        totalEarnings += amount;
        if (dayObj) {
          dayObj.earnings += amount;
          dayObj.count += 1;
        }
      } else if (tx.type === "cod_collection") {
        totalCod += amount;
        if (dayObj) {
          dayObj.codCollected += amount;
        }
      }
    });

    const maxEarnings = Math.max(...last7Days.map((d) => d.earnings), 1);
    const peakDay = [...last7Days].sort((a, b) => b.earnings - a.earnings)[0];

    return {
      last7Days,
      totalEarnings,
      totalCod,
      maxEarnings,
      peakDay: peakDay?.earnings > 0 ? peakDay : null,
    };
  }, [transactions]);

  const avgPerDelivery = completedDeliveries > 0 ? Math.round(chartData.totalEarnings / completedDeliveries) : 0;

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
              <TrendingUp size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Weekly Performance & Earnings</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">7-day breakdown of your delivery commissions & COD collections</p>
        </div>

        {chartData.peakDay && (
          <div className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-200/80 px-3.5 py-1.5 text-xs font-bold text-amber-800">
            <Award size={16} className="text-amber-500" />
            <span>Peak Day: {chartData.peakDay.dayName} (₹{chartData.peakDay.earnings.toLocaleString("en-IN")})</span>
          </div>
        )}
      </div>

      {/* SUMMARY STATS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400">7-Day Payout</p>
          <p className="text-lg font-extrabold text-blue-600 mt-0.5">₹{chartData.totalEarnings.toLocaleString("en-IN")}</p>
          <span className="text-[10px] text-slate-500 font-medium">Direct Wallet Credit</span>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400">COD Collected</p>
          <p className="text-lg font-extrabold text-emerald-600 mt-0.5">₹{chartData.totalCod.toLocaleString("en-IN")}</p>
          <span className="text-[10px] text-slate-500 font-medium">Cash in Hand</span>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400">Avg / Delivery</p>
          <p className="text-lg font-extrabold text-slate-900 mt-0.5">₹{avgPerDelivery}</p>
          <span className="text-[10px] text-slate-500 font-medium">Average Payout</span>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400">Deliveries</p>
          <p className="text-lg font-extrabold text-purple-600 mt-0.5">{completedDeliveries || 0}</p>
          <span className="text-[10px] text-slate-500 font-medium">Completed</span>
        </div>
      </div>

      {/* 7-DAY BAR CHART */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Daily Commission Trend (Last 7 Days)</span>
          <span className="text-[11px] font-semibold text-slate-400">Amounts in ₹</span>
        </div>

        <div className="grid grid-cols-7 gap-2 items-end h-40 pt-6 pb-2 border-b border-slate-100">
          {chartData.last7Days.map((day) => {
            const heightPercent = chartData.maxEarnings > 0 ? (day.earnings / chartData.maxEarnings) * 100 : 0;
            const isPeak = chartData.peakDay && chartData.peakDay.dateStr === day.dateStr;

            return (
              <div key={day.dateStr} className="flex flex-col items-center h-full justify-end group relative">
                {/* TOOLTIP ON HOVER */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] font-bold rounded-lg px-2 py-1 whitespace-nowrap shadow-md pointer-events-none z-10">
                  ₹{day.earnings.toLocaleString("en-IN")} ({day.count} Orders)
                </div>

                {/* EARNINGS AMOUNT LABEL */}
                <span className="text-[10px] font-bold text-slate-600 mb-1">
                  {day.earnings > 0 ? `₹${day.earnings}` : "-"}
                </span>

                {/* BAR */}
                <div className="w-full max-w-[36px] bg-slate-100 rounded-t-xl overflow-hidden h-full flex items-end">
                  <div
                    className={`w-full transition-all duration-700 rounded-t-xl ${
                      isPeak
                        ? "bg-gradient-to-t from-amber-500 to-amber-400 shadow-sm"
                        : day.earnings > 0
                        ? "bg-gradient-to-t from-blue-600 to-indigo-500"
                        : "bg-slate-200/60"
                    }`}
                    style={{ height: `${Math.max(heightPercent, 8)}%` }}
                  />
                </div>

                {/* DAY LABEL */}
                <span className={`mt-2 text-xs font-bold ${isPeak ? "text-amber-600 font-extrabold" : "text-slate-600"}`}>
                  {day.dayName}
                </span>
                <span className="text-[9px] text-slate-400 font-medium">{day.shortDate}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RiderEarningsChart;
