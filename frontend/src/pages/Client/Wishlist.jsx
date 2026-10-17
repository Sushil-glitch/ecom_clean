import { useState, useEffect } from "react";
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertCircle,
  Minus,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { dispatchCartEvent, getValidCart, getProductQuantity, updateProductQuantity } from "../../utils/cartUtils";
import { toast } from "../../utils/toast.js";
import { PRODUCT_API_URL, WISHLIST_API_URL } from "../../config/api.js";

const Wishlist = () => {
  const navigate = useNavigate();

  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [cartIds, setCartIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (token) {
        const res = await axios.get(WISHLIST_API_URL);
        if (res.data?.success && Array.isArray(res.data.products)) {
          setWishlistProducts(res.data.products);
          const ids = res.data.products.map((p) => p._id || p.id);
          localStorage.setItem("clientWishlist", JSON.stringify(ids));
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.log("Wishlist API fetch note:", err.message);
    }

    // Fallback to local products filter
    try {
      const savedWishlistIds = JSON.parse(localStorage.getItem("clientWishlist") || "[]");
      if (savedWishlistIds.length === 0) {
        setWishlistProducts([]);
        setLoading(false);
        return;
      }
      const prodRes = await axios.get(PRODUCT_API_URL);
      const allProds = prodRes.data?.products || prodRes.data || [];
      const filtered = allProds.filter((p) => savedWishlistIds.includes(p._id || p.id));
      setWishlistProducts(filtered);
    } catch (err) {
      console.error(err);
      setError("Unable to load wishlist products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
    try {
      const savedCart = JSON.parse(localStorage.getItem("clientCart") || "[]");
      setCartIds(savedCart);
    } catch {
      setCartIds([]);
    }

    const handleUpdates = () => fetchWishlist();
    window.addEventListener("wishlistUpdated", handleUpdates);
    window.addEventListener("cartUpdated", () => {
      try {
        const savedCart = JSON.parse(localStorage.getItem("clientCart") || "[]");
        setCartIds(savedCart);
      } catch (e) {
        console.error(e);
      }
    });

    return () => {
      window.removeEventListener("wishlistUpdated", handleUpdates);
    };
  }, []);

  const removeFromWishlist = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await axios.delete(`${WISHLIST_API_URL}/${productId}`);
      }
    } catch (err) {
      console.log("Remove wishlist API note:", err.message);
    }

    const updatedProds = wishlistProducts.filter((p) => (p._id || p.id) !== productId);
    setWishlistProducts(updatedProds);
    const updatedIds = updatedProds.map((p) => p._id || p.id);
    localStorage.setItem("clientWishlist", JSON.stringify(updatedIds));
    window.dispatchEvent(new Event("wishlistUpdated"));
    toast.success("Product removed from Wishlist");
  };

  const handleQuantityChange = (productId, delta, maxStock = Infinity) => {
    if (!productId) return;
    const updatedQty = updateProductQuantity(productId, delta, maxStock);
    setCartIds(getValidCart());
    if (updatedQty === 1 && delta > 0) {
      toast.success("Added to Cart!");
    } else if (updatedQty === 0) {
      toast.info("Removed from Cart");
    }
  };

  const moveToCart = (productId) => {
    let updatedCart = [...cartIds];

    if (!updatedCart.includes(productId)) {
      updatedCart.push(productId);
      setCartIds(updatedCart);
      localStorage.setItem("clientCart", JSON.stringify(updatedCart));
      dispatchCartEvent();
    }

    toast.success("Added to Cart!");
    setTimeout(() => {
      navigate("/client/cart");
    }, 400);
  };

  const handleMoveAllToCart = () => {
    if (wishlistProducts.length === 0) return;
    wishlistProducts.forEach((product) => {
      const currentQty = getProductQuantity(product._id || product.id);
      if (currentQty === 0) {
        updateProductQuantity(product, 1);
      }
    });
    dispatchCartEvent();
    toast.success("Moved all wishlist items to Cart! 🛒");
    navigate("/client/cart");
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-500">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600">Client Portal</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">My Wishlist</h1>
          <p className="mt-1 text-sm text-slate-500">
            {wishlistProducts.length === 1
              ? "1 item saved in your wishlist."
              : `${wishlistProducts.length} items saved in your wishlist.`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {wishlistProducts.length > 0 && (
            <button
              onClick={handleMoveAllToCart}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              <ShoppingCart size={17} />
              Move All to Cart
            </button>
          )}

          <button
            onClick={() => navigate("/client/shop")}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Continue Shopping
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-600 border border-rose-100">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* WISHLIST CONTENT */}
      {wishlistProducts.length === 0 ? (
        /* EMPTY STATE */
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <Heart size={30} />
          </div>

          <h2 className="mt-5 text-lg font-semibold text-slate-900">Your wishlist is empty</h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Save products you love while exploring the shop by clicking the heart icon.
          </p>

          <button
            onClick={() => navigate("/client/shop")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <ShoppingCart size={17} />
            Browse Products
          </button>
        </div>
      ) : (
        /* WISHLIST GRID (3 in a row / 33.3% width) */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {wishlistProducts.map((product) => {
            const pId = product._id || product.id;
            const inCart = cartIds.includes(pId);

            return (
              <div
                key={pId}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex flex-1 flex-col">
                  {/* PRODUCT IMAGE HERO AREA */}
                  <div className="relative flex h-48 w-full items-center justify-center overflow-hidden bg-slate-100">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain p-2 transition duration-500"
                      />
                    ) : (
                      <Sparkles size={48} className="text-slate-300 opacity-60 transition" />
                    )}

                    {/* REMOVE BUTTON */}
                    <button
                      onClick={() => removeFromWishlist(pId)}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-rose-600 shadow-sm backdrop-blur-sm transition hover:bg-rose-50 hover:text-rose-700"
                      title="Remove from wishlist"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  {/* DETAILS */}
                  <div className="flex flex-1 flex-col p-5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                      {product.category}
                    </span>

                    <h3 className="mt-1.5 h-11 text-sm sm:text-base font-bold text-slate-900 line-clamp-2 leading-snug transition group-hover:text-blue-600">
                      {product.name}
                    </h3>

                    <p className="mt-1 h-8 line-clamp-2 text-xs leading-relaxed text-slate-500 font-medium">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* BOTTOM PRICE & ACTION */}
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 p-4">
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">₹{Number(product.price || 0).toLocaleString("en-IN")}</span>

                  {!inCart ? (
                    <button
                      onClick={() => handleQuantityChange(pId, 1, Number(product.stock || 999))}
                      disabled={Number(product.stock) <= 0}
                      className="flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-[11px] font-semibold text-white transition hover:bg-blue-700 shadow-sm disabled:opacity-50"
                    >
                      <ShoppingCart size={13} />
                      Add to Cart
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 p-1 border border-blue-200">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(pId, -1, Number(product.stock || 999))}
                        className="flex h-6 w-6 items-center justify-center rounded bg-white text-blue-600 shadow-xs hover:bg-blue-600 hover:text-white transition"
                        title="Decrease Quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="min-w-4 text-center text-xs font-extrabold text-blue-900">
                        {getProductQuantity(pId)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(pId, 1, Number(product.stock || 999))}
                        disabled={getProductQuantity(pId) >= Number(product.stock || 999)}
                        className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50"
                        title="Increase Quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;