import React from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BackToTop from "../components/BackToTop.jsx";
import { FileText, CheckCircle2, ShieldAlert, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-100">
            <FileText size={14} /> Effective: August 2026
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-8">
          {/* HEADER */}
          <div className="border-b border-slate-100 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-4">
              <FileText size={24} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
              Terms of Service
            </h1>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Welcome to <strong className="text-slate-800">ElectroZone</strong>. By using our website and purchasing electronics or gadgets, you agree to comply with the following Terms of Service.
            </p>
          </div>

          {/* SECTION 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="text-blue-600" size={18} /> 1. Use of Service & Account Requirements
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Users must provide accurate account information. You are responsible for safeguarding your login credentials and maintaining account security.
            </p>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="text-amber-600" size={18} /> 2. Pricing, Shipping & Cancellation
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              All listed prices are in Indian Rupees (INR) and inclusive of applicable GST taxes. ElectroZone reserves the right to modify prices or cancel orders in cases of stock unavailability or verified technical pricing errors.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 pl-2">
              <li>Free express shipping is applicable on all orders exceeding the cart threshold of <strong>₹999</strong>. For smaller orders, a flat shipping charge of ₹49 applies.</li>
              <li>Orders can be cancelled with a full refund prior to dispatch directly from <strong>your account's Orders page</strong>.</li>
              <li>Delivered items are backed by our <Link to="/returns" className="text-blue-600 underline">7-Day Replacement Policy</Link> and standard 1-year brand warranties.</li>
              <li>Read our full <Link to="/shipping" className="text-blue-600 underline">Shipping & Delivery Policy</Link> for detailed transit schedules.</li>
            </ul>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Mail className="text-emerald-600" size={18} /> 3. Store Identity & Grievance Contact
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              In accordance with the Information Technology Act 2000 and the Consumer Protection (E-Commerce) Rules 2020, our registered business and grievance details are provided below:
            </p>
            <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-2 text-xs text-slate-700">
              <p><strong>Operating Entity:</strong> ElectroZone Retail Private Limited</p>
              <p><strong>Registered Address:</strong> Koramangala, 5th Block, Bengaluru, Karnataka 560034, India</p>
              <p><strong>GSTIN:</strong> 29AAAAA0000A1Z5</p>
              <p><strong>Grievance Officer:</strong> Akash Sharma (<a href="mailto:grievance@electrozone.com" className="text-blue-600 underline">grievance@electrozone.com</a>)</p>
              <p><strong>Customer Support:</strong> <a href="mailto:support@electrozone.com" className="text-blue-600 underline">support@electrozone.com</a> | +91 9353796157 (Mon–Sat, 9 AM–8 PM IST)</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default TermsOfService;
