import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Menu,
  LogOut,
  UserCircle,
  Truck,
  LayoutDashboard,
  Settings,
  Sun,
  Moon,
} from "lucide-react";

import DeliverySidebar from "./DeliverySidebar";
import BackToTop from "../BackToTop.jsx";
import NotificationBell from "../NotificationBell.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

const DeliveryLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  };

  const [user, setUser] = useState(getUser());

  useEffect(() => {
    const handleUserUpdate = () => {
      setUser(getUser());
    };
    window.addEventListener("userUpdated", handleUserUpdate);
    window.addEventListener("storage", handleUserUpdate);
    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate);
      window.removeEventListener("storage", handleUserUpdate);
    };
  }, []);

  const pageInfo = useMemo(() => {
    const path = location.pathname;

    if (path === "/delivery") {
      return {
        title: "Delivery Dashboard",
        description: "Overview of your assigned orders and delivery statistics.",
      };
    }

    if (path.startsWith("/delivery/orders")) {
      return {
        title: "My Deliveries",
        description: "Manage order pickups and active deliveries.",
      };
    }

    if (path.startsWith("/delivery/profile")) {
      return {
        title: "Driver Profile",
        description: "View and update your personal information.",
      };
    }

    if (path.startsWith("/delivery/settings")) {
      return {
        title: "Account Settings",
        description: "Manage security and password settings.",
      };
    }

    return {
      title: "Delivery Partner",
      description: "Delivery Management Portal",
    };
  }, [location.pathname]);

  const userInitial = useMemo(() => {
    return user?.name?.trim()?.charAt(0)?.toUpperCase() || "D";
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userUpdated"));

    navigate("/login", { replace: true });
  };

  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-50">
      {/* SIDEBAR */}
      <DeliverySidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* MAIN CONTENT AREA */}
      <div className="min-h-screen max-w-full overflow-x-hidden lg:ml-64">
        {/* TOPBAR */}
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white shadow-xs">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* LEFT */}
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu size={19} />
              </button>

              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                  {pageInfo.title}
                </h1>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-amber-500"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
              </button>

              <NotificationBell role="delivery" />

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              {/* PROFILE DROPDOWN */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 transition hover:bg-slate-50"
                  aria-expanded={profileOpen}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-xs">
                    {userInitial}
                  </div>

                  <div className="hidden text-left md:block">
                    <p className="max-w-[140px] truncate text-sm font-semibold text-slate-800">
                      {user?.name || "Delivery Boy"}
                    </p>
                    <p className="text-xs text-slate-400">Driver Partner</p>
                  </div>

                  <ChevronDown
                    size={16}
                    className={`hidden text-slate-400 transition-transform md:block ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {profileOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-30 bg-transparent cursor-default"
                      onClick={() => setProfileOpen(false)}
                    />

                    <div className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                      <div className="border-b border-slate-100 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                            {userInitial}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {user?.name || "Delivery Boy"}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                              {user?.email || "Driver Partner"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-2 space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/delivery");
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          <LayoutDashboard size={18} className="text-blue-600" />
                          <span>Dashboard</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/delivery/orders");
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          <Truck size={18} className="text-indigo-600" />
                          <span>My Deliveries</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/delivery/profile");
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          <UserCircle size={18} />
                          <span>My Profile</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/delivery/settings");
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          <Settings size={18} />
                          <span>Settings</span>
                        </button>

                        <div className="my-1 border-t border-slate-100" />

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          <LogOut size={18} />
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

export default DeliveryLayout;
