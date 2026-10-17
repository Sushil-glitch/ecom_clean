import { useState, useRef } from "react";
import {
  Share2,
  QrCode,
  Copy,
  Check,
  X,
  Download,
  ExternalLink,
  Send,
  MessageSquare,
  Mail,
  Sparkles,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "../utils/toast.js";

const ShareProductModal = ({ product, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("link"); // 'link' or 'qr'
  const [copied, setCopied] = useState(false);
  const qrCanvasRef = useRef(null);

  if (!isOpen || !product) return null;

  const productId = product._id || product.id || "";
  const productPrice = Number(product.price || 0).toLocaleString("en-IN");
  
  // Construct absolute URL for direct product sharing
  const shareUrl = `${window.location.origin}/shop?product=${productId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Product link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link:", err);
      toast.error("Failed to copy link.");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} for ₹${productPrice}!`,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById("product-qr-canvas");
    if (!canvas) return;

    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `product-qr-${product.name.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast.success("QR Code downloaded successfully!");
  };

  // Quick social sharing URLs
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Check out ${product.name} for ₹${productPrice}! 👇\n${shareUrl}`
  )}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Check out ${product.name} for ₹${productPrice}!`
  )}&url=${encodeURIComponent(shareUrl)}`;

  const emailUrl = `mailto:?subject=${encodeURIComponent(
    `Check out ${product.name}`
  )}&body=${encodeURIComponent(
    `Hey!\n\nI thought you might be interested in this product:\n\n${product.name} - ₹${productPrice}\n${shareUrl}`
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl transition-all animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Share2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Share Product</h3>
              <p className="text-xs text-slate-500">Share link or generate QR code</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white hover:text-slate-700 hover:shadow-xs transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* PRODUCT PREVIEW SNIPPET */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3.5 rounded-2xl bg-slate-50 p-3 border border-slate-100">
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-white p-1 border border-slate-200/60 flex items-center justify-center">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Sparkles size={20} className="text-blue-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                {product.category || "Product"}
              </span>
              <h4 className="truncate text-sm font-bold text-slate-900">{product.name}</h4>
              <p className="text-xs font-semibold text-slate-700">₹{productPrice}</p>
            </div>
          </div>

          {/* TABS */}
          <div className="mt-4 flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("link")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
                activeTab === "link"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Copy size={14} />
              <span>Share Link</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("qr")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
                activeTab === "qr"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <QrCode size={14} />
              <span>QR Code</span>
            </button>
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div className="p-6 pt-3 space-y-4">
          {activeTab === "link" ? (
            <>
              {/* COPY LINK BOX */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Direct Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600 focus:outline-hidden select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`flex flex-shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 ${
                      copied
                        ? "bg-emerald-600"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check size={14} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* QUICK SOCIAL SHARE */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  Quick Share
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5 text-emerald-700 hover:bg-emerald-100/70 transition"
                  >
                    <MessageSquare size={18} className="text-emerald-600" />
                    <span className="text-[11px] font-bold">WhatsApp</span>
                  </a>

                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-sky-100 bg-sky-50/50 p-2.5 text-sky-700 hover:bg-sky-100/70 transition"
                  >
                    <Send size={18} className="text-sky-600" />
                    <span className="text-[11px] font-bold">X / Twitter</span>
                  </a>

                  <a
                    href={emailUrl}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-700 hover:bg-slate-100 transition"
                  >
                    <Mail size={18} className="text-slate-600" />
                    <span className="text-[11px] font-bold">Email</span>
                  </a>
                </div>
              </div>

              {/* NATIVE WEB SHARE API (Mobile / Desktop supported browsers) */}
              {typeof navigator !== "undefined" && navigator.share && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition active:scale-98"
                >
                  <ExternalLink size={14} />
                  <span>Share via Apps</span>
                </button>
              )}
            </>
          ) : (
            /* QR CODE VIEW */
            <div className="flex flex-col items-center justify-center py-2 space-y-4">
              <div className="relative p-4 rounded-2xl bg-white border-2 border-dashed border-blue-200 shadow-md flex flex-col items-center">
                <QRCodeCanvas
                  id="product-qr-canvas"
                  value={shareUrl}
                  size={180}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: product.image || "",
                    x: undefined,
                    y: undefined,
                    height: 32,
                    width: 32,
                    excavate: true,
                  }}
                />
                <span className="mt-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Scan with Phone Camera
                </span>
              </div>

              <div className="w-full flex gap-2">
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-98"
                >
                  <Download size={15} />
                  <span>Download QR Image</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  title="Copy Link"
                >
                  {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareProductModal;
