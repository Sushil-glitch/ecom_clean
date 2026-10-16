import {
  LayoutDashboard,
  Truck,
  Clock,
  Navigation,
  CheckCircle2,
  Wallet,
  UserCircle,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";

const DeliverySidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const navItems = [
    {
      name: "Dashboard",
      path: "/delivery",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "My Wallet & Payouts",
      path: "/delivery/wallet",
      icon: Wallet,
    },
    {
      name: "My Deliveries",
      path: "/delivery/orders",
      icon: Truck,
      exact: true,
    },
    {
      name: "Pending Deliveries",
      path: "/delivery/orders?status=Assigned",
      icon: Clock,
      search: "?status=Assigned",
    },
    {
      name: "Out for Delivery",
      path: "/delivery/orders?status=Out for Delivery",
      icon: Navigation,
      search: "?status=Out for Delivery",
    },
    {
      name: "Completed",
      path: "/delivery/orders?status=Delivered",
      icon: CheckCircle2,
      search: "?status=Delivered",
    },
    {
      name: "Profile",
      path: "/delivery/profile",
      icon: UserCircle,
    },
    {
      name: "Settings",
      path: "/delivery/settings",
      icon: Settings,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userUpdated"));

    navigate("/login", { replace: true });
  };

  const getInitial = () => {
    return user?.name?.charAt(0)?.toUpperCase() || "D";
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-sm transition-transform duration-300 ease-in-out ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* LOGO */}
        <div className="flex h-20 items-center justify-between border-b border-slate-200 px-5">
          <Link to="/delivery" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition group-hover:bg-blue-700">
              <Truck size={21} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 transition group-hover:text-blue-600">
                Delivery Portal
              </h1>
              <p className="text-xs text-slate-400">Driver Partner</p>
            </div>
          </Link>

          {/* Mobile Close */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Delivery Menu
          </p>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = item.search
                ? location.pathname === "/delivery/orders" && location.search === item.search
                : item.exact
                ? location.pathname === item.path && !location.search
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-blue-50 text-blue-600 font-bold shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={19} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* USER PROFILE & LOGOUT */}
        <div className="border-t border-slate-200 p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
              {getInitial()}
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

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default DeliverySidebar;
