import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Zap,
  ShieldCheck,
  Truck,
  Headphones,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Lock,
} from "lucide-react";
import { PRODUCT_API_URL } from "../config/api.js";

const FacebookIcon = (props) => (
  <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4" {...props}>
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
  </svg>
);

const InstagramIcon = (props) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="w-4 h-4" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TwitterIcon = (props) => (
  <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = (props) => (
  <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4" {...props}>
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.74a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z" />
  </svg>
);

const Footer = () => {
  const [categoriesList, setCategoriesList] = useState([
    { name: "Electronics", query: "Electronics" },
    { name: "Smart Gadgets", query: "Gadgets" },
    { name: "Books & Literature", query: "Books" },
    { name: "Computer Accessories", query: "Computer Accessories" },
  ]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axios.get(`${PRODUCT_API_URL}/categories`);
        if (res.data?.success && Array.isArray(res.data.categories)) {
          setCategoriesList(res.data.categories.map((c) => ({ name: c.name, query: c.name })));
          return;
        }
        const prodRes = await axios.get(PRODUCT_API_URL);
        const products = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.products || [];
        if (products.length > 0) {
          const uniqueCats = [...new Set(products.map((p) => p.category).filter(Boolean))];
          if (uniqueCats.length > 0) {
            setCategoriesList(uniqueCats.map((cat) => ({ name: cat, query: cat })));
          }
        }
      } catch (err) {
        // Fallback to defaults
      }
    };
    loadCategories();
  }, []);

  const getUserRole = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return (user?.role || localStorage.getItem("role") || "").toLowerCase();
    } catch {
      return "";
    }
  };

  const role = getUserRole();

  const handleFooterLinkClick = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
      {/* Top Banner Features */}
      <div className="border-b border-slate-900 bg-slate-900/50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4 transition hover:border-slate-700">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-500">
                <Truck size={22} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Fast Express Shipping</h4>
                <p className="text-xs text-slate-500">Free delivery on orders over ₹999</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4 transition hover:border-slate-700">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-500">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">100% Safe Payments</h4>
                <p className="text-xs text-slate-500">UPI, Cards, COD & NetBanking</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4 transition hover:border-slate-700">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-600/10 text-amber-500">
                <Lock size={22} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Buyer Protection</h4>
                <p className="text-xs text-slate-500">7-Day Easy Return Policy</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4 transition hover:border-slate-700">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600/10 text-purple-500">
                <Headphones size={22} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Priority Support Desk</h4>
                <p className="text-xs text-slate-500">Mon–Sat, 9:00 AM – 8:00 PM IST</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" onClick={handleFooterLinkClick} className="inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/25">
                <Zap size={21} className="text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                Electro<span className="text-blue-500">Zone</span>
              </span>
            </Link>

            <p className="max-w-sm text-sm leading-relaxed text-slate-400">
              Your ultimate hub for cutting-edge electronics, smart gadgets, books, and daily tech accessories. High quality, best prices, guaranteed.
            </p>

            {/* Social Media Links */}
            <div className="pt-2 flex items-center gap-3">
              <a
                href="https://facebook.com/electrozone"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-blue-500/50 hover:bg-blue-600 hover:text-white"
                aria-label="Follow ElectroZone on Facebook"
              >
                <FacebookIcon />
              </a>
              <a
                href="https://instagram.com/electrozone"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-pink-500/50 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 hover:text-white"
                aria-label="Follow ElectroZone on Instagram"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://x.com/electrozone"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-sky-500/50 hover:bg-sky-500 hover:text-white"
                aria-label="Follow ElectroZone on X (formerly Twitter)"
              >
                <TwitterIcon />
              </a>
              <a
                href="https://linkedin.com/company/electrozone"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-blue-600/50 hover:bg-blue-700 hover:text-white"
                aria-label="Connect with ElectroZone on LinkedIn"
              >
                <LinkedinIcon />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Shop Categories</h3>
            <ul className="mt-4 space-y-2.5 text-sm font-medium">
              {categoriesList.map((cat, idx) => (
                <li key={cat.query || idx}>
                  <Link
                    to={`/shop?category=${encodeURIComponent(cat.query)}`}
                    onClick={handleFooterLinkClick}
                    className="transition hover:text-blue-400"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/shop" onClick={handleFooterLinkClick} className="inline-flex items-center gap-1 text-blue-500 hover:underline">
                  Browse All <ArrowRight size={13} />
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer / Account Area (Role-Aware) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {role === "admin" ? "Admin Controls" : role === "delivery" ? "Driver Fleet" : "Customer Area"}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm font-medium">
              {role === "admin" ? (
                <>
                  <li>
                    <Link to="/admin" onClick={handleFooterLinkClick} className="transition hover:text-blue-400">Admin Dashboard</Link>
                  </li>
                  <li>
                    <Link to="/admin/payments" onClick={handleFooterLinkClick} className="transition hover:text-blue-400">Orders & Sales</Link>
                  </li>
                  <li>
                    <Link to="/admin/products" onClick={handleFooterLinkClick} className="transition hover:text-blue-400">Inventory Catalog</Link>
                  </li>
                  <li>
                    <Link to="/admin/users" onClick={handleFooterLinkClick} className="transition hover:text-blue-400">User Accounts</Link>
                  </li>
                  <li>
                    <Link to="/admin/settings" onClick={handleFooterLinkClick} className="transition hover:text-blue-400">System Settings</Link>
                  </li>
                </>
              ) : role === "delivery" ? (
                <>
                  <li>
                    <Link to="/delivery" onClick={handleFooterLinkClick} className="transition hover:text-blue-400">Rider Dashboard</Link>
                  </li>
                  <li>
                    <Link to="/delivery/orders" onClick={handleFooterLinkClick} className="transition hover:text-blue-400">Active Deliveries</Link>
                  </li>
                  <li>
                    <Link to="/delivery/profile" onClick={handleFooterLinkClick} className="transition hover:text-blue-400">Driver Profile</Link>
                  </li>
                  <li>
                    <Link to="/delivery/settings" onClick={handleFooterLinkClick} className="transition hover:text-blue-400">Account Settings</Link>
                  </li>
                </>
              ) : role === "client" ? (
                <>
                  <li>
                    <Link to="/client/orders" onClick={handleFooterLinkClick} className="transition hover:text-blue-400">My Orders</Link>
                  </li>
                  <li>
                    <Link to="/client/wishlist" onClick={handleFooterLinkClick} className="transition hover:text-blue-400">Wishlist</Link>
                  </li>
                  <li>
                    <Link to="/client/cart" onClick={handleFooterLinkClick} className="transition hover:text-blue-400">Shopping Cart</Link>
                  </li>
                  <li>
                    <Link to="/client/addresses" onClick={handleFooterLinkClick} className="transition hover:text-blue-400">Saved Addresses</Link>
                  </li>
                  <li>
                    <Link to="/client/settings" onClick={handleFooterLinkClick} className="transition hover:text-blue-400">Account Settings</Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login" onClick={handleFooterLinkClick} className="transition hover:text-blue-400">My Orders</Link>
                  </li>
                  <li>
                    <Link to="/login" onClick={handleFooterLinkClick} className="transition hover:text-blue-400">Wishlist</Link>
                  </li>
                  <li>
                    <Link to="/cart" onClick={handleFooterLinkClick} className="transition hover:text-blue-400">Shopping Cart</Link>
                  </li>
                  <li>
                    <Link to="/login" onClick={handleFooterLinkClick} className="transition hover:text-blue-400">Saved Addresses</Link>
                  </li>
                  <li>
                    <Link to="/login" onClick={handleFooterLinkClick} className="transition hover:text-blue-400">Account Login</Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Get in Touch</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <span>Koramangala, Bengaluru</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={17} className="text-blue-500 shrink-0" />
                <a href="tel:+919353796157" className="hover:text-blue-400 hover:underline transition">
                  +91 9353796157
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={17} className="text-blue-500 shrink-0" />
                <a href="mailto:support@electrozone.com" className="hover:text-blue-400 hover:underline transition">
                  support@electrozone.com
                </a>
              </li>
              <li className="pt-1">
                <Link to="/contact" onClick={handleFooterLinkClick} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:underline">
                  Contact Support Page &rarr;
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Seller Info & Legal compliance */}
        <div className="mt-12 rounded-2xl border border-slate-900 bg-slate-900/40 p-4 text-[11px] text-slate-500 space-y-1">
          <p><strong className="text-slate-400">Seller Entity:</strong> ElectroZone Retail Private Limited · Registered in Karnataka, India · <strong className="text-slate-400">GSTIN:</strong> 29AAAAA0000A1Z5</p>
          <p><strong className="text-slate-400">Fulfillment Hub:</strong> 3rd Floor, Tech Park Campus, 80 Feet Road, 4th Block, Koramangala, Bengaluru 560034 · <strong className="text-slate-400">Grievance Desk:</strong> grievance@electrozone.com</p>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-slate-900 pt-6 sm:flex-row text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ElectroZone Inc. All rights reserved.</p>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <Link to="/privacy-policy" onClick={handleFooterLinkClick} className="hover:text-slate-400 transition">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" onClick={handleFooterLinkClick} className="hover:text-slate-400 transition">
              Terms of Service
            </Link>
            <Link to="/returns" onClick={handleFooterLinkClick} className="hover:text-slate-400 transition">
              Returns & Refunds
            </Link>
            <Link to="/shipping" onClick={handleFooterLinkClick} className="hover:text-slate-400 transition">
              Shipping Policy
            </Link>
            <Link to="/cookie-preferences" onClick={handleFooterLinkClick} className="hover:text-slate-400 transition">
              Cookie Preferences
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
