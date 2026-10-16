import React from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BackToTop from "../components/BackToTop.jsx";
import { Link } from "react-router-dom";
import { ArrowLeft, Truck, Clock, ShieldCheck, MapPin } from "lucide-react";
import { STORE_CLAIMS } from "../config/constants.js";

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-8">
          <div className="border-b border-slate-100 pb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
              <Truck size={14} /> Shipping Information
            </span>
            <h1 className="mt-3 text-3xl font-black text-slate-900 tracking-tight">
              Shipping & Delivery Policy
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Last updated: October 16, 2026 · Express doorstep delivery across India
            </p>
          </div>

          <section className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Truck size={20} className="text-blue-600" />
              1. Delivery Timelines & Charges
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Free Delivery</span>
                <h3 className="text-lg font-black text-emerald-950 mt-1">Orders above ₹{STORE_CLAIMS.FREE_SHIPPING_THRESHOLD}</h3>
                <p className="text-xs text-slate-600 mt-2">
                  Enjoy completely free express shipping on all orders with a cart total of ₹{STORE_CLAIMS.FREE_SHIPPING_THRESHOLD} or higher.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Standard Delivery</span>
                <h3 className="text-lg font-black text-slate-900 mt-1">₹49 on smaller orders</h3>
                <p className="text-xs text-slate-600 mt-2">
                  Orders below ₹{STORE_CLAIMS.FREE_SHIPPING_THRESHOLD} carry a nominal flat shipping fee of ₹49.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              2. Estimated Transit Times
            </h2>
            <p>
              Orders placed before 2:00 PM IST on business days are dispatched the same day from our primary fulfillment hubs.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li><strong>Metro Cities (Bengaluru, Delhi NCR, Mumbai, Hyderabad, Chennai, Kolkata):</strong> 1–2 business days.</li>
              <li><strong>Tier 2 & Tier 3 Cities:</strong> 2–4 business days.</li>
              <li><strong>Special regions & Northeast India:</strong> 4–6 business days.</li>
            </ul>
          </section>

          <section className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin size={20} className="text-blue-600" />
              3. Live Tracking & Secure Delivery
            </h2>
            <p>
              Once your shipment is handed over to our logistics partners or delivery fleet, you will receive an SMS and email notification with an end-to-end tracking link. You can also monitor your delivery status live on your account's <strong>Orders</strong> page.
            </p>
            <p>
              High-value electronics require an OTP verification at the time of delivery to ensure your package is received by you safely.
            </p>
          </section>

          {/* SELLER & WAREHOUSE DETAILS */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-3">
            <h3 className="text-base font-bold text-slate-900">Seller & Dispatch Facility Details</h3>
            <div className="text-xs text-slate-600 space-y-1 font-medium">
              <p><strong>Operating Entity:</strong> {STORE_CLAIMS.SELLER_LEGAL_NAME}</p>
              <p><strong>Fulfillment Center:</strong> {STORE_CLAIMS.SELLER_ADDRESS}</p>
              <p><strong>GSTIN:</strong> {STORE_CLAIMS.SELLER_GSTIN}</p>
              <p><strong>Grievance & Dispatch Support:</strong> <a href={`mailto:${STORE_CLAIMS.GRIEVANCE_OFFICER_EMAIL}`} className="text-blue-600 underline">{STORE_CLAIMS.GRIEVANCE_OFFICER_EMAIL}</a></p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default ShippingPolicy;
