import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  X,
  Heart,
  Package,
  ShoppingBag,
  ShoppingCart,
  Home,
  MapPin,
} from "lucide-react";

import { NavLink, Link, useNavigate } from "react-router-dom";
import { getCartCount } from "../../utils/cartUtils.js";

import { getWishlistCount } from "../../utils/wishlistUtils.js";
import { PAYMENT_API_URL } from "../../config/api.js";
import axios from "axios";

const ClientSidebar = ({
  sidebarOpen,
  setSidebarOpen,
}) => {
  const navigate = useNavigate();

  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const updateCounts = () => {
    setCartCount(getCartCount());
    setWishlistCount(getWishlistCount());
  };

  useEffect(() => {
    updateCounts();
    window.addEventListener("cartUpdated", updateCounts);
    window.addEventListener("wishlistUpdated", updateCounts);
    window.addEventListener("storage", updateCounts);
    return () => {
      window.removeEventListener("cartUpdated", updateCounts);
      window.removeEventListener("wishlistUpdated", updateCounts);
      window.removeEventListener("storage", updateCounts);
    };
  }, []);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  // =====================================================
  // MAIN NAVIGATION
  // =====================================================

  const mainNavigation = [
    {
      name: "Store Home",
      path: "/",
      icon: Home,
    },
    {
      name: "Dashboard",
      path: "/client",
      icon: LayoutDashboard,
    },
    {
      name: "Shop",
      path: "/client/shop",
      icon: ShoppingBag,
    },
    {
      name: "Cart",
      path: "/client/cart",
      icon: ShoppingCart,
    },
    {
      name: "Wishlist",
      path: "/client/wishlist",
      icon: Heart,
    },
    {
      name: "My Orders",
      path: "/client/orders",
      icon: Package,
    },
  ];

  // =====================================================
  // ACCOUNT NAVIGATION
  // =====================================================

  const accountNavigation = [
    {
      name: "Profile",
      path: "/client/profile",
      icon: User,
    },
    {
      name: "Addresses",
      path: "/client/addresses",
      icon: MapPin,
    },
    {
      name: "Settings",
      path: "/client/settings",
      icon: Settings,
    },
  ];

  // =====================================================
  // NAVIGATION ITEM
  // =====================================================

  const renderNavigationItem = (item) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.path === "/client"}
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
          transition
          duration-200
          ${isActive
            ? "bg-blue-50 text-blue-600 font-bold"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }
          `
        }
      >
        <Icon size={19} />

        <span className="flex-1">{item.name}</span>

        {item.name === "Cart" && cartCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white shadow-sm">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}

        {item.name === "Wishlist" && wishlistCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white shadow-sm">
            {wishlistCount > 99 ? "99+" : wishlistCount}
          </span>
        )}
      </NavLink>
    );
  };

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <>
      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          flex
          w-64
          flex-col
          border-r
          border-slate-200
          bg-white
          transition-transform
          duration-300
          lg:translate-x-0
          ${sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
          }
        `}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex h-20 items-center justify-between border-b border-slate-200 px-6">

          <Link to="/" className="group flex flex-col">
            <h1 className="text-lg font-bold text-slate-900 transition group-hover:text-blue-600">
              Client Portal
            </h1>

            <p className="text-xs text-slate-400">
              Management System
            </p>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>

        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="flex-1 overflow-y-auto px-4 py-6">

          {/* MAIN MENU */}

          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Menu
          </p>

          <div className="space-y-1">
            {mainNavigation.map(renderNavigationItem)}
          </div>

          {/* ACCOUNT */}

          <p className="mb-3 mt-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Account
          </p>

          <div className="space-y-1">
            {accountNavigation.map(renderNavigationItem)}
          </div>

        </nav>

        {/* =================================================
            BOTTOM / LOGOUT
        ================================================= */}

        <div className="border-t border-slate-200 p-4">

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={19} />

            <span>Logout</span>
          </button>

        </div>

      </aside>
    </>
  );
};

export default ClientSidebar;