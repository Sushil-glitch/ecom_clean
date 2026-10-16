import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench, Sparkles, Clock, ShieldCheck } from "lucide-react";
import axios from "axios";
import { SYSTEM_API_URL } from "../config/api";

const Maintenance = () => {
  const navigate = useNavigate();
  const [maintenanceInfo, setMaintenanceInfo] = useState({
    isMaintenanceMode: true,
    maintenanceMessage: "We are currently performing scheduled platform maintenance to improve your shopping experience. Please check back again later!",
    estimatedEndTime: "Soon",
  });

  const checkStatus = async () => {
    try {
      const res = await axios.get(`${SYSTEM_API_URL}/maintenance`);
      if (res.data?.success && res.data.settings) {
        setMaintenanceInfo(res.data.settings);
        // If maintenance is turned off by admin, automatically restore to home!
        if (!res.data.settings.isMaintenanceMode) {
          navigate("/", { replace: true });
        }
      }
    } catch (err) {
      console.error("Maintenance status check error:", err);
    }
  };

  useEffect(() => {
    checkStatus();
    // Auto-check status silently every 10 seconds
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-white flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* BACKGROUND GLOW ORBS & DECORATION */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />

      {/* TOP HEADER */}
      <header className="relative z-10 w-full border-b border-slate-800/80 bg-slate-900/40 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-xs">
              <Wrench size={18} className="animate-bounce" />
            </div>
            <span className="text-base font-black tracking-tight text-white sm:text-lg">
              ElectroZone
            </span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-400 border border-amber-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            Under Maintenance
          </div>
        </div>
      </header>

      {/* MAIN HERO CONTENT (CLEAN USER POV - NO BUTTONS) */}
      <main className="relative z-10 mx-auto w-full max-w-2xl px-4 py-12 text-center my-auto">
        <div className="relative mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent border border-amber-500/30 text-amber-400 shadow-2xl shadow-amber-500/10">
          <div className="absolute inset-0 rounded-3xl bg-amber-500/5 animate-pulse" />
          <Wrench size={52} className="relative z-10 transform -rotate-12 transition duration-500" />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 px-4 py-1.5 text-xs font-extrabold text-slate-300 border border-slate-800 shadow-inner">
          <Sparkles size={14} className="text-amber-400" /> Scheduled System Maintenance
        </span>

        <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">
          We'll Be Back <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">Soon!</span>
        </h1>

        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-slate-300 font-medium">
          {maintenanceInfo.maintenanceMessage || "We are currently performing scheduled platform maintenance to improve your shopping experience. Please check back again later!"}
        </p>

        {/* ESTIMATED COMPLETION & USER NOTICE BANNER */}
        <div className="mt-8 mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 pb-3 border-b border-slate-800/80">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Clock size={15} /> Estimated Completion
            </span>
            <span className="text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 font-extrabold">
              {maintenanceInfo.estimatedEndTime || "Very Soon"}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-1">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
            <span>Please come back again later. Thank you for your patience!</span>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} ElectroZone. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Maintenance;
