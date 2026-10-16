import React, { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BackToTop from "../components/BackToTop.jsx";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-100">
            <MessageSquare size={14} /> 24/7 Live Priority Support
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CONTACT INFO SIDEBAR */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Get in Touch
                </h2>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Have questions about an order or product? Our support team is here to assist you.
                </p>
              </div>

              <div className="space-y-4 text-xs font-medium">
                {/* PHONE */}
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Phone & WhatsApp</p>
                    <a
                      href="tel:+919353796157"
                      className="text-blue-600 font-semibold hover:underline block mt-0.5"
                    >
                      +91 9353796157
                    </a>
                  </div>
                </div>

                {/* EMAIL */}
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Customer Support Email</p>
                    <a
                      href="mailto:support@electrozone.com"
                      className="text-emerald-600 font-semibold hover:underline block mt-0.5"
                    >
                      support@electrozone.com
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
                    <p className="text-slate-600 mt-0.5">Koramangala, Bengaluru, Karnataka 560034</p>
                  </div>
                </div>

                {/* HOURS */}
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Working Hours</p>
                    <p className="text-slate-600 mt-0.5">Monday - Saturday: 9:00 AM - 8:00 PM</p>
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
                <p className="mt-1 text-sm text-slate-500">
                  Fill out the form below and our team will get back to you within 24 hours.
                </p>
              </div>

              {submitted ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-center space-y-2 animate-in zoom-in-95">
                  <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
                  <h3 className="text-base font-bold text-emerald-900">Message Sent Successfully!</h3>
                  <p className="text-xs text-emerald-700">Thank you for reaching out to ElectroZone support. We will reply shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Your Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Inquiry about Order #1234..."
                      className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Message</label>
                    <textarea
                      rows={5}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Type your message details here..."
                      className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 resize-none"
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
