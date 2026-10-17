import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowRight,
  ShoppingBag,
  Zap,
  BookOpen,
  Laptop,
  ShieldCheck,
  Truck,
  Headphones,
  Check,
  ChevronLeft,
  ChevronRight,
  Star,
  Sparkles,
  Tag,
  Flame,
  Smartphone,
  Pause,
  Play,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import BackToTop from "../components/BackToTop.jsx";
import Footer from "../components/Footer.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { getCartCount, getValidCart, dispatchCartEvent } from "../utils/cartUtils.js";
import { STORE_CATEGORIES, getCategoryMetadata } from "../config/categories.js";
import { STORE_CLAIMS } from "../config/constants.js";
import { formatPrice } from "../utils/formatters.js";

import { API_BASE_URL } from "../config/api.js";
const API_URL = API_BASE_URL;

const DEFAULT_BANNERS = [
  {
    id: "banner-1",
    badge: "⚡ Discover Flagship Innovation",
    title: "Everything you need, all in one place.",
    subtitle: "Shop the latest flagship smartphones, laptops, studio-grade audio gear, and high-performance computing accessories at verified prices.",
    primaryCtaText: "Shop Catalog",
    primaryCtaLink: "/shop",
    secondaryCtaText: "Create Account",
    secondaryCtaLink: "/register",
    tagLine: "Smartphones · Laptops · Audio",
    imageUrl: "https://images.unsplash.com/photo-1498049860654-af1a5c566876?auto=format&fit=crop&w=1200&q=80",
    bgGradient: "from-slate-900 via-indigo-950 to-slate-900",
    isActive: true,
  },
  {
    id: "banner-2",
    badge: "🔥 Flash Sale — Up to 40% OFF",
    title: "Upgrade Your Tech Lifestyle Today",
    subtitle: "Premium smartwatches, wireless noise-cancelling headphones, and ultrabooks backed by fast express delivery and official brand warranty.",
    primaryCtaText: "Explore Deals",
    primaryCtaLink: "/shop?sort=price-low",
    secondaryCtaText: "View Featured",
    secondaryCtaLink: "/shop",
    tagLine: "Audio & Wearables",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    bgGradient: "from-blue-950 via-slate-900 to-indigo-950",
    isActive: true,
  },
  {
    id: "banner-3",
    badge: "🎮 Pro Gaming & Performance",
    title: "High Performance Consoles & Low-Latency Gear",
    subtitle: "Level up your gaming setup with mechanical keyboards, precision mice, ultra-smooth displays, and next-gen handheld consoles.",
    primaryCtaText: "Shop Gaming Gear",
    primaryCtaLink: "/shop?category=Gaming%20Gear",
    secondaryCtaText: "Create Account",
    secondaryCtaLink: "/register",
    tagLine: "Consoles & Gaming Peripherals",
    imageUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1200&q=80",
    bgGradient: "from-purple-950 via-slate-900 to-blue-950",
    isActive: true,
  },
];

