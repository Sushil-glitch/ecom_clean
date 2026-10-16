import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Home, LayoutDashboard, Truck, ShoppingBag, ArrowLeft, Search } from "lucide-react";
import { useState } from "react";
import { STORE_CATEGORIES } from "../config/categories.js";

const NotFound = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const role = (user?.role || localStorage.getItem("role") || "").toLowerCase();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950 px-4 py-16 text-white selection:bg-blue-600 selection:text-white">
      {/* BACKGROUND GLOW ORBS */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl text-center">
        {/* 404 BIG ILLUSTRATION BADGE */}
        <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent border border-blue-500/30 text-blue-400 shadow-2xl shadow-blue-500/10">
          <div className="absolute inset-0 rounded-3xl bg-blue-500/5 animate-pulse" />
          <AlertTriangle size={48} className="relative z-10 text-blue-400 animate-bounce" />
        </div>

        <p className="text-xs font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-4 py-1.5 rounded-full inline-block border border-blue-500/20">
          Error 404 • Page Not Found
        </p>

        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
          Looking for Something Else?
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-400 max-w-md mx-auto">
          The page or product link you are trying to reach doesn't exist or has been moved. Use the search or explore popular categories below.
        </p>

        {/* SEARCH BAR SHORTCUT */}
        <form onSubmit={handleSearch} className="mt-6 flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-2 shadow-lg backdrop-blur-md">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands or electronics..."
              className="w-full rounded-xl bg-transparent py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-500 transition"
          >
            Search
          </button>
        </form>

        {/* POPULAR CATEGORY CHIPS */}
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
            Popular Categories
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {STORE_CATEGORIES.slice(0, 6).map((cat) => {
              const IconComp = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  to={`/shop?category=${encodeURIComponent(cat.name)}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-blue-500/50 hover:bg-slate-800 hover:text-white transition"
                >
                  <IconComp size={14} className="text-blue-400" />
                  <span>{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* DYNAMIC ROLE-BASED QUICK ACTION BUTTONS */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft size={17} />
            <span>Go Back</span>
          </button>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500"
          >
            <Home size={17} />
            <span>Back to Home</span>
          </Link>

          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <ShoppingBag size={17} className="text-emerald-400" />
            <span>Browse All Products</span>
          </Link>

          {role === "admin" && (
            <Link
              to="/admin"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <LayoutDashboard size={17} className="text-blue-400" />
              <span>Admin Dashboard</span>
            </Link>
          )}

          {role === "delivery" && (
            <Link
              to="/delivery"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <Truck size={17} className="text-emerald-400" />
              <span>Delivery Portal</span>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
};

export default NotFound;
