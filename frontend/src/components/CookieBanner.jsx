import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie, ShieldCheck, X } from "lucide-react";

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("electrozone_cookie_consent");
      if (!saved) {
        // Wait 1 second after page load before displaying banner
        const timer = setTimeout(() => setIsVisible(true), 1000);
        return () => clearTimeout(timer);
      } else {
        setPreferences(JSON.parse(saved));
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const savePreferences = (prefs) => {
    try {
      localStorage.setItem("electrozone_cookie_consent", JSON.stringify(prefs));
    } catch (e) {
      console.error("Could not save cookie preferences:", e);
    }
    setPreferences(prefs);
    setIsVisible(false);
    setShowManageModal(false);
  };

  const handleAcceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      marketing: true,
    });
  };

  const handleRejectNonEssential = () => {
    savePreferences({
      essential: true,
      analytics: false,
      marketing: false,
    });
  };

  const handleCustomSave = () => {
    savePreferences(preferences);
  };

  if (!isVisible && !showManageModal) return null;

  return (
    <>
      {/* FLOATING CONSENT BANNER */}
      {isVisible && !showManageModal && (
        <aside
          role="dialog"
          aria-label="Cookie consent banner"
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-3xl border border-slate-700/80 bg-slate-900/95 p-5 text-white shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300 sm:p-6"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Cookie size={22} />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  We value your privacy
                  <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                    GDPR & IT Act Compliant
                  </span>
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  ElectroZone uses essential cookies to authenticate your account and ensure secure checkout. We also use analytics cookies to optimize performance and product discovery. Read our{" "}
                  <Link to="/cookie-preferences" className="text-blue-400 underline hover:text-blue-300">
                    Cookie Policy
                  </Link>{" "}
                  for details.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0">
              <button
                type="button"
                onClick={() => setShowManageModal(true)}
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
              >
                Customize
              </button>
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 active:scale-95"
              >
                Accept All
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* MANAGE PREFERENCES MODAL */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-modal-title"
            className="relative w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-blue-400" />
                <h3 id="cookie-modal-title" className="text-base font-bold text-white">
                  Cookie Preferences
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              {/* Essential */}
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">Essential Cookies</h4>
                    <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      Always Required
                    </span>
                  </div>
                  <p className="mt-1 text-slate-400 leading-relaxed">
                    Necessary for user login, cart persistence, security CSRF protection, and payment routing. Cannot be disabled.
                  </p>
                </div>
                <div
                  role="switch"
                  aria-checked="true"
                  aria-disabled="true"
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed items-center rounded-full bg-emerald-600 p-1"
                >
                  <span className="inline-block h-4 w-4 translate-x-5 transform rounded-full bg-white shadow-sm" />
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div>
                  <h4 className="font-bold text-white text-sm">Performance & Analytics</h4>
                  <p className="mt-1 text-slate-400 leading-relaxed">
                    Helps us understand page load speeds, error rates, and search patterns to continuously improve your experience.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.analytics}
                  onClick={() =>
                    setPreferences((prev) => ({ ...prev, analytics: !prev.analytics }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors ${
                    preferences.analytics ? "bg-blue-600" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      preferences.analytics ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div>
                  <h4 className="font-bold text-white text-sm">Marketing & Personalized Offers</h4>
                  <p className="mt-1 text-slate-400 leading-relaxed">
                    Used to deliver relevant gadget discounts and new tech launch updates tailored to your interests.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.marketing}
                  onClick={() =>
                    setPreferences((prev) => ({ ...prev, marketing: !prev.marketing }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors ${
                    preferences.marketing ? "bg-blue-600" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      preferences.marketing ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCustomSave}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieBanner;
