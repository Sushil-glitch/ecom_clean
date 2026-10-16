import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Bell,
  Heart,
  Home,
  LayoutDashboard,
  ShoppingCart,
  Sun,
  Moon,
} from "lucide-react";

import ClientSidebar from "./ClientSideBar.jsx";
import BackToTop from "../BackToTop.jsx";
import NotificationBell from "../NotificationBell.jsx";
import { getNotifications } from "../../utils/notificationUtils.js";
import { getCartCount } from "../../utils/cartUtils.js";
import { useTheme } from "../../context/ThemeContext.jsx";

const ClientLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  const updateUnreadCount = () => {
    const notifs = getNotifications();
    setUnreadCount(notifs.filter((n) => !n.read).length);
  };

  const updateCartCount = () => {
    setCartCount(getCartCount());
  };

  useEffect(() => {
    updateUnreadCount();
    updateCartCount();

    const handleUpdate = () => updateUnreadCount();
    const handleCartUpdate = () => updateCartCount();

    window.addEventListener("notificationsUpdated", handleUpdate);
    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("storage", handleCartUpdate);

    return () => {
      window.removeEventListener("notificationsUpdated", handleUpdate);
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, []);

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  };

  const user = getUser();

  const getInitial = () => {
    return user?.name?.trim()?.charAt(0)?.toUpperCase() || "C";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userUpdated"));

    navigate("/", {
      replace: true,
    });
  };

  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-50">
      {/* SIDEBAR */}
      <ClientSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* MAIN CONTENT */}
      <div className="min-h-screen max-w-full overflow-x-hidden lg:ml-64">
        {/* TOPBAR */}
        <header className="sticky top-0 z-40 h-16 border-b border-slate-200/80 bg-white shadow-xs">
          <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* LEFT */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu size={19} />
              </button>

              <div>
                <h1 className="text-base font-bold tracking-tight text-slate-900">
                  Client Dashboard
                </h1>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Actions */}
              <div className="flex items-center gap-1 border-r border-slate-200/80 pr-2 sm:pr-3">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
                  title="Store Home"
                >
                  <Home size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/client/cart")}
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
                  title="Shopping Cart"
                >
                  <ShoppingCart size={18} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/client/wishlist")}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-rose-500"
                  title="Wishlist"
                >
                  <Heart size={18} />
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-amber-500"
                  title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
                </button>

                <NotificationBell role="client" />
              </div>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-slate-100/80"
                  aria-expanded={profileOpen}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-500/20">
                    {getInitial()}
                  </div>

                  <span className="hidden max-w-[120px] truncate text-sm font-semibold text-slate-800 md:inline-block">
                    {user?.name || "Client"}
                  </span>

                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {profileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30 bg-transparent cursor-default"
                      onClick={() => setProfileOpen(false)}
                    />

                    <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95">
                      <div className="border-b border-slate-100 px-3 py-2.5">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {user?.name || "Client"}
                        </p>
                        <p className="truncate text-xs font-medium text-slate-400">
                          {user?.email || "Client Account"}
                        </p>
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/client");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900"
                        >
                          <LayoutDashboard size={17} className="text-blue-600" />
                          <span>Client Dashboard</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/client/profile");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900"
                        >
                          <User size={17} />
                          <span>My Profile</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/client/settings");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900"
                        >
                          <Settings size={17} />
                          <span>Settings</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                        >
                          <LogOut size={17} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      <BackToTop />
    </div>
  );
};

export default ClientLayout;
