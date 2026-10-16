import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingBag,
  Menu,
  X,
  UserPlus,
  LogIn,
  User,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  ShoppingCart,
  Heart,
  Zap,
  Sun,
  Moon,
} from "lucide-react";
import { getCartCount } from "../utils/cartUtils.js";
import { getWishlistCount } from "../utils/wishlistUtils.js";
import NotificationBell from "./NotificationBell.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [activeSection, setActiveSection] = useState("hero");

  const dropdownRef = useRef(null);

  const token = localStorage.getItem("token");
  const isLoggedIn = Boolean(token);

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

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  };

  const [userState, setUserState] = useState(getUser());

  useEffect(() => {
    const handleUserUpdate = () => {
      setUserState(getUser());
    };
    window.addEventListener("userUpdated", handleUserUpdate);
    window.addEventListener("storage", handleUserUpdate);
    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate);
      window.removeEventListener("storage", handleUserUpdate);
    };
  }, []);

  const user = userState;
  const role = (user?.role || localStorage.getItem("role") || "").toLowerCase();
  const dashboardPath = role === "admin" ? "/admin" : role === "delivery" ? "/delivery" : "/client";
  const profilePath = role === "admin" ? "/admin/profile" : role === "delivery" ? "/delivery/profile" : "/client/profile";

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userUpdated"));
    setAccountDropdownOpen(false);
    navigate("/");
  };

  const navLinks = [
    { name: "Home", href: "/", sectionId: "hero" },
    { name: "Shop", href: "/shop", sectionId: "" },
    { name: "Categories", href: "/#categories", sectionId: "categories" },
    { name: "Featured", href: "/#featured", sectionId: "featured" },
    { name: "About", href: "/#about", sectionId: "about" },
  ];

  // ScrollSpy listener to highlight current section as user scrolls
  useEffect(() => {
    if (location.pathname !== "/") return;

    const handleScroll = () => {
      const sections = ["hero", "categories", "featured", "about"];
      const scrollPosition = window.scrollY + 140;

      for (let i = sections.length - 1; i >= 0; i--) {
        const sectionEl = document.getElementById(sections[i]);
        if (sectionEl) {
          const top = sectionEl.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const handleNavClick = (e, link) => {
    if (link.href === "/shop") {
      navigate("/shop");
      return;
    }

    if (location.pathname === "/" && link.sectionId) {
      e.preventDefault();
      const targetEl = document.getElementById(link.sectionId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth" });
        setActiveSection(link.sectionId);
      }
    } else if (link.sectionId) {
      e.preventDefault();
      navigate("/");
      setTimeout(() => {
        const targetEl = document.getElementById(link.sectionId);
        if (targetEl) targetEl.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }
  };

  const isActiveLink = (link) => {
    if (location.pathname === "/shop" && link.href === "/shop") return true;
    if (location.pathname === "/") {
      if (link.href === "/shop") return false;
      return activeSection === link.sectionId;
    }
    return false;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 transition opacity-95 hover:opacity-100"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Zap size={21} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
              Electro<span className="text-blue-600">Zone</span>
            </h1>
            <p className="hidden text-[9px] font-extrabold uppercase tracking-widest text-slate-400 sm:block mt-0.5">
              Premium Tech Hub
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links (ScrollSpy Linked) */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const active = isActiveLink(link);
            return (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link)}
                className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                  active
                    ? "font-bold text-blue-600 bg-blue-50/80 border border-blue-100 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                }`}
              >
                {link.name}
              </a>
            );
          })}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden items-center gap-2 sm:gap-3 sm:flex">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-amber-500 active:scale-[0.98]"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} className="text-slate-600" />}
          </button>

          {/* Notification Bell */}
          <NotificationBell role={role === "admin" ? "admin" : "client"} />

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={() => navigate(isLoggedIn ? "/client/wishlist" : "/login")}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-rose-600 active:scale-[0.98]"
            title="Wishlist"
          >
            <Heart size={19} className={wishlistCount > 0 ? "fill-rose-500 text-rose-500" : ""} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            type="button"
            onClick={() => navigate(isLoggedIn ? "/client/cart" : "/cart")}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-blue-600 active:scale-[0.98]"
            title="Shopping Cart"
          >
            <ShoppingCart size={19} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User size={14} />}
                </div>
                <span className="hidden md:inline">{user?.name || "My Account"}</span>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 ${
                    accountDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Account Dropdown Menu */}
              {accountDropdownOpen && (
                <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95">
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {user?.name || "User"}
                    </p>
                    <p className="truncate text-xs font-medium text-slate-400">
                      {user?.email || "Account"}
                    </p>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAccountDropdownOpen(false);
                        navigate(dashboardPath);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900"
                    >
                      <LayoutDashboard size={17} className="text-blue-600" />
                      <span>Dashboard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAccountDropdownOpen(false);
                        navigate(profilePath);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900"
                    >
                      <User size={17} />
                      <span>My Profile</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      <LogOut size={17} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-blue-600 active:scale-[0.98]"
              >
                <LogIn size={16} />
                <span>Log In</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 active:scale-[0.98]"
              >
                <UserPlus size={16} />
                <span>Register</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger & Cart Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => navigate(isLoggedIn ? "/client/cart" : "/cart")}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 sm:hidden"
            title="Shopping Cart"
          >
            <ShoppingCart size={19} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 text-slate-600 transition hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 pb-6 pt-3 shadow-lg lg:hidden animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const active = isActiveLink(link);
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleNavClick(e, link);
                  }}
                  className={`rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                    active
                      ? "font-bold text-blue-600 bg-blue-50 border border-blue-100"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {link.name}
                </a>
              );
            })}
          </nav>

          <div className="mt-4 flex flex-col gap-2 pt-4 border-t border-slate-100">
            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(dashboardPath);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
                >
                  <LayoutDashboard size={16} />
                  <span>Go to Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(profilePath);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <User size={16} />
                  <span>My Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-100"
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/login");
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <LogIn size={16} />
                  <span>Log in</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/register");
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25"
                >
                  <UserPlus size={16} />
                  <span>Get Started</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;