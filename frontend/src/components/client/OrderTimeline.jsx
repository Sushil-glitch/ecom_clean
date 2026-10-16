import { Check, Clock, Truck, PackageCheck, XCircle, Sparkles, CheckCircle2 } from "lucide-react";

const OrderTimeline = ({ orderStatus }) => {
  const isCancelled = orderStatus === "Cancelled";

  const stages = [
    { key: "Placed", label: "Placed", icon: Clock, desc: "Order Placed" },
    { key: "Confirmed", label: "Confirmed", icon: Sparkles, desc: "Order Confirmed" },
    { key: "Processed", label: "Processed", icon: PackageCheck, desc: "Packed & Ready" },
    { key: "Out for Delivery", label: "Out for Delivery", icon: Truck, desc: "Rider En Route" },
    { key: "Received", label: "Received", icon: CheckCircle2, desc: "Order Received" },
  ];

  // Helper to map order status strictly to 1 of 5 sequential stages
  const getActiveStepIndex = () => {
    const status = (orderStatus || "").trim();
    switch (status) {
      case "Pending":
      case "Placed":
      case "Awaiting Confirmation":
        return 0;
      case "Confirmed":
        return 1;
      case "Processing":
      case "Assigned":
      case "Picked Up":
      case "Packed":
        return 2;
      case "Out for Delivery":
      case "Shipped":
      case "In Transit":
        return 3;
      case "Delivered":
      case "Completed":
      case "Received":
        return 4;
      default:
        return 1;
    }
  };

  const activeIndex = getActiveStepIndex();

  if (isCancelled) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-rose-700 font-extrabold text-sm">
          <XCircle size={18} />
          <span>Order Cancelled</span>
        </div>
        <p className="text-xs text-rose-600 mt-0.5">This order was cancelled and is no longer active.</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/60 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-blue-600 animate-ping" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            Order Status Flow
          </h4>
        </div>
        <span className="rounded-full bg-blue-100/90 border border-blue-200/70 px-3 py-1 text-xs font-extrabold text-blue-800 shadow-2xs">
          Stage {activeIndex + 1} of 5: {stages[activeIndex]?.label || "Confirmed"}
        </span>
      </div>

      <div className="relative px-2">
        {/* BACKGROUND CONNECTOR BAR */}
        <div className="absolute left-6 right-6 top-5 h-1.5 bg-slate-200/80 rounded-full -z-0">
          {/* ACTIVE SMOOTH PROGRESS BAR */}
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-700 ease-in-out rounded-full shadow-xs shadow-blue-500/40"
            style={{
              width: `${(activeIndex / (stages.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* STEP NODES */}
        <div className="relative z-10 flex justify-between">
          {stages.map((stage, idx) => {
            const isPassed = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const Icon = stage.icon;

            return (
              <div key={stage.key} className="flex flex-col items-center text-center max-w-[70px] sm:max-w-[90px]">
                {/* NODE ICON BADGE */}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border-2 transition-all duration-500 ${
                    isPassed
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : isCurrent
                      ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100 scale-110"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {isPassed ? (
                    <Check size={18} className="stroke-[3]" />
                  ) : (
                    <Icon size={18} className={isCurrent ? "animate-bounce duration-1000" : ""} />
                  )}
                </div>

                {/* LABEL */}
                <p
                  className={`mt-2.5 text-[11px] sm:text-xs font-bold leading-tight ${
                    isCurrent
                      ? "text-blue-600 font-extrabold"
                      : isPassed
                      ? "text-slate-900"
                      : "text-slate-400"
                  }`}
                >
                  {stage.label}
                </p>

                {/* SUB-DESCRIPTION */}
                <span className="text-[10px] text-slate-400 font-medium mt-0.5 hidden md:block">
                  {stage.desc}
                </span>

                {/* CURRENT LIVE BADGE */}
                {isCurrent && (
                  <span className="mt-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-extrabold text-blue-600 border border-blue-100">
                    Active
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderTimeline;
