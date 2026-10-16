import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Menu,
  LogOut,
  UserCircle,
  Home,
  LayoutDashboard,
  Sun,
  Moon,
} from "lucide-react";

import Sidebar from "./Sidebar";
import BackToTop from "../BackToTop.jsx";
import NotificationBell from "../NotificationBell.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // ==============================
  // CURRENT USER
  // ==============================

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

  // ==============================
  // PAGE TITLES
  // ==============================

  const pageInfo = useMemo(() => {
    const path = location.pathname;

    if (path === "/admin") {
      return {
        title: "Admin Dashboard",
        description: "Overview of store statistics, orders, and users.",
      };
    }

    if (path.startsWith("/admin/users")) {
      return {
        title: "Users",
        description: "Manage and monitor registered users.",
      };
    }

    if (path.startsWith("/admin/analytics")) {
      return {
        title: "Analytics",
        description: "Monitor platform performance and activity.",
      };
    }

    if (path.startsWith("/admin/bin")) {
      return {
        title: "Bin",
        description: "Manage deleted user accounts.",
      };
    }

    if (path.startsWith("/admin/settings")) {
      return {
        title: "Settings",
        description: "Manage your administration preferences.",
      };
    }

    return {
      title: "Admin Panel",
      description: "Management System",
    };
  }, [location.pathname]);

  // ==============================
  // USER INITIAL
  // ==============================

  const userInitial = useMemo(() => {
    return user?.name?.trim()?.charAt(0)?.toUpperCase() || "A";
  }, [user]);

  // ==============================
  // LOGOUT
  // ==============================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userUpdated"));

    navigate("/", {
      replace: true,
    });
  };

  // ==============================
  // CLOSE MOBILE SIDEBAR
  // ==============================

  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-50">
      {/* =========================================
          SIDEBAR
      ========================================== */}

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* =========================================
          MAIN CONTENT
      ========================================== */}

      <div className="min-h-screen max-w-full overflow-x-hidden lg:ml-64">
        {/* =========================================
            TOPBAR
        ========================================== */}

        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white shadow-xs">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* LEFT SIDE */}

            <div className="flex min-w-0 items-center gap-3">
              {/* Mobile Menu */}

              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="
                  flex h-9 w-9 shrink-0 items-center justify-center
                  rounded-xl border border-slate-200
                  text-slate-600 transition
                  hover:bg-slate-50 hover:text-slate-900
                  lg:hidden
                "
                aria-label="Open navigation"
              >
                <Menu size={19} />
              </button>

              {/* Page Information */}

              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                  {pageInfo.title}
                </h1>
              </div>
            </div>

            {/* RIGHT SIDE */}

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-amber-500"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
              </button>

              <NotificationBell role="admin" />

              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
                title="Store Home"
              >
                <Home size={18} />
              </button>

              {/* Divider */}

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              {/* Profile */}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((value) => !value)}
                  className="
                    flex items-center gap-2 rounded-xl
                    px-1.5 py-1.5 transition
                    hover:bg-slate-50
                  "
                  aria-expanded={profileOpen}
                >
                  {/* Avatar */}

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {userInitial}
                  </div>

                  {/* User Info */}

                  <div className="hidden text-left md:block">
                    <p className="max-w-[140px] truncate text-sm font-semibold text-slate-800">
                      {user?.name || "Administrator"}
                    </p>

                    <p className="text-xs text-slate-400">
                      Administrator
                    </p>
                  </div>

                  <ChevronDown
                    size={16}
                    className={`hidden text-slate-400 transition-transform md:block ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Profile Dropdown */}

                {profileOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-30 bg-transparent cursor-default"
                      onClick={() => setProfileOpen(false)}
                      aria-label="Close profile menu"
                    />

                    <div
                      className="
                        absolute right-0 top-12 z-50 w-60
                        overflow-hidden rounded-2xl
                        border border-slate-200
                        bg-white shadow-xl
                      "
                    >
                      {/* Profile Header */}

                      <div className="border-b border-slate-100 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                            {userInitial}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {user?.name || "Administrator"}
                            </p>

                            <p className="truncate text-xs text-slate-400">
                              {user?.email || "Admin Account"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Profile Actions */}

                      <div className="p-2 space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/admin");
                          }}
                          className="
                            flex w-full items-center gap-3
                            rounded-xl px-3 py-2.5
                            text-sm font-medium text-slate-600
                            transition
                            hover:bg-slate-50 hover:text-slate-900
                          "
                        >
                          <LayoutDashboard size={18} className="text-blue-600" />
                          <span>Admin Dashboard</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/admin/profile");
                          }}
                          className="
                            flex w-full items-center gap-3
                            rounded-xl px-3 py-2.5
                            text-sm font-medium text-slate-600
                            transition
                            hover:bg-slate-50 hover:text-slate-900
                          "
                        >
                          <UserCircle size={18} />
                          <span>My Profile</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/");
                          }}
                          className="
                            flex w-full items-center gap-3
                            rounded-xl px-3 py-2.5
                            text-sm font-medium text-slate-600
                            transition
                            hover:bg-slate-50 hover:text-slate-900
                          "
                        >
                          <Home size={18} className="text-emerald-600" />
                          <span>Store Front</span>
                        </button>

                        <div className="my-1 border-t border-slate-100" />

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="
                            flex w-full items-center gap-3
                            rounded-xl px-3 py-2.5
                            text-sm font-medium text-red-600
                            transition
                            hover:bg-red-50
                          "
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

        {/* =========================================
            PAGE CONTENT
        ========================================== */}

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

export default AdminLayout;