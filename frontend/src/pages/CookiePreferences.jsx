import React, { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BackToTop from "../components/BackToTop.jsx";
import { Cookie, Save, Check, Mail, ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const CookiePreferences = () => {
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    analytics: true,
    marketing: false,
  });

  const [saved, setSaved] = useState(false);

  const handleToggle = (key) => {
    if (key === "essential") return;
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("cookiePreferences", JSON.stringify(preferences));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
            <Cookie size={14} /> Cookie Control Center
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-8">
          {/* HEADER */}
          <div className="border-b border-slate-100 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
              <Cookie size={24} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
              Cookie Preferences
            </h1>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Manage your cookie settings for <strong className="text-slate-800">ElectroZone</strong>. We use cookies to enhance navigation, remember your cart items, and provide secure authentication.
            </p>
          </div>

          {/* COOKIE TYPES */}
          <div className="space-y-4">
            {/* ESSENTIAL */}
            <div className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-4 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Essential Cookies</h3>
                  <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">Required</span>
                </div>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Necessary for site operation, maintaining user sessions, cart state, and secure checkout.
                </p>
              </div>
              <input
                type="checkbox"
                checked={true}
                disabled={true}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 opacity-60 cursor-not-allowed"
              />
            </div>

            {/* ANALYTICS */}
            <div className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-4 gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Performance & Analytics Cookies</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Helps us understand how visitors interact with ElectroZone so we can improve store layout and performance.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={() => handleToggle("analytics")}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* MARKETING */}
            <div className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-4 gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Marketing & Personalization Cookies</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Used to deliver relevant deals, tech recommendations, and tailored promotions.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={() => handleToggle("marketing")}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-6">
            {saved ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <Check size={16} /> Cookie Preferences Saved!
              </span>
            ) : (
              <span className="text-xs text-slate-400">Customized settings will be saved locally.</span>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
            >
              <Save size={15} /> Save Preferences
            </button>
          </div>

          {/* CONTACT FOOTER */}
          <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Mail size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Have questions about cookies?</p>
              <a
                href="mailto:support@electrozone.com"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                support@electrozone.com
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default CookiePreferences;
