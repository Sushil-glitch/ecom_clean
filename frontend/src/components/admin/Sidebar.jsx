import {
  LayoutDashboard,
  Users,
  BarChart3,
  Trash2,
  Settings,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  Package,
  CreditCard,
  X,
  Home,
  Truck,
  Ticket,
} from "lucide-react";
import { NavLink, Link, useNavigate } from "react-router-dom";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const navItems = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Orders",
      path: "/admin/orders",
      icon: Package,
    },
    {
      name: "Delivery Boys",
      path: "/admin/delivery",
      icon: Truck,
    },
    {
      name: "Products",
      path: "/admin/products",
      icon: ShoppingBag,
    },
    {
      name: "Coupons",
      path: "/admin/coupons",
      icon: Ticket,
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: Users,
    },
    {
      name: "Payments",
      path: "/admin/payments",
      icon: CreditCard,
    },
    {
      name: "Analytics",
      path: "/admin/analytics",
      icon: BarChart3,
    },
    {
      name: "Bin",
      path: "/admin/bin",
      icon: Trash2,
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: Settings,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  const getInitial = () => {
    return user?.name?.charAt(0)?.toUpperCase() || "A";
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

      {/* Sidebar */}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          flex
          h-screen
          w-64
          flex-col
          border-r
          border-slate-200
          bg-white
          shadow-sm
          transition-transform
          duration-300
          ease-in-out

          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* =========================
            LOGO
        ========================== */}

        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">

          <Link to="/" className="group flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition group-hover:bg-blue-700">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h1 className="text-sm font-bold text-slate-900 transition group-hover:text-blue-600">
                Admin Panel
              </h1>

              <p className="text-xs text-slate-400">
                Management System
              </p>
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


        {/* =========================
            NAVIGATION
        ========================== */}

        <nav className="flex-1 overflow-y-auto px-3 py-6">

          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          <div className="space-y-1">

            {navItems.map((item) => {

              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin"}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    py-3
                    text-sm
                    font-medium
                    transition-all

                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }
                    `
                  }
                >
                  <Icon size={19} />

                  <span>{item.name}</span>
                </NavLink>
              );
            })}

          </div>

        </nav>


        {/* =========================
            ADMIN PROFILE
        ========================== */}

        <div className="border-t border-slate-200 p-4">

          <div className="mb-4 flex items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
              {getInitial()}
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


          {/* Logout */}

          <button
            type="button"
            onClick={handleLogout}
            className="
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-3
              py-2.5
              text-sm
              font-medium
              text-slate-600
              transition
              hover:bg-red-50
              hover:text-red-600
            "
          >
            <LogOut size={18} />

            <span>Logout</span>
          </button>

        </div>

      </aside>
    </>
  );
};

export default Sidebar;


