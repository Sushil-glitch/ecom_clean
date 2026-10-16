import { Printer, X, Download, ShieldCheck, Store, MapPin, Phone, Mail, FileText } from "lucide-react";

const OrderInvoiceModal = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const orderId = order._id || order.id || "N/A";
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const orderTime = new Date(order.createdAt || Date.now()).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => {
    window.print();
  };

  const shippingInfo = order.shippingInfo || order.address || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.subtotal || order.totalAmount || order.total || 0);
  const discountAmount = Number(order.discountAmount || order.discount || 0);
  const shippingFee = Number(order.shippingFee || 0);
  const codCharge = Number(order.codCharge || 0);
  const grandTotal = Number(order.totalAmount || order.total || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      {/* PRINT MEDIA STYLES */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-tax-invoice, #printable-tax-invoice * {
            visibility: visible;
          }
          #printable-tax-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        id="printable-tax-invoice"
        className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl transition-all animate-in zoom-in-95 border border-slate-100 my-8"
      >
        {/* HEADER BAR (NO PRINT) */}
        <div className="no-print flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Tax Invoice & Billing Receipt</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition active:scale-95"
            >
              <Printer size={15} />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* INVOICE CONTENT */}
        <div className="space-y-6 text-slate-800">
          {/* STORE BRANDING & INVOICE META */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black">
                  EZ
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Electro<span className="text-blue-600">Zone</span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">ElectroZone Tech & Retail Solutions Pvt. Ltd.</p>
              <p className="text-xs text-slate-500">GSTIN: 29AAAAA0000A1Z5 | Koramangala, Bengaluru</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800 uppercase tracking-wider mb-2">
                TAX INVOICE
              </span>
              <p className="text-xs text-slate-500 font-medium">Invoice No: <strong className="text-slate-900">INV-{orderId.slice(-8).toUpperCase()}</strong></p>
              <p className="text-xs text-slate-500 font-medium">Payment Mode: <strong className="text-slate-900">{order.paymentMethod === "Razorpay" ? "Razorpay Online" : (order.paymentMethod || "COD")}</strong></p>
              {order.paymentDetails?.razorpayPaymentId && (
                <p className="text-[11px] text-slate-500 font-medium">Txn Ref: <strong className="text-slate-900 font-mono">{order.paymentDetails.razorpayPaymentId}</strong></p>
              )}
            </div>
          </div>

          {/* BILL TO & SHIP TO ADDRESS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs">
            <div>
              <p className="font-extrabold uppercase text-slate-400 tracking-wider text-[10px] mb-1">Billed & Delivered To:</p>
              <p className="font-bold text-slate-900 text-sm">{shippingInfo.fullName || shippingInfo.name || order.user?.name || "Customer"}</p>
              <p className="text-slate-600 mt-1">{shippingInfo.addressLine || shippingInfo.street || "Delivery Address"}</p>
              <p className="text-slate-600">{shippingInfo.city}, {shippingInfo.state} - {shippingInfo.pincode}</p>
              <p className="text-slate-600 mt-1 font-semibold">Phone: {shippingInfo.phone || shippingInfo.contact || order.user?.contact || "N/A"}</p>
            </div>

            <div>
              <p className="font-extrabold uppercase text-slate-400 tracking-wider text-[10px] mb-1">Order Summary Info:</p>
              <p className="text-slate-600">Order ID: <strong className="text-slate-900">{orderId}</strong></p>
              <p className="text-slate-600">Fulfillment Status: <strong className="text-slate-900">{order.orderStatus || "Confirmed"}</strong></p>
              <p className="text-slate-600">Payment Status: <strong className="text-slate-900">{order.paymentStatus || "Paid"}</strong></p>
            </div>
          </div>

          {/* ITEMIZED PRODUCTS TABLE */}
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-bold uppercase text-slate-600 text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {items.length > 0 ? (
                  items.map((item, idx) => {
                    const price = Number(item.price || 0);
                    const qty = Number(item.qty || item.quantity || 1);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900">{item.name}</td>
                        <td className="p-3 text-center font-semibold">{qty}</td>
                        <td className="p-3 text-right font-medium">₹{price.toLocaleString("en-IN")}</td>
                        <td className="p-3 text-right font-bold text-slate-900">₹{(price * qty).toLocaleString("en-IN")}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400 font-medium">Order items summary</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TOTALS & TAX BREAKDOWN */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-t border-slate-200 pt-4">
            <div className="text-xs text-slate-500 max-w-xs space-y-1">
              <p className="font-bold text-slate-800">Terms & Conditions:</p>
              <p>• Goods once sold are covered under 7-day return policy.</p>
              <p>• This is a computer generated tax invoice and requires no signature.</p>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
              {shippingFee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Shipping Fee</span>
                  <span>+₹{shippingFee}</span>
                </div>
              )}
              {codCharge > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>COD Charge</span>
                  <span>+₹{codCharge}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Grand Total Paid</span>
                <span className="text-blue-600 text-base">₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400 font-semibold">
            Thank you for shopping with ElectroZone! Support: support@electrozone.com | +91 9353796157
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderInvoiceModal;
