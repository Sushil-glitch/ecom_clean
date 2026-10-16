import React, { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BackToTop from "../components/BackToTop.jsx";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, ArrowLeft, CheckCircle2, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { STORE_CLAIMS } from "../config/constants.js";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    website: "", // Honeypot field
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Bot honeypot check
    if (formData.website) {
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "", website: "" });
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
            <MessageSquare size={14} /> Priority Support ({STORE_CLAIMS.SUPPORT_HOURS})
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CONTACT INFO SIDEBAR */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Get in Touch
                </h1>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Have questions about an order or product? Our support team is here to assist you during business hours.
                </p>
              </div>

              <div className="space-y-4 text-xs font-medium">
                {/* PHONE */}
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Phone Support</p>
                    <a
                      href={`tel:${STORE_CLAIMS.PHONE.replace(/\s+/g, "")}`}
                      className="text-blue-600 font-semibold hover:underline block mt-0.5"
                    >
                      {STORE_CLAIMS.PHONE}
                    </a>
                  </div>
                </div>

                {/* WHATSAPP */}
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">WhatsApp Chat</p>
                    <a
                      href={STORE_CLAIMS.WHATSAPP_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 font-semibold hover:underline block mt-0.5"
                    >
                      Chat on WhatsApp &rarr;
                    </a>
                  </div>
                </div>

                {/* EMAIL */}
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Customer Support Email</p>
                    <a
                      href={`mailto:${STORE_CLAIMS.EMAIL}`}
                      className="text-indigo-600 font-semibold hover:underline block mt-0.5"
                    >
                      {STORE_CLAIMS.EMAIL}
                    </a>
                  </div>
                </div>

                {/* LOCATION */}
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Store Headquarters</p>
                    <p className="text-slate-600 mt-0.5">{STORE_CLAIMS.ADDRESS}</p>
                  </div>
                </div>

                {/* HOURS */}
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Operating Hours</p>
                    <p className="text-slate-600 mt-0.5">{STORE_CLAIMS.SUPPORT_HOURS}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CONTACT FORM */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Send Us a Message
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Fill out the form below and our team will get back to you within 24 business hours.
                </p>
              </div>

              {/* Status area with aria-live */}
              <div aria-live="polite">
                {submitted && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-6 text-center space-y-2 animate-in zoom-in-95">
                    <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
                    <h3 className="text-base font-bold text-emerald-900">Message Sent Successfully!</h3>
                    <p className="text-xs text-emerald-800">
                      Thank you for contacting ElectroZone. A confirmation ticket has been created and our team will reply shortly.
                    </p>
                  </div>
                )}
              </div>

              {!submitted && (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
                  {/* Honeypot field (hidden from real users) */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input
                      type="text"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      tabIndex="-1"
                      autoComplete="off"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-name" className="block font-bold text-slate-700 mb-1">
                        Your Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="contact-name"
                        name="name"
                        required
                        autoComplete="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block font-bold text-slate-700 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="contact-email"
                        name="email"
                        required
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-phone" className="block font-bold text-slate-700 mb-1">
                        Mobile Number (Optional)
                      </label>
                      <input
                        type="tel"
                        id="contact-phone"
                        name="phone"
                        autoComplete="tel"
                        pattern="^[6-9]\d{9}$"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="9876543210"
                        className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-subject" className="block font-bold text-slate-700 mb-1">
                        Subject <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="contact-subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Inquiry about Order #1234..."
                        className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block font-bold text-slate-700 mb-1">
                      Message <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Type your message details here..."
                      className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 resize-none transition"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-blue-700 transition"
                  >
                    <Send size={16} /> Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Contact;