const Home = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cartIds, setCartIds] = useState([]);
  const [toastMessage, setToastMessage] = useState("");

  const [cartCount, setCartCount] = useState(0);

  // Dynamic Categories State
  const [categoriesList, setCategoriesList] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/products/categories`);
        if (res.data?.success && Array.isArray(res.data.categories)) {
          setCategoriesList(res.data.categories);
        }
      } catch (err) {
        console.error("Home categories fetch error:", err);
      }
    };
    fetchCategories();
  }, []);

  const getCategoryMeta = (categoryName) => {
    return getCategoryMetadata(categoryName);
  };

  const displayCategories = useMemo(() => {
    if (categoriesList.length > 0) {
      return categoriesList.map((c) => {
        const name = typeof c === "string" ? c : c.name;
        const meta = getCategoryMetadata(name);
        return {
          name,
          description: meta.desc,
          productCount: products.filter((p) => p.category?.toLowerCase() === name.toLowerCase()).length,
        };
      });
    }
    return STORE_CATEGORIES.map((cat) => ({
      name: cat.name,
      description: cat.description,
      productCount: products.filter((p) => p.category?.toLowerCase() === cat.name.toLowerCase()).length,
    }));
  }, [categoriesList, products]);

  // Dynamic Hero Banners State
  const [heroBanners, setHeroBanners] = useState(DEFAULT_BANNERS);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const updateCartState = () => {
    setCartCount(getCartCount());
    try {
      const savedCart = getValidCart();
      setCartIds(savedCart);
    } catch (e) {
      console.error(e);
    }
  };

  // Load saved cart & listen for updates
  useEffect(() => {
    updateCartState();
    window.addEventListener("cartUpdated", updateCartState);
    window.addEventListener("storage", updateCartState);
    return () => {
      window.removeEventListener("cartUpdated", updateCartState);
      window.removeEventListener("storage", updateCartState);
    };
  }, []);

  // Fetch Hero Banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await axios.get(`${API_URL}/system/hero-banners`);
        if (res.data?.success && Array.isArray(res.data.banners) && res.data.banners.length > 0) {
          setHeroBanners(res.data.banners);
        }
      } catch (err) {
        console.error("Hero banners fetch note:", err);
      }
    };
    fetchBanners();
  }, []);

  // Active Banners Computation (Guarantees at least 3 slides in rotation)
  const activeBanners = useMemo(() => {
    const fetched = heroBanners.filter((b) => b.isActive !== false);
    if (fetched.length >= 2) return fetched;
    return DEFAULT_BANNERS;
  }, [heroBanners]);

  // Accessible Auto-play slider timer (6.5s interval, pauses on hover/focus and reduced motion)
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused || isHovered) return;

    // Check prefers-reduced-motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    }, 6500);

    return () => clearInterval(timer);
  }, [activeBanners.length, isPaused, isHovered]);

  const toggleCart = (productId) => {
    let updated;
    if (cartIds.includes(productId)) {
      updated = cartIds.filter((id) => id !== productId);
      showNotification("Removed from Cart");
    } else {
      updated = [...cartIds, productId];
      showNotification("Added to Cart!");
    }
    setCartIds(updated);
    localStorage.setItem("clientCart", JSON.stringify(updated));
    dispatchCartEvent();
  };

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 2500);
  };

  // =====================================================
  // GET PRODUCTS FROM BACKEND
  // =====================================================

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API_URL}/products`);

        const data = response.data;

        const productList = Array.isArray(data)
          ? data
          : data.products || data.data || [];

        setProducts(productList);
      } catch (error) {
        console.error("Failed to load products:", error);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Show only in-stock active products in Featured (2 rows of 3 = 6 products)
  const featuredProducts = products
    .filter((product) => product.isActive !== false && Number(product.stock) > 0)
    .slice(0, 6);

  // Top featured product for Hero Card (must be in stock)
  const topProduct = products.find((p) => p.isActive !== false && Number(p.stock) > 0) || products[0];

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <Navbar />

      {/* =================================================
          DYNAMIC HERO CAROUSEL BANNER
      ================================================= */}
      <section
        id="hero"
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured promotions and top electronics deals"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        className="relative overflow-hidden bg-slate-950 text-white transition-colors duration-700"
      >
        {/* Background ambient lighting */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />

        {activeBanners.length > 0 && (
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            {/* CAROUSEL SLIDE ITEM */}
            {activeBanners.map((slide, idx) => {
              if (idx !== currentSlide) return null;
              return (
                <div
                  key={slide.id || idx}
                  className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12 animate-in fade-in duration-500"
                >
                  {/* LEFT HERO TEXT CONTENT */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-bold tracking-wide text-blue-300 backdrop-blur-md">
                      <Sparkles size={14} className="text-blue-400 animate-pulse" />
                      <span>{slide.badge || "⚡ Discover something you'll love"}</span>
                    </div>

                    <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
                      {slide.title || "Everything you need, all in one place."}
                    </h1>

                    <p className="max-w-2xl text-sm font-medium text-slate-300 sm:text-base leading-relaxed">
                      {slide.subtitle || "Shop the latest electronics, smart gadgets, and computer accessories with official brand warranty."}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <Link
                        to={slide.primaryCtaLink || "/shop"}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition active:scale-95 focus:ring-2 focus:ring-white"
                      >
                        <span>{slide.primaryCtaText || "Shop Now"}</span>
                        <ArrowRight size={18} />
                      </Link>

                      <Link
                        to={slide.secondaryCtaLink || "/register"}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/60 px-7 py-3.5 text-sm font-bold text-slate-200 hover:border-slate-500 hover:bg-slate-800 transition active:scale-95 backdrop-blur-md focus:ring-2 focus:ring-white"
                      >
                        <span>{slide.secondaryCtaText || "Create Account"}</span>
                      </Link>
                    </div>

                    {/* TRUST BADGES (SINGLE CONSTANTS SOURCE) */}
                    <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-semibold text-slate-400">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-blue-400" />
                        <span>{STORE_CLAIMS.WARRANTY_CLAIM}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Truck size={16} className="text-emerald-400" />
                        <span>{STORE_CLAIMS.DELIVERY_TIMELINE}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Headphones size={16} className="text-purple-400" />
                        <span>{STORE_CLAIMS.SUPPORT_HOURS}</span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT HERO PRODUCT SHOWCASE CARD */}
                  <div className="lg:col-span-5 relative">
                    <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
                      {topProduct ? (
                        <div>
                          <div className="mb-4 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                              <Flame size={13} className="text-emerald-400 animate-bounce" />
                              Deal of the Day
                            </span>
                            <span className="text-xs font-semibold text-slate-400">In Stock</span>
                          </div>

                          <div className="relative mb-5 flex h-48 sm:h-56 items-center justify-center overflow-hidden rounded-2xl bg-slate-950/80 p-4 border border-slate-800">
                            <img
                              src={topProduct.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80"}
                              alt={topProduct.name}
                              fetchpriority="high"
                              className="h-full w-full object-contain hover:scale-105 transition duration-300"
                            />
                            {Number(topProduct.originalPrice) > Number(topProduct.price) && (
                              <div className="absolute top-3 left-3 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-black text-white shadow-md">
                                SAVE {formatPrice(Number(topProduct.originalPrice) - Number(topProduct.price))}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400">
                              {topProduct.category || "Featured Tech"}
                            </span>
                            <h2 className="text-base font-black text-white line-clamp-2">
                              {topProduct.name}
                            </h2>

                            <div className="flex items-center justify-between pt-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xl font-black text-white">{formatPrice(topProduct.price)}</span>
                                  {Number(topProduct.originalPrice) > Number(topProduct.price) && (
                                    <span className="text-xs text-slate-400 line-through">{formatPrice(topProduct.originalPrice)}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-amber-400 text-xs mt-0.5">
                                  <Star size={12} fill="currentColor" />
                                  <span className="font-bold text-slate-300">{topProduct.rating || "4.8"}</span>
                                  <span className="text-slate-400">({topProduct.reviewsCount || "120+"} reviews)</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleCart(topProduct._id || topProduct.id)}
                                className={`rounded-xl px-4 py-2 text-xs font-bold shadow-md transition active:scale-95 ${
                                  cartIds.includes(topProduct._id || topProduct.id)
                                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                                    : "bg-blue-600 text-white hover:bg-blue-500"
                                }`}
                                aria-label={cartIds.includes(topProduct._id || topProduct.id) ? "Product already in cart" : "Add deal to cart"}
                              >
                                {cartIds.includes(topProduct._id || topProduct.id) ? "✓ Added" : "Add to Cart"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 text-center py-4">
                          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Featured Category</p>
                          <h2 className="text-2xl font-black text-white">{slide.tagLine || "Tech · Audio · Gadgets"}</h2>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* SLIDER CONTROLS & PAGINATION (24px+ Accessible Hit Targets) */}
            {activeBanners.length > 1 && (
              <div className="mt-10 flex items-center justify-between border-t border-slate-800/80 pt-6">
                {/* PAGINATION DOTS WITH ACCESSIBLE HIT TARGETS */}
                <div className="flex items-center gap-1">
                  {activeBanners.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentSlide(i)}
                      className="p-2 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                      aria-label={`Go to slide ${i + 1}`}
                    >
                      <span
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          i === currentSlide ? "w-8 bg-blue-500" : "w-2.5 bg-slate-700 hover:bg-slate-500"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* SLIDE CONTROLS: PAUSE / PLAY + PREV / NEXT */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPaused(!isPaused)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition active:scale-95 focus:ring-2 focus:ring-blue-400"
                    aria-label={isPaused ? "Play slide rotation" : "Pause slide rotation"}
                    title={isPaused ? "Play slide rotation" : "Pause slide rotation"}
                  >
                    {isPaused ? <Play size={16} /> : <Pause size={16} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentSlide((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition active:scale-95 focus:ring-2 focus:ring-blue-400"
                    aria-label="Previous slide"
                    title="Previous slide"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % activeBanners.length)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition active:scale-95 focus:ring-2 focus:ring-blue-400"
                    aria-label="Next slide"
                    title="Next slide"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* =================================================
          CATEGORIES
      ================================================= */}

      {/* =================================================
          CATEGORIES (3x3 Grid Layout)
      ================================================= */}
      <section
        id="categories"
        className="border-b border-slate-100 bg-white py-20 scroll-mt-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
              Browse Catalog
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-900">
              Shop by Category
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
              Explore flagship devices, computing peripherals, and daily tech essentials.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayCategories.map((cat) => {
              const catName = typeof cat === "string" ? cat : cat.name;
              const meta = getCategoryMeta(catName);
              const IconComp = meta.icon;
              const catDesc = (typeof cat === "object" && cat.description) ? cat.description : meta.desc;
              const productCount = typeof cat === "object" && cat.productCount !== undefined
                ? cat.productCount
                : products.filter(p => p.category?.toLowerCase() === catName.toLowerCase()).length;

              return (
                <Link
                  key={catName}
                  to={`/shop?category=${encodeURIComponent(catName)}`}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-300 hover:shadow-xl flex flex-col justify-between"
                  aria-label={`Explore ${catName} category`}
                >
                  {/* TOP ACCENT GRADIENT BAR */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${meta.accentGradient} opacity-90 group-hover:opacity-100 transition-opacity duration-300`} />

                  <div>
                    <div className="flex items-center justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md ${meta.color}`}>
                        <IconComp size={24} />
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold transition-colors duration-200 ${meta.badgeColor}`}>
                        {productCount > 0 ? `${productCount} ${productCount === 1 ? 'item' : 'items'}` : 'Explore'}
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                      {catName}
                    </h3>

                    <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2 font-medium">
                      {catDesc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-blue-600 group-hover:text-blue-700">
                    <span>Browse {catName}</span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:translate-x-1">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* =================================================
          FEATURED PRODUCTS
      ================================================= */}

      <section id="featured" className="bg-slate-50 py-20 scroll-mt-24">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

            <div>

              <p className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
                Featured
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-900">
                Our top picks
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Handpicked premium tech curated for performance and reliability.
              </p>

            </div>

            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              View all products
              <ArrowRight size={17} />
            </Link>

          </div>

          {/* LOADING (3 in a row / 33.3% width) */}
          {loadingProducts && (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-80 animate-pulse rounded-2xl bg-slate-200"
                />
              ))}
            </div>
          )}

          {/* PRODUCTS (3 in a row / 33.3% width) */}
          {!loadingProducts && featuredProducts.length > 0 && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                  onViewDetails={() => navigate("/shop")}
                />
              ))}
            </div>
          )}

          {/* NO PRODUCTS */}

          {!loadingProducts &&
            featuredProducts.length === 0 && (
              <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

                <ShoppingBag
                  size={40}
                  className="mx-auto text-slate-300"
                />

                <h3 className="mt-4 text-lg font-bold text-slate-800">
                  Products coming soon
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Our store is getting ready. Products added
                  by the administrator will appear here.
                </p>

                <Link
                  to="/shop"
                  className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Visit Shop
                </Link>

              </div>
            )}

        </div>

      </section>

      {/* =================================================
          WHY CHOOSE US
      ================================================= */}

      <section
        id="about"
        className="bg-white py-20 scroll-mt-24"
      >

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="text-center">

            <p className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
              Why ElectroZone
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-900">
              Backed by Real Guarantees
            </h2>

            <p className="mx-auto mt-2 text-sm text-slate-500 max-w-lg">
              We focus on speed, authenticity, and dependable warranty support.
            </p>

          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">

            <div className="rounded-2xl border border-slate-200 p-7 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Truck size={27} />
              </div>

              <h3 className="mt-5 font-bold text-slate-900">
                Express Doorstep Delivery
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Free express shipping on orders over ₹999 across all Indian pincodes with live end-to-end order tracking.
              </p>

            </div>

            <div className="rounded-2xl border border-slate-200 p-7 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck size={27} />
              </div>

              <h3 className="mt-5 font-bold text-slate-900">
                1-Year Official Warranty
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                100% authentic brand electronics backed by a standard 1-Year manufacturer warranty and official GST tax invoice.
              </p>

            </div>

            <div className="rounded-2xl border border-slate-200 p-7 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                <Headphones size={27} />
              </div>

              <h3 className="mt-5 font-bold text-slate-900">
                7-Day Replacement Guarantee
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Damaged or defective on arrival? Get an immediate hassle-free replacement with dedicated support Mon–Sat, 9 AM–8 PM IST.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* =================================================
          CTA
      ================================================= */}

      <section className="bg-blue-600">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-14 text-center sm:px-6 lg:flex-row lg:px-8 lg:text-left">

          <div>

            <h2 className="text-3xl font-bold text-white">
              Ready to start shopping?
            </h2>

            <p className="mt-2 text-sm text-blue-100">
              Create your account and discover products
              you'll love.
            </p>

          </div>

          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-blue-600 shadow-lg transition hover:bg-blue-50"
          >
            Create Account
            <ArrowRight size={18} />
          </Link>

        </div>

      </section>

      {/* FOOTER */}
      <Footer />

      {/* TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl animate-in fade-in slide-in-from-bottom-5">
          <Check size={18} className="text-emerald-400" />
          {toastMessage}
        </div>
      )}

      <BackToTop />
    </div>
  );
};

export default Home;
