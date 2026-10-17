import { useState, useEffect, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  Heart,
  ShoppingCart,
  Sparkles,
  Filter,
  RefreshCw,
  Eye,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Star,
  X,
  Minus,
  Plus,
  Share2,
  QrCode,
} from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import axios from "axios";
import { dispatchCartEvent, getValidCart, saveCart, getProductQuantity, updateProductQuantity } from "../../utils/cartUtils.js";
import ShareProductModal from "../../components/ShareProductModal.jsx";
import ProductCard from "../../components/ProductCard.jsx";
import { STORE_CLAIMS } from "../../config/constants.js";
import { formatPrice } from "../../utils/formatters.js";

import { PRODUCT_API_URL, WISHLIST_API_URL } from "../../config/api.js";
const API_URL = PRODUCT_API_URL;

const Shop = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("token");
  const isLoggedIn = Boolean(token);

  const [products, setProducts] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "All");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "featured");
  const [maxPrice, setMaxPrice] = useState(300000);
  const [visibleCount, setVisibleCount] = useState(12);

  const [wishlistIds, setWishlistIds] = useState([]);
  const [cartIds, setCartIds] = useState([]);

  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [sharingProduct, setSharingProduct] = useState(null);

  // =====================================================
  // LOAD PRODUCTS FROM DATABASE
  // =====================================================

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        API_URL
      );

      const data = response.data;
      const productList = Array.isArray(data)
        ? data
        : data.products || data.data || [];

      setProducts(productList);
    } catch (error) {
      console.error(
        "Failed to load products:",
        error
      );

      showNotification(
        "Unable to load products"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchProducts();
  }, []);

  // =====================================================
  // AUTO-SYNC CATEGORY & VIEW SHARED PRODUCT FROM URL (?category=X & ?product=ID)
  // =====================================================

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const targetProductId = urlParams.get("product");
    const targetCategory = urlParams.get("category");

    if (targetCategory) {
      const availableCategories = [...new Set(products.map((p) => p.category).filter(Boolean))];
      const matchedCat = availableCategories.find(
        (c) => c.toLowerCase() === targetCategory.toLowerCase() || c.toLowerCase().includes(targetCategory.toLowerCase()) || targetCategory.toLowerCase().includes(c.toLowerCase())
      );
      setSelectedCategory(matchedCat || targetCategory);
    } else {
      setSelectedCategory("All");
    }

    if (targetProductId && products.length > 0) {
      const match = products.find(
        (p) => String(p._id || p.id) === String(targetProductId)
      );
      if (match) {
        setViewingProduct(match);
      }
    }
  }, [products, location.search]);

  // Sync wishlist & cart with localStorage and listen for updates
  useEffect(() => {
    const syncCartAndWishlist = () => {
      try {
        const savedWishlist = JSON.parse(
          localStorage.getItem("clientWishlist") || "[]"
        );
        const savedCart = getValidCart();
        setWishlistIds(savedWishlist);
        setCartIds(savedCart);
      } catch (error) {
        console.error("Failed to load cart/wishlist:", error);
      }
    };

    syncCartAndWishlist();
    window.addEventListener("cartUpdated", syncCartAndWishlist);
    window.addEventListener("wishlistUpdated", syncCartAndWishlist);
    window.addEventListener("storage", syncCartAndWishlist);
    return () => {
      window.removeEventListener("cartUpdated", syncCartAndWishlist);
      window.removeEventListener("wishlistUpdated", syncCartAndWishlist);
      window.removeEventListener("storage", syncCartAndWishlist);
    };
  }, []);

  // =====================================================
  // NOTIFICATION
  // =====================================================

  const showNotification = (message) => {
    setToastMessage(message);

    setTimeout(() => {
      setToastMessage("");
    }, 2500);
  };

  // =====================================================
  // WISHLIST
  // =====================================================

  const toggleWishlist = async (productId) => {
    let updated;
    const exists = wishlistIds.includes(productId);

    if (exists) {
      updated = wishlistIds.filter((id) => id !== productId);
      showNotification("Removed from Wishlist");
      try {
        const token = localStorage.getItem("token");
        if (token) await axios.delete(`${WISHLIST_API_URL}/${productId}`);
      } catch (err) {
        console.log("Remove wishlist API note:", err.message);
      }
    } else {
      updated = [...wishlistIds, productId];
      showNotification("Added to Wishlist!");
      try {
        const token = localStorage.getItem("token");
        if (token) await axios.post(`${WISHLIST_API_URL}/add`, { productId });
      } catch (err) {
        console.log("Add wishlist API note:", err.message);
      }
    }

    setWishlistIds(updated);
    localStorage.setItem("clientWishlist", JSON.stringify(updated));
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  // =====================================================
  // CART
  // =====================================================

  const handleQuantityChange = (productId, delta, maxStock = Infinity) => {
    if (!productId) return;
    const pId = String(productId);
    const updatedQty = updateProductQuantity(pId, delta, maxStock);
    const updatedCart = getValidCart();
    setCartIds(updatedCart);
    if (updatedQty === 1 && delta > 0) {
      showNotification("Added to Cart!");
    } else if (updatedQty === 0) {
      showNotification("Removed from Cart");
    }
  };

  const toggleCart = (productId) => {
    if (!productId) return;
    const pId = String(productId);
    let updated;

    if (cartIds.includes(pId)) {
      updated = cartIds.filter(
        (id) => String(id) !== pId
      );

      showNotification(
        "Removed from Cart"
      );
    } else {
      updated = [
        ...cartIds,
        pId,
      ];

      showNotification(
        "Added to Cart!"
      );
    }

    setCartIds(updated);
    saveCart(updated);
  };

  // =====================================================
  // CATEGORIES - UNIQUE DERIVATION (NO DUPLICATE MULTI-CATEGORY OVERLAP)
  // =====================================================

  const isCategoryMatch = (productCategory, targetCategory) => {
    if (!targetCategory || targetCategory === "All" || targetCategory === "all") return true;
    if (!productCategory) return false;
    return productCategory.toLowerCase().trim() === targetCategory.toLowerCase().trim();
  };

  const categories = useMemo(() => {
    const rawCategories = products.map((p) => p.category).filter(Boolean);
    const unique = Array.from(new Set(rawCategories));
    return ["All", ...unique];
  }, [products]);

  // =====================================================
  // RELATED PRODUCTS RECOMMENDATION
  // =====================================================

  const relatedProducts = useMemo(() => {
    if (!viewingProduct) return [];
    const currentId = viewingProduct._id || viewingProduct.id;
    const sameCategory = products.filter(
      (p) =>
        (p._id || p.id) !== currentId &&
        isCategoryMatch(p.category, viewingProduct.category)
    );
    if (sameCategory.length >= 2) return sameCategory.slice(0, 3);
    const fallback = products.filter((p) => (p._id || p.id) !== currentId);
    return fallback.slice(0, 3);
  }, [viewingProduct, products]);

  // =====================================================
  // FILTER + SORT
  // =====================================================

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const searchValue = search.toLowerCase().trim();

        const matchesSearch =
          !searchValue ||
          product.name?.toLowerCase().includes(searchValue) ||
          product.description?.toLowerCase().includes(searchValue);

        const matchesCategory = isCategoryMatch(product.category, selectedCategory);

        const stockNum = Number(product.stock || 0);
        let matchesStock = true;
        if (stockFilter === "instock") {
          matchesStock = stockNum > 0;
        } else if (stockFilter === "outofstock") {
          matchesStock = stockNum <= 0;
        }

        const pPrice = Number(product.price || 0);
        const matchesPrice = pPrice <= maxPrice;

        return matchesSearch && matchesCategory && matchesStock && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") {
          return Number(a.price) - Number(b.price);
        }

        if (sortBy === "price-high") {
          return Number(b.price) - Number(a.price);
        }

        return 0;
      });
  }, [
    products,
    search,
    selectedCategory,
    stockFilter,
    maxPrice,
    sortBy,
  ]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="space-y-8">

      {/* HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-300 ring-1 ring-inset ring-blue-500/30 mb-3">
              <Sparkles size={14} /> Curated Tech & Lifestyle Collection
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Explore Our Store
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              Discover verified flagship smartphones, computing systems, and accessories backed by {STORE_CLAIMS.WARRANTY_CLAIM} and express shipping across India.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate(isLoggedIn ? "/client/wishlist" : "/login")}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-[0.98]"
              aria-label="View wishlist"
            >
              <Heart
                size={18}
                className={wishlistIds.length > 0 ? "fill-rose-500 text-rose-500" : "text-slate-300"}
              />
              <span>Wishlist ({wishlistIds.length})</span>
            </button>

            <button
              onClick={() => navigate("/cart")}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 active:scale-[0.98]"
              aria-label="View shopping cart"
            >
              <ShoppingCart size={18} />
              <span>Cart ({cartIds.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH / TOOLBAR / CATEGORIES */}
      <div className="space-y-5 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name or description..."
              className="h-11 w-full rounded-2xl border border-slate-200/90 bg-slate-50/50 py-2 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          {/* CONTROLS */}
          <div className="flex flex-wrap items-center gap-3">
            {/* STOCK STATUS FILTER */}
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200/90 bg-slate-50/50 px-3.5">
              <span className="text-xs font-semibold text-slate-500">Stock:</span>
              <select
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(e.target.value);
                  setVisibleCount(12);
                }}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                aria-label="Filter by stock status"
              >
                <option value="all">All Inventory</option>
                <option value="instock">In Stock Only</option>
                <option value="outofstock">Include Out of Stock</option>
              </select>
            </div>

            {/* PRICE FILTER */}
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200/90 bg-slate-50/50 px-3.5">
              <span className="text-xs font-semibold text-slate-500">Max Price:</span>
              <select
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(Number(e.target.value));
                  setVisibleCount(12);
                }}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                aria-label="Filter by maximum price"
              >
                <option value={300000}>All Prices</option>
                <option value={10000}>Under ₹10,000</option>
                <option value={30000}>Under ₹30,000</option>
                <option value={75000}>Under ₹75,000</option>
                <option value={150000}>Under ₹1,50,000</option>
              </select>
            </div>

            <div className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200/90 bg-slate-50/50 px-3.5">
              <SlidersHorizontal size={16} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setVisibleCount(12);
                }}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                aria-label="Sort products by"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* CATEGORIES CHIPS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          <Filter size={15} className="shrink-0 text-slate-400 mr-1" />
          {categories.map((category) => {
            const count = category === "All"
              ? products.length
              : products.filter(p => isCategoryMatch(p.category, category)).length;
            
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                    : "border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{category}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedCategory === category ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LOADING SKELETON */}
      {loading ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-16 text-center shadow-sm">
          <RefreshCw size={32} className="mx-auto animate-spin text-blue-600" />
          <p className="mt-4 text-sm font-semibold text-slate-700">Loading catalog items...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-16 text-center shadow-sm">
          <Search size={36} className="mx-auto text-slate-300" />
          <h3 className="mt-4 text-lg font-bold text-slate-800">No products found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            We couldn't find any products matching your current search or category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
            }}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div>
        <div className="flex items-center justify-between pb-4 text-xs font-semibold text-slate-500">
          <span>
            Showing {Math.min(visibleCount, filteredProducts.length)} of {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
          </span>
          {filteredProducts.length > 0 && selectedCategory !== "All" && (
            <span className="text-blue-600 font-bold">Category: {selectedCategory}</span>
          )}
        </div>

        {/* PRODUCTS GRID REUSING ACCESSIBLE PRODUCTCARD (3 in a row / 33.3% width) */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 items-stretch">
          {displayedProducts.map((product) => (
            <ProductCard
              key={product._id || product.id}
              product={product}
              onViewDetails={(prod) => setViewingProduct(prod)}
            />
          ))}
        </div>

        {/* LOAD MORE PAGINATION CONTROL */}
        {visibleCount < filteredProducts.length && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 12)}
              className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-300 px-8 py-3.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 transition active:scale-95"
            >
              <span>Load More Products ({filteredProducts.length - visibleCount} remaining)</span>
            </button>
          </div>
        )}
      </div>
      )}

      {/* =================================================
          CLIENT PRODUCT QUICK VIEW DETAILS MODAL
      ================================================= */}
      {viewingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 uppercase tracking-wider">
                  {viewingProduct.category || "Product"}
                </span>
                <span className="text-xs text-slate-400">Quick View</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSharingProduct(viewingProduct)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition shadow-xs"
                  title="Share Product via Link or QR"
                >
                  <Share2 size={15} />
                  <span>Share</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingProduct(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* MODAL BODY */}
            <div className="mt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* IMAGE PREVIEW */}
                <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {viewingProduct.image ? (
                    <img
                      src={viewingProduct.image}
                      alt={viewingProduct.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Sparkles size={48} className="text-slate-300" />
                  )}

                  {/* WISHLIST TOGGLE */}
                  <button
                    type="button"
                    onClick={() => toggleWishlist(viewingProduct._id || viewingProduct.id)}
                    className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-slate-700 shadow-sm backdrop-blur-md transition hover:bg-white active:scale-95"
                  >
                    <Heart
                      size={20}
                      className={wishlistIds.includes(viewingProduct._id || viewingProduct.id) ? "fill-rose-500 text-rose-500" : "text-slate-400"}
                    />
                  </button>
                </div>

                {/* DETAILS & ACTIONS */}
                <div className="flex flex-col justify-between space-y-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      {viewingProduct.name}
                    </h2>

                    {/* RATING */}
                    <div className="mt-2 flex items-center gap-1">
                      {[...Array(5)].map((_, index) => (
                        <Star key={index} size={15} className="fill-amber-400 text-amber-400" />
                      ))}
                      <span className="ml-1.5 text-xs font-semibold text-slate-500">(4.9 rating)</span>
                    </div>

                    {/* PRICE & SAVINGS */}
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-slate-900">
                        ₹{Number(viewingProduct.price || 0).toLocaleString("en-IN")}
                      </span>

                      {Number(viewingProduct.originalPrice) > Number(viewingProduct.price) && (
                        <>
                          <span className="text-sm text-slate-400 line-through font-medium">
                            ₹{Number(viewingProduct.originalPrice).toLocaleString("en-IN")}
                          </span>
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600 border border-emerald-200">
                            Save ₹{(Number(viewingProduct.originalPrice) - Number(viewingProduct.price)).toLocaleString("en-IN")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* STOCK STATUS BADGE */}
                  <div className="py-2 border-y border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Availability</p>
                    {Number(viewingProduct.stock) <= 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600 border border-rose-200">
                        <AlertTriangle size={16} /> Currently Out of Stock
                      </span>
                    ) : Number(viewingProduct.stock) <= 5 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-600 border border-amber-200">
                        <AlertCircle size={16} /> Hurry! Only {viewingProduct.stock} units left in stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-600 border border-emerald-200">
                        <CheckCircle2 size={16} /> In Stock ({viewingProduct.stock} units available)
                      </span>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="pt-2">
                    {Number(viewingProduct.stock) <= 0 ? (
                      <button
                        type="button"
                        disabled
                        className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 px-6 text-sm font-bold text-slate-400 bg-slate-200 cursor-not-allowed shadow-none"
                      >
                        Out of Stock
                      </button>
                    ) : !cartIds.includes(viewingProduct._id || viewingProduct.id) ? (
                      <button
                        type="button"
                        onClick={() => {
                          const pid = viewingProduct._id || viewingProduct.id;
                          handleQuantityChange(pid, 1, Number(viewingProduct.stock));
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 px-6 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition active:scale-[0.98]"
                      >
                        <ShoppingCart size={18} />
                        <span>Add to Shopping Cart</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between gap-4 rounded-2xl bg-blue-50 p-2 border border-blue-200">
                        <button
                          type="button"
                          onClick={() => {
                            const pid = viewingProduct._id || viewingProduct.id;
                            handleQuantityChange(pid, -1, Number(viewingProduct.stock));
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm hover:bg-blue-600 hover:text-white transition active:scale-95"
                          title="Decrease Quantity"
                        >
                          <Minus size={18} />
                        </button>
                        <div className="text-center">
                          <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Quantity in Cart</span>
                          <span className="text-base font-extrabold text-blue-900">
                            {getProductQuantity(viewingProduct._id || viewingProduct.id)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const pid = viewingProduct._id || viewingProduct.id;
                            handleQuantityChange(pid, 1, Number(viewingProduct.stock));
                          }}
                          disabled={getProductQuantity(viewingProduct._id || viewingProduct.id) >= Number(viewingProduct.stock)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50 active:scale-95"
                          title="Increase Quantity"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Product Description</p>
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                  {viewingProduct.description || "High quality product curated for your lifestyle."}
                </p>
              </div>

              {/* RELATED PRODUCTS */}
              {relatedProducts.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Sparkles size={16} className="text-blue-600" />
                      Related Products You Might Like
                    </h3>
                    <span className="text-xs font-semibold text-slate-400">
                      {viewingProduct.category || "Recommended"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {relatedProducts.map((relProduct) => {
                      const relId = relProduct._id || relProduct.id;
                      const isRelInCart = cartIds.includes(relId);
                      return (
                        <div
                          key={relId}
                          onClick={() => setViewingProduct(relProduct)}
                          className="group cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-md flex flex-col justify-between"
                        >
                          <div className="relative mb-2 flex h-24 w-full items-center justify-center overflow-hidden rounded-lg bg-white p-1">
                            {relProduct.image ? (
                              <img
                                src={relProduct.image}
                                alt={relProduct.name}
                                className="max-h-full max-w-full object-contain transition duration-300"
                              />
                            ) : (
                              <Sparkles size={24} className="text-slate-300" />
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                              {relProduct.category || "Product"}
                            </p>
                            <h4 className="line-clamp-1 text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                              {relProduct.name}
                            </h4>
                          </div>
                          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                            <span className="text-xs font-extrabold text-slate-900">
                              ₹{Number(relProduct.price || 0).toLocaleString("en-IN")}
                            </span>
                            {!isRelInCart ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(relId, 1, Number(relProduct.stock));
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                                title="Add to Cart"
                              >
                                <ShoppingCart size={13} />
                              </button>
                            ) : (
                              <div
                                className="flex items-center gap-1 rounded-lg bg-blue-50 p-0.5 border border-blue-200"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(relId, -1, Number(relProduct.stock));
                                  }}
                                  className="flex h-6 w-6 items-center justify-center rounded bg-white text-blue-600 hover:bg-blue-600 hover:text-white transition"
                                >
                                  <Minus size={11} />
                                </button>
                                <span className="min-w-4 text-center text-[11px] font-bold text-blue-900">
                                  {getProductQuantity(relId)}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(relId, 1, Number(relProduct.stock));
                                  }}
                                  disabled={getProductQuantity(relId) >= Number(relProduct.stock)}
                                  className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                  <Plus size={11} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SHARE PRODUCT MODAL */}
      <ShareProductModal
        product={sharingProduct}
        isOpen={Boolean(sharingProduct)}
        onClose={() => setSharingProduct(null)}
      />
    </div>
  );
};

export default Shop;