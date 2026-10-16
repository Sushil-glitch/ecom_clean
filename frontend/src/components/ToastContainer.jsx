import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { toast } from "../utils/toast.js";

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((newToast) => {
      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, newToast.duration || 4000);
    });

    return () => unsubscribe();
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-6 z-[99999] flex flex-col gap-3 max-w-md w-auto pointer-events-none">
      {toasts.map((t) => {
        let icon = <Info className="text-blue-600 shrink-0" size={20} />;
        let cardStyle = "border-blue-200 bg-white/95 text-slate-900 shadow-blue-900/10";
        let badgeStyle = "bg-blue-100 text-blue-700 border-blue-200";
        let barStyle = "bg-blue-600";
        let title = "System Notification";

        if (t.type === "success") {
          icon = <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />;
          cardStyle = "border-emerald-200/90 bg-white/95 text-slate-900 shadow-emerald-900/10";
          badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-200";
          barStyle = "bg-emerald-500";
          title = "Success Alert";
        } else if (t.type === "error") {
          icon = <AlertCircle className="text-rose-600 shrink-0" size={20} />;
          cardStyle = "border-rose-200/90 bg-white/95 text-slate-900 shadow-rose-900/10";
          badgeStyle = "bg-rose-100 text-rose-800 border-rose-200";
          barStyle = "bg-rose-500";
          title = "Error Alert";
        } else if (t.type === "warning") {
          icon = <AlertTriangle className="text-amber-600 shrink-0" size={20} />;
          cardStyle = "border-amber-200/90 bg-white/95 text-slate-900 shadow-amber-900/10";
          badgeStyle = "bg-amber-100 text-amber-800 border-amber-200";
          barStyle = "bg-amber-500";
          title = "Warning Alert";
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-top-4 zoom-in-95 duration-200 ${cardStyle}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{icon}</div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${badgeStyle}`}>
                    {title}
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-800 leading-relaxed pt-0.5">
                  {t.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-700 transition p-1 rounded-lg hover:bg-slate-100 shrink-0"
                aria-label="Dismiss alert"
              >
                <X size={16} />
              </button>
            </div>

            {/* Countdown progress bar line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
              <div
                className={`h-full ${barStyle} animate-toast-shrink`}
                style={{ animationDuration: `${t.duration || 4000}ms` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
