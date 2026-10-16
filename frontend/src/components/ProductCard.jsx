import { useState, useEffect } from "react";
import {
  ShoppingCart,
  AlertTriangle,
  AlertCircle,
  Eye,
  Heart,
  CheckCircle2,
  X,
  Minus,
  Plus,
  Share2,
  QrCode,
  Star,
} from "lucide-react";
import { dispatchCartEvent, getValidCart, saveCart, getProductQuantity, updateProductQuantity } from "../utils/cartUtils.js";
import ShareProductModal from "./ShareProductModal.jsx";

// Displays a single product's image, name, price, original price, discount, category, stock status and action buttons
const ProductCard = ({ product, onAddToCart, isAdmin = false, onViewDetails, onToggleWishlist }) => {
  const productId = product?._id || product?.id;
  const [inCart, setInCart] = useState(false);
  const [cartQty, setCartQty] = useState(0);
  const [inWishlist, setInWishlist] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const stockNum = Number(product?.stock || 0);
  const priceNum = Number(product?.price || 0);
  const origPriceNum = Number(product?.originalPrice || 0);

  const discountPercent =
    origPriceNum > priceNum && origPriceNum > 0
      ? Math.round(((origPriceNum - priceNum) / origPriceNum) * 100)
      : 0;

  const checkState = () => {
    try {
      const savedCart = getValidCart();
      const isIn = productId ? savedCart.includes(productId) : false;
      setInCart(isIn);
      if (isIn) {
        setCartQty(getProductQuantity(productId));
      } else {
        setCartQty(0);
      }
      const savedWishlist = JSON.parse(localStorage.getItem("clientWishlist") || "[]");
      setInWishlist(productId ? savedWishlist.includes(productId) : false);
    } catch {
      setInCart(false);
      setCartQty(0);
      setInWishlist(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      checkState();
      window.addEventListener("cartUpdated", checkState);
      window.addEventListener("wishlistUpdated", checkState);
      window.addEventListener("storage", checkState);
      return () => {
        window.removeEventListener("cartUpdated", checkState);
        window.removeEventListener("wishlistUpdated", checkState);
        window.removeEventListener("storage", checkState);
      };
    }
  }, [productId, isAdmin]);

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    try {
      const savedWishlist = JSON.parse(localStorage.getItem("clientWishlist") || "[]");
      let updated;
      if (savedWishlist.includes(productId)) {
        updated = savedWishlist.filter((id) => id !== productId);
        setInWishlist(false);
      } else {
        updated = [...savedWishlist, productId];
        setInWishlist(true);
      }
      localStorage.setItem("clientWishlist", JSON.stringify(updated));
      window.dispatchEvent(new Event("wishlistUpdated"));
      if (onToggleWishlist) onToggleWishlist(productId, !inWishlist);
    } catch (err) {
      console.error(err);
    }
  };

  const handleIncrementQuantity = (e) => {
    if (e) e.stopPropagation();
    if (stockNum <= 0) return;
    if (!productId) return;
    try {
      const updatedQty = updateProductQuantity(productId, 1, stockNum);
      setCartQty(updatedQty);
      setInCart(updatedQty > 0);
      if (onAddToCart) onAddToCart(productId, true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecrementQuantity = (e) => {
    if (e) e.stopPropagation();
    if (!productId) return;
    try {
      const updatedQty = updateProductQuantity(productId, -1, stockNum);
      setCartQty(updatedQty);
      setInCart(updatedQty > 0);
      if (onAddToCart) onAddToCart(productId, updatedQty > 0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCardClick = (e) => {
    if (e) e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(product);
    }
    setShowModal(true);
  };

  return (
    <>
      <div
        className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl focus-within:ring-2 focus-within:ring-blue-500"
      >
        <div>
          {/* IMAGE CONTAINER WITH ACCESSIBLE LINK */}
          <Link
            to={`/shop?product=${productId}`}
            onClick={(e) => {
              if (onViewDetails) {
                e.preventDefault();
                onViewDetails(product);
                setShowModal(true);
              }
            }}
            className="relative mb-3 flex h-48 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-50 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`View details for ${product.name}`}
          >
            {/* STOCK STATUS BADGES */}
            {stockNum <= 0 ? (
              <span className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-lg bg-rose-700 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                <AlertTriangle size={12} /> Out of Stock
              </span>
            ) : stockNum <= 5 ? (
              <span className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                <AlertCircle size={12} /> Only {stockNum} Left
              </span>
            ) : (
              <span className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                <CheckCircle2 size={12} /> In Stock
              </span>
            )}

            {/* DISCOUNT BADGE (Hidden on out-of-stock items) */}
            {discountPercent > 0 && stockNum > 0 && (
              <span className="absolute right-2.5 top-2.5 z-10 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-white shadow-md">
                {discountPercent}% OFF
              </span>
            )}

            {/* PRODUCT IMAGE */}
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";
                }}
                className={`max-h-full max-w-full object-contain transition duration-500 group-hover:scale-105 ${
                  stockNum <= 0 ? "opacity-60 grayscale" : ""
                }`}
              />
            ) : (
              <div className="text-slate-400 font-medium text-xs">No image</div>
            )}
          </Link>

          {/* QUICK ACTION BUTTONS (SEPARATE FROM CARD LINK) */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShareModalOpen(true);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm transition"
              aria-label={`Share ${product.name}`}
              title="Share product"
            >
              <Share2 size={14} />
            </button>

            {!isAdmin && (
              <button
                type="button"
                onClick={handleWishlistClick}
                className={`flex h-8 w-8 items-center justify-center rounded-xl shadow-sm transition border ${
                  inWishlist
                    ? "bg-rose-500 text-white border-rose-500 hover:bg-rose-600"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-rose-50 hover:text-rose-500"
                }`}
                aria-label={inWishlist ? `Remove ${product.name} from Wishlist` : `Add ${product.name} to Wishlist`}
                aria-pressed={inWishlist}
                title={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart size={15} className={inWishlist ? "fill-current" : ""} />
              </button>
            )}
          </div>

          {/* CATEGORY & STAR RATING */}
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              {product.category || "Product"}
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
              <Star size={12} className="fill-amber-400 text-amber-500" />
              <span>{product.rating || "4.8"}</span>
              <span className="text-slate-500 font-normal">({product.reviewsCount || "120+"})</span>
            </div>
          </div>

          {/* TITLE LINK */}
          <h3 className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition" title={product.name}>
            <Link
              to={`/shop?product=${productId}`}
              onClick={(e) => {
                if (onViewDetails) {
                  e.preventDefault();
                  onViewDetails(product);
                  setShowModal(true);
                }
              }}
              className="hover:underline focus:outline-none focus:text-blue-600"
            >
              {product.name}
            </Link>
          </h3>

          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
            {product.description}
          </p>
        </div>

        {/* PRICE & ACTION */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-slate-900">
                ₹{priceNum.toLocaleString("en-IN")}
              </span>
              {origPriceNum > priceNum && (
                <span className="text-xs font-semibold text-slate-500 line-through">
                  ₹{origPriceNum.toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>

          {!isAdmin ? (
            stockNum <= 0 ? (
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-500 border border-slate-200"
                aria-label={`${product.name} is out of stock`}
              >
                Out of Stock
              </button>
            ) : !inCart ? (
              <button
                type="button"
                onClick={handleIncrementQuantity}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 focus:ring-2 focus:ring-blue-500"
                aria-label={`Add ${product.name} to cart`}
              >
                <ShoppingCart size={14} />
                <span>Add to Cart</span>
              </button>
            ) : (
              <div
                className="flex items-center gap-2 rounded-xl bg-blue-50 p-1 border border-blue-200"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleDecrementQuantity}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm hover:bg-blue-600 hover:text-white transition active:scale-90"
                  aria-label="Decrease quantity"
                  title="Decrease Quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="min-w-6 text-center text-xs font-extrabold text-blue-900">
                  {cartQty}
                </span>
                <button
                  type="button"
                  onClick={handleIncrementQuantity}
                  disabled={cartQty >= stockNum}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50 active:scale-90"
                  aria-label="Increase quantity"
                  title="Increase Quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
            )
          ) : (
            <button
              type="button"
              onClick={handleCardClick}
              className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-blue-600 hover:text-white transition shadow-sm"
              aria-label={`View details of ${product.name}`}
            >
              <Eye size={14} />
              <span>View</span>
            </button>
          )}
        </div>
      </div>

      {/* DETAILED VIEW MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
          onClick={(e) => {
            e.stopPropagation();
            setShowModal(false);
          }}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl my-8 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Product Details</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShareModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition shadow-xs"
                  title="Share Product"
                >
                  <Share2 size={14} />
                  <span>Share</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex h-56 w-full items-center justify-center rounded-xl bg-slate-50 p-4 border border-slate-100">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400">No Image Available</span>
                )}
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  {product.category || "General"}
                </span>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{product.name}</h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{product.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
                <div>
                  <span className="text-xs font-medium text-slate-400 block">Price</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-extrabold text-slate-900">
                      ₹{priceNum.toLocaleString("en-IN")}
                    </span>
                    {origPriceNum > priceNum && (
                      <span className="text-xs text-slate-400 line-through">
                        ₹{origPriceNum.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                  {discountPercent > 0 && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-emerald-600">
                      {discountPercent}% Savings
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs font-medium text-slate-400 block">Availability</span>
                  <span
                    className={`mt-1 inline-block text-xs font-bold ${
                      stockNum <= 0
                        ? "text-rose-600"
                        : stockNum <= 5
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {stockNum <= 0 ? "Out of Stock" : stockNum <= 5 ? `Only ${stockNum} Left!` : `In Stock (${stockNum} available)`}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Close
              </button>

              {!isAdmin && stockNum > 0 && (
                !inCart ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleIncrementQuantity(e);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <ShoppingCart size={15} />
                    <span>Add to Cart</span>
                  </button>
                ) : (
                  <div
                    className="flex items-center gap-3 rounded-xl bg-blue-50 p-1.5 border border-blue-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={handleDecrementQuantity}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-blue-600 shadow-xs hover:bg-blue-600 hover:text-white transition active:scale-90"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="min-w-6 text-center text-sm font-extrabold text-blue-900">
                      {cartQty}
                    </span>
                    <button
                      type="button"
                      onClick={handleIncrementQuantity}
                      disabled={cartQty >= stockNum}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50 active:scale-90"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* SHARE PRODUCT MODAL */}
      <ShareProductModal
        product={product}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </>
  );
};

export default ProductCard;
