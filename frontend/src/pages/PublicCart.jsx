import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BackToTop from "../components/BackToTop.jsx";
import Cart from "./Client/Cart.jsx";
import ClientLayout from "../components/client/ClientLayout.jsx";
import { ShoppingBag, ArrowRight, LogIn, ShieldCheck, Truck } from "lucide-react";
import { getValidCart, getProductQuantity } from "../utils/cartUtils.js";
import { STORE_CLAIMS } from "../config/constants.js";

const PublicCart = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isLoggedIn = Boolean(token);

  const [guestCartIds, setGuestCartIds] = useState([]);

  useEffect(() => {
    const update = () => {
      setGuestCartIds(getValidCart());
    };
    update();
    window.addEventListener("cartUpdated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("cartUpdated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  // If user is logged in, show the full client cart
  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <Cart />
        </main>
        <Footer />
        <BackToTop />
      </div>
    );
  }

  // If signed out, render a customer-facing Guest Cart
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition"
          >
            &larr; Continue Shopping
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
            <ShoppingBag size={36} />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
              {guestCartIds.length > 0 ? "You have items in your cart" : "Your cart is currently empty"}
            </h1>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              {guestCartIds.length > 0
                ? `You have ${guestCartIds.length} item(s) ready in your cart. Sign in to your account to review saved addresses, apply coupons, and checkout securely.`
                : "Explore our collection of premium smartphones, audio gear, and laptops to add products to your cart."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {guestCartIds.length > 0 ? (
              <>
                <Link
                  to="/login?redirect=/cart"
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-7 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition active:scale-95"
                >
                  <LogIn size={18} />
                  <span>Sign In to Checkout</span>
                </Link>
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <span>Add More Items</span>
                </Link>
              </>
            ) : (
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-7 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition active:scale-95"
              >
                <span>Browse Catalog</span>
                <ArrowRight size={18} />
              </Link>
            )}
          </div>

          {/* TRUST PERKS */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-6 text-left">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <Truck size={20} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">{STORE_CLAIMS.FREE_SHIPPING_TEXT}</p>
                <p className="text-[11px] text-slate-500">Fast doorstep transit across India</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <ShieldCheck size={20} className="text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">{STORE_CLAIMS.RETURN_POLICY_CLAIM}</p>
                <p className="text-[11px] text-slate-500">100% genuine brand warranty</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default PublicCart;
