import React from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BackToTop from "../components/BackToTop.jsx";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, ShieldCheck, HelpCircle, CheckCircle2 } from "lucide-react";
import { STORE_CLAIMS } from "../config/constants.js";

const ReturnsPolicy = () => {
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
              <ShieldCheck size={14} /> Official Customer Protection
            </span>
            <h1 className="mt-3 text-3xl font-black text-slate-900 tracking-tight">
              Returns, Replacement & Refund Policy
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Last updated: October 16, 2026 · Compliant with Indian Consumer Protection (E-Commerce) Rules
            </p>
          </div>

          <section className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw size={20} className="text-blue-600" />
              1. 7-Day Replacement & Return Guarantee
            </h2>
            <p>
              At ElectroZone, we want you to have complete confidence in your purchase. All brand-new electronic devices, smartphones, audio peripherals, and computer accessories purchased on our platform are backed by a <strong>7-Day Replacement Guarantee</strong> starting from the timestamp of delivery.
            </p>
            <p>
              If your item arrives physically damaged, is defective out of the box, or differs materially from the product listed on our website, you are eligible for an immediate, hassle-free replacement at zero additional charge.
            </p>
          </section>

          <section className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-xl font-bold text-slate-900">2. Eligibility Conditions for Return</h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>The product must be in its original condition with all accessories, user manuals, warranty cards, and intact manufacturer tags.</li>
              <li>The item must be returned in the original brand packaging/box with the IMEI / Serial Number matching our dispatch record.</li>
              <li>Any free gifts or promotional items bundled with the original purchase must also be returned.</li>
            </ul>
          </section>

          <section className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-xl font-bold text-slate-900">3. Refund Process & Timelines</h2>
            <p>
              When a replacement unit is unavailable in stock, or if you request a cancellation before dispatch:
            </p>
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-bold text-slate-900 text-sm">Online Payments (UPI, Cards, NetBanking)</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Refund is automatically credited back to your original payment source via Razorpay within <strong>3–5 business days</strong>.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-bold text-slate-900 text-sm">Cash on Delivery (COD)</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Refund is transferred to your verified Bank Account (IMPS/NEFT) or UPI ID within <strong>48 hours</strong> of product pickup and inspection.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-xl font-bold text-slate-900">4. Manufacturer Warranty Support</h2>
            <p>
              Beyond the 7-day initial replacement window, all devices come with a standard <strong>1-Year Manufacturer Brand Warranty</strong>. You can service your device at any authorized brand service center across India using the GST Tax Invoice provided with your ElectroZone order.
            </p>
          </section>

          {/* SELLER & GRIEVANCE CONTACT BLOCK */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-6 space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle size={18} className="text-blue-600" />
              Need Assistance with a Return?
            </h3>
            <p className="text-xs text-slate-600">
              Contact our dedicated support desk directly from your account or reach our Grievance Officer:
            </p>
            <div className="text-xs text-slate-700 space-y-1 font-medium">
              <p><strong>Legal Entity:</strong> {STORE_CLAIMS.SELLER_LEGAL_NAME}</p>
              <p><strong>Support Email:</strong> <a href={`mailto:${STORE_CLAIMS.SUPPORT_EMAIL}`} className="text-blue-600 underline">{STORE_CLAIMS.SUPPORT_EMAIL}</a></p>
              <p><strong>Support Phone:</strong> <a href={`tel:${STORE_CLAIMS.SUPPORT_PHONE}`} className="text-blue-600 underline">{STORE_CLAIMS.SUPPORT_PHONE}</a> ({STORE_CLAIMS.SUPPORT_HOURS})</p>
              <p><strong>Registered Address:</strong> {STORE_CLAIMS.SELLER_ADDRESS}</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default ReturnsPolicy;
