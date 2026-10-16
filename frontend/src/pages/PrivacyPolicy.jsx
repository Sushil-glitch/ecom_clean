import React from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BackToTop from "../components/BackToTop.jsx";
import { ShieldCheck, Lock, Eye, Mail, FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
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
            <ShieldCheck size={14} /> Last Updated: August 2026
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-8">
          {/* HEADER */}
          <div className="border-b border-slate-100 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
              <Lock size={24} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              At <strong className="text-slate-800">ElectroZone</strong>, your privacy and data security are our top priorities. This Privacy Policy details how we collect, protect, and handle your information.
            </p>
          </div>

          {/* SECTION 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Eye className="text-blue-600" size={18} /> 1. Information We Collect
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We collect essential personal information when you create an account, place an order, or contact customer support:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 pl-2">
              <li>Contact details: Name, email address, phone number, and delivery address.</li>
              <li>Order details: Purchased items, order timestamps, and transaction references.</li>
              <li>Payment details: Encrypted payment processing details (processed via secure gateway).</li>
            </ul>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="text-emerald-600" size={18} /> 2. How We Use Your Information
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Your information is strictly used to fulfill orders, provide customer support, and improve store services:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 pl-2">
              <li>Processing and delivering your tech orders.</li>
              <li>Sending live order updates and delivery notifications.</li>
              <li>Preventing fraud and maintaining platform security.</li>
            </ul>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="text-purple-600" size={18} /> 3. Data Protection & Contact
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We never sell or rent your personal data to third parties. If you have questions regarding your privacy, please email us directly:
            </p>
            <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Privacy Support Email</p>
                <a
                  href="mailto:support@electrozone.com"
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  support@electrozone.com
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default PrivacyPolicy;
