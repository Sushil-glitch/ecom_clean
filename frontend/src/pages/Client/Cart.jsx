import { useEffect, useMemo, useState } from "react";
import { toast } from "../../utils/toast.js";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  HomeIcon,
  Heart,
  Check,
  QrCode,
  CreditCard,
  Banknote,
  ShieldCheck,
  MapPin,
  X,
  ChevronRight,
  Building2,
  Loader2,
  Clock,
  Sparkles,
  Copy,
  Package,
  Ticket,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { addNotification } from "../../utils/notificationUtils";
import { dispatchCartEvent, getValidCart, saveCart, clearCartStorage } from "../../utils/cartUtils";
import { launchRazorpayPayment } from "../../utils/razorpay.js";

import { PRODUCT_API_URL, PAYMENT_API_URL, USER_API_URL, API_BASE_URL } from "../../config/api.js";
const API_URL = PRODUCT_API_URL;
const PAYMENT_API = PAYMENT_API_URL;

const DEFAULT_PAYMENT_SETTINGS = {
  upiId: "merchant@upi",
  upiQrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=merchant@upi&pn=Store&am=0",
  upiPayeeName: "E-Commerce Official Store",
  codExtraCharge: 50,
  enableUpi: true,
  enableCard: true,
  enableCod: true,
  enableRazorpay: true,
};

const Cart = () => {
  const navigate = useNavigate();

  const [apiProducts, setApiProducts] = useState([]);
  const [cartIds, setCartIds] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [toastMessage, setToastMessage] = useState("");

  // Coupon State
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Payment Settings (from Admin)
  const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_SETTINGS);

  // Saved Addresses State (MongoDB Single Source of Truth)
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteAddressTargetId, setDeleteAddressTargetId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    isDefault: false,
  });

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Shipping Address, 2: Payment Method, 3: Success
  const [placedOrder, setPlacedOrder] = useState(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Client Details Form
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    email: "",
    contact: "",
    address: "",
    city: "",
    pincode: "",
  });

  // Payment Selection State
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [upiTransactionRef, setUpiTransactionRef] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    return digits;
  };

  const handleCopyUpi = () => {
    if (paymentSettings?.upiId) {
      navigator.clipboard.writeText(paymentSettings.upiId);
      setCopiedUpi(true);
      toast.success("Store UPI ID copied to clipboard!");
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(API_URL);
        setApiProducts(response.data.products || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };
    fetchProducts();

    // Load Payment Settings from MongoDB API
    const fetchPaymentSettings = async () => {
      try {
        const res = await axios.get(`${PAYMENT_API_URL}/settings`);
        if (res.data?.success && res.data.settings) {
          const s = res.data.settings;
          setPaymentSettings(s);
          if (s.enableRazorpay !== false) setPaymentMethod("Razorpay");
          else if (s.enableUpi) setPaymentMethod("UPI");
          else if (s.enableCard) setPaymentMethod("Card");
          else if (s.enableCod) setPaymentMethod("COD");
        }
      } catch (e) {
        console.error("Failed to parse payment settings:", e);
      }
    };
    fetchPaymentSettings();

    // Auto pre-fill user info if logged in
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user) {
        setShippingInfo((prev) => ({
          ...prev,
          name: user.name || "",
          email: user.email || "",
          contact: user.contact || user.phone || "",
        }));
      }
    } catch (e) {
      console.error("User info parse error:", e);
    }

    // Fetch Saved Addresses for Checkout
    fetchCheckoutAddresses();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchCheckoutAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await axios.get(`${USER_API_URL}/addresses`, getAuthHeaders());
      if (res.data?.success && Array.isArray(res.data.addresses)) {
        const addrs = res.data.addresses;
        setSavedAddresses(addrs);
        const def = addrs.find((a) => a.isDefault) || addrs[0];
        if (def) {
          const defId = def._id || def.id;
          setSelectedAddressId(defId);
          applyAddressToShipping(def);
        }
      } else {
        setSavedAddresses([]);
      }
    } catch (err) {
      console.log("Fetch checkout addresses error:", err.message);
      setSavedAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const applyAddressToShipping = (addr) => {
    if (!addr) return;
    const user = (() => {
      try {
        return JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        return {};
      }
    })();

    const line = (addr.addressLine || addr.street || "").trim();
    const city = (addr.city || "").trim();
    const state = (addr.state || "").trim();
    const pin = (addr.pincode || addr.zip || "").trim();
    const fullAddressStr = `${line}${city ? ", " + city : ""}${state ? ", " + state : ""}${pin ? " - " + pin : ""}`;

    setShippingInfo({
      name: addr.fullName || user.name || "",
      contact: addr.phone || user.contact || "",
      email: user.email || "",
      address: fullAddressStr,
      city: city,
      pincode: pin,
    });
  };

  const handleSelectAddress = (addr) => {
    const addrId = addr._id || addr.id;
    setSelectedAddressId(addrId);
    applyAddressToShipping(addr);
    toast.success(`Selected ${addr.label || "Address"} for delivery`);
  };

  const openAddCheckoutAddressModal = () => {
    setEditingAddress(null);
    const hasHome = savedAddresses.some((a) => a.label === "Home");
    setAddressForm({
      label: hasHome ? "Work" : "Home",
      fullName: shippingInfo.name || "",
      phone: shippingInfo.contact || "",
      addressLine: "",
      city: shippingInfo.city || "",
      state: "",
      pincode: shippingInfo.pincode || "",
      landmark: "",
      isDefault: savedAddresses.length === 0,
    });
    setShowAddressModal(true);
  };

  const openEditCheckoutAddressModal = (e, addr) => {
    e.stopPropagation();
    setEditingAddress(addr);
    setAddressForm({
      label: addr.label || "Home",
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      addressLine: addr.addressLine || addr.street || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || addr.zip || "",
      landmark: addr.landmark || "",
      isDefault: Boolean(addr.isDefault),
    });
    setShowAddressModal(true);
  };

  const handleSaveCheckoutAddress = async (e) => {
    e.preventDefault();
    const addressLine = (addressForm.addressLine || "").trim();
    const pincode = (addressForm.pincode || "").trim();
    const fullName = addressForm.fullName.trim();
    const phone = addressForm.phone.trim();

    if (!fullName || !addressLine || !addressForm.city || !addressForm.state || !pincode || !phone) {
      toast.error("Please fill in all required address fields.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit mobile number (cannot exceed 10 digits).");
      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      toast.error("Please enter a valid 6-digit PIN code (cannot exceed 6 digits).");
      return;
    }

    const payload = {
      label: addressForm.label,
      fullName,
      phone,
      addressLine,
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      pincode,
      landmark: addressForm.landmark.trim(),
      isDefault: addressForm.isDefault,
    };

    try {
      if (editingAddress) {
        const addrId = editingAddress._id || editingAddress.id;
        const res = await axios.put(`${USER_API_URL}/addresses/${addrId}`, payload, getAuthHeaders());
        if (res.data?.success) {
          toast.success("Address updated!");
          setShowAddressModal(false);
          fetchCheckoutAddresses();
        }
      } else {
        const res = await axios.post(`${USER_API_URL}/addresses`, payload, getAuthHeaders());
        if (res.data?.success) {
          toast.success("New address saved as default!");
          setShowAddressModal(false);
          const newAddr = res.data.address;
          if (newAddr) {
            const newId = newAddr._id || newAddr.id;
            setSelectedAddressId(newId);
            applyAddressToShipping(newAddr);
          }
          fetchCheckoutAddresses();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save address.");
    }
  };

  const handleDeleteCheckoutAddress = (e, addressId) => {
    e.stopPropagation();
    setDeleteAddressTargetId(addressId);
  };

  const confirmDeleteCheckoutAddress = async () => {
    if (!deleteAddressTargetId) return;
    const addressId = deleteAddressTargetId;
    setDeleteAddressTargetId(null);

    try {
      const res = await axios.delete(`${USER_API_URL}/addresses/${addressId}`, getAuthHeaders());
      if (res.data?.success) {
        toast.success("Address deleted!");
        fetchCheckoutAddresses();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete address.");
    }
  };

  const handleSetDefaultCheckoutAddress = async (e, addressId) => {
    e.stopPropagation();
    try {
      const res = await axios.put(`${USER_API_URL}/addresses/${addressId}/default`, {}, getAuthHeaders());
      if (res.data?.success) {
        toast.success("Default address updated!");
        fetchCheckoutAddresses();
      }
    } catch (err) {
      toast.error("Failed to set default address.");
    }
  };

  useEffect(() => {
    try {
      const savedCart = getValidCart();
      setCartIds(savedCart);

      const savedQuantities = JSON.parse(localStorage.getItem("clientCartQuantities") || "{}");
      const normalizedQuantities = {};
      savedCart.forEach((id) => {
        normalizedQuantities[id] = savedQuantities[id] || 1;
      });

      setQuantities(normalizedQuantities);
    } catch {
      setCartIds([]);
      setQuantities({});
    }
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage("");
    }, 2000);
  };

  const allProductsList = useMemo(() => {
    return apiProducts;
  }, [apiProducts]);

  const cartProducts = useMemo(() => {
    return allProductsList.filter((product) => {
      const pId = String(product._id || product.id || "");
      return cartIds.some((cId) => String(cId) === pId);
    });
  }, [allProductsList, cartIds]);

  const updateQuantity = (productId, change) => {
    const pId = String(productId);
    const targetProduct = allProductsList.find((p) => String(p._id || p.id || "") === pId);
    const availableStock = Number(targetProduct?.stock || 0);

    setQuantities((previous) => {
      const currentQuantity = previous[pId] || 1;
      let newQuantity = currentQuantity + change;

      if (availableStock > 0 && newQuantity > availableStock) {
        toast.error(`Cannot exceed available stock of ${availableStock} units.`);
        newQuantity = availableStock;
      } else {
        newQuantity = Math.max(1, newQuantity);
      }

      const updated = {
        ...previous,
        [pId]: newQuantity,
      };

      saveCart(cartIds, updated);
      return updated;
    });
  };

  const removeFromCart = (productId) => {
    const pId = String(productId);
    const updatedCart = cartIds.filter((id) => String(id) !== pId);
    const updatedQuantities = { ...quantities };
    delete updatedQuantities[pId];

    setCartIds(updatedCart);
    setQuantities(updatedQuantities);

    saveCart(updatedCart, updatedQuantities);
    toast.success("Product removed from cart");
  };

  const clearCart = () => {
    setCartIds([]);
    setQuantities({});
    clearCartStorage();
    toast.success("Cart cleared");
  };

  // Price calculations
  const subtotal = cartProducts.reduce((sum, product) => {
    const pId = String(product._id || product.id || "");
    const quantity = quantities[pId] || 1;
    return sum + Number(product.price || 0) * quantity;
  }, 0);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return toast.error("Please enter a promo coupon code.");
    try {
      setValidatingCoupon(true);
      const res = await axios.post(`${API_BASE_URL}/coupons/validate`, {
        code: couponInput,
        subtotal,
      });
      if (res.data?.success) {
        setAppliedCoupon(res.data);
        toast.success(res.data.message);
      }
    } catch (err) {
      console.error("Apply coupon error:", err);
      toast.error(err.response?.data?.message || "Invalid or expired promo code.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    toast.success("Coupon removed.");
  };

  const shipping = subtotal > 0 ? 10 : 0;
  const codCharge = paymentMethod === "COD" ? (paymentSettings.codExtraCharge || 50) : 0;
  const discountAmount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  const grandTotal = Math.max(0, subtotal + shipping + codCharge - discountAmount);

  // Handle Checkout Order Submission
  const handlePlaceOrder = async () => {
    if (isSubmittingOrder) return;

    if (!shippingInfo.name || !shippingInfo.address || !shippingInfo.contact) {
      toast.error("Please complete your shipping address information.");
      setCheckoutStep(1);
      return;
    }

    if (shippingInfo.contact && !/^\d{10}$/.test(shippingInfo.contact.trim())) {
      toast.error("Contact number must be exactly 10 digits.");
      setCheckoutStep(1);
      return;
    }

    if (shippingInfo.email && !/^\S+@\S+\.\S+$/.test(shippingInfo.email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (paymentMethod === "UPI" && !upiTransactionRef.trim()) {
      toast.error("Please enter your UPI Transaction Reference Number.");
      return;
    }

    if (paymentMethod === "Card" && (!cardInfo.cardNumber || !cardInfo.expiry || !cardInfo.cvv)) {
      toast.error("Please complete your card details.");
      return;
    }

    setIsSubmittingOrder(true);

    const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const trackingNumber = `TRK-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const fullAddress = `${shippingInfo.address}${shippingInfo.city ? `, ${shippingInfo.city}` : ""}${
      shippingInfo.pincode ? ` - ${shippingInfo.pincode}` : ""
    }`;

    const payload = {
      items: cartProducts.map((p) => {
        const pId = p._id || p.id;
        return {
          _id: pId,
          id: pId,
          quantity: quantities[pId] || 1,
          qty: quantities[pId] || 1,
        };
      }),
      paymentMethod,
      paymentDetails: {
        upiId: paymentSettings.upiId,
        upiTransactionRef: paymentMethod === "UPI" ? upiTransactionRef : "",
        cardLast4: paymentMethod === "Card" ? cardInfo.cardNumber.slice(-4) || "4242" : "",
        cardHolder: paymentMethod === "Card" ? cardInfo.cardHolder : "",
        note: paymentMethod === "COD" ? "Cash to be collected upon delivery" : "",
      },
      clientInfo: {
        name: shippingInfo.name,
        email: shippingInfo.email,
        contact: shippingInfo.contact,
        address: fullAddress,
      },
    };

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${PAYMENT_API}/orders`, payload, { headers });

      if (res.data?.success && res.data.order) {
        const confirmedOrder = res.data.order;
        setPlacedOrder(confirmedOrder);

        // Trigger real-time Notification
        addNotification({
          title: "Order Placed Successfully!",
          message: `Your order ${confirmedOrder.orderId} for ₹${confirmedOrder.totalAmount} has been placed.`,
          type: "order",
        });

        // Auto-save shipping address as default if user typed a new address not currently saved
        if (token && shippingInfo.address && shippingInfo.city && shippingInfo.pincode) {
          const addressMatch = savedAddresses.some(
            (a) => (a.addressLine || a.street || "").trim().toLowerCase() === shippingInfo.address.trim().toLowerCase()
          );
          if (!addressMatch) {
            try {
              await axios.post(
                `${USER_API_URL}/addresses`,
                {
                  label: "Home",
                  fullName: shippingInfo.name || "Customer",
                  phone: shippingInfo.contact || "0000000000",
                  addressLine: shippingInfo.address,
                  city: shippingInfo.city,
                  state: "State",
                  pincode: shippingInfo.pincode,
                  isDefault: true,
                },
                getAuthHeaders()
              );
              fetchCheckoutAddresses();
            } catch (saveAddrErr) {
              console.log("Auto-save address background error:", saveAddrErr.message);
            }
          }
        }

        // Clear Cart Storage completely (user-namespaced & legacy keys)
        if (paymentMethod === "Razorpay" && res.data.razorpayOrder) {
          try {
            await launchRazorpayPayment({
              razorpayOrder: res.data.razorpayOrder,
              order: confirmedOrder,
              shippingInfo,
              onSuccess: async (razorpayResponse) => {
                try {
                  const verifyRes = await axios.post(
                    `${PAYMENT_API}/razorpay/verify-payment`,
                    {
                      orderId: confirmedOrder._id || confirmedOrder.orderId,
                      razorpay_order_id: razorpayResponse.razorpay_order_id,
                      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                      razorpay_signature: razorpayResponse.razorpay_signature,
                    },
                    getAuthHeaders()
                  );
                  if (verifyRes.data?.success && verifyRes.data.order) {
                    setPlacedOrder(verifyRes.data.order);
                  }
                  toast.success("Payment verified successfully via Razorpay!");
                } catch (vErr) {
                  console.error("Razorpay verification error:", vErr);
                  toast.warning("Payment submitted! Your order is being processed.");
                }
                setCartIds([]);
                setQuantities({});
                clearCartStorage();
                setCheckoutStep(3);
              },
              onDismiss: () => {
                toast.warning("Payment window closed. Your order is pending in your Orders page.");
                setCartIds([]);
                setQuantities({});
                clearCartStorage();
                setCheckoutStep(3);
              },
              onFailure: (err) => {
                toast.error(`Payment failed: ${err?.description || err?.reason || "Transaction was declined"}`);
              },
            });
            return;
          } catch (rzpErr) {
            console.error("Razorpay modal error:", rzpErr);
            toast.error("Could not initialize Razorpay checkout. Your order is saved in Orders.");
            setCartIds([]);
            setQuantities({});
            clearCartStorage();
            setCheckoutStep(3);
            return;
          }
        }

        setCartIds([]);
        setQuantities({});
        clearCartStorage();

        setCheckoutStep(3); // Show Success Screen
      } else {
        toast.error(res.data?.message || "Failed to place order. Please try again.");
      }
    } catch (e) {
      console.error("Order creation error:", e);
      const errMsg = e.response?.data?.message || "Order placement failed. Please verify stock and try again.";
      toast.error(errMsg);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl">
          <Check size={18} className="text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Client Portal</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">My Cart</h1>
          <p className="mt-1 text-sm text-slate-500">Review the products you want to purchase.</p>
        </div>

        <div className="flex items-center gap-3">
          {cartProducts.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition shadow-sm"
            >
              <Trash2 size={14} />
              Clear Cart
            </button>
          )}

          <button
            onClick={() => navigate("/client/shop")}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Continue Shopping
          </button>
        </div>
      </div>

      {/* EMPTY CART */}
      {cartProducts.length === 0 && checkoutStep !== 3 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ShoppingCart size={30} />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-slate-900">Your cart is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Add products from the Shop or move products from your Wishlist into your cart.
          </p>
          <button
            onClick={() => navigate("/client/shop")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <ShoppingCart size={17} />
            Browse Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* CART ITEMS LIST */}
          <div className="space-y-4 lg:col-span-2">
            {cartProducts.map((product) => {
              const pId = product._id || product.id;
              const quantity = quantities[pId] || quantities[product.id] || 1;

              return (
                <div
                  key={pId}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 sm:w-28">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <ShoppingCart size={36} className="text-slate-300 opacity-60" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                      {product.category}
                    </p>
                    <h3 className="mt-1 font-bold text-slate-900">{product.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{product.description}</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">₹{product.price}</p>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:flex-col">
                    <div className="flex items-center rounded-xl border border-slate-200">
                      <button
                        onClick={() => updateQuantity(pId, -1)}
                        className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-50"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-slate-800">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(pId, 1)}
                        className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-50"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(pId)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ORDER SUMMARY */}
          <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-800">₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Shipping</span>
                <span className="font-semibold text-slate-800">₹{shipping.toFixed(2)}</span>
              </div>

              {/* PROMO COUPON CODE SECTION */}
              <div className="pt-2 pb-1 border-t border-slate-100">
                {!appliedCoupon ? (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Ticket size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Promo Code"
                        className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs font-bold uppercase text-slate-800 focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponInput.trim()}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition disabled:opacity-50"
                    >
                      {validatingCoupon ? "Applying..." : "Apply"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-2.5 border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <Ticket size={16} className="text-emerald-600" />
                      <div>
                        <span className="text-xs font-extrabold text-emerald-900">
                          {appliedCoupon.coupon?.code || "COUPON APPLIED"}
                        </span>
                        <span className="text-[10px] text-emerald-700 block">
                          Saved ₹{discountAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Savings</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              {/* TOTAL SAVINGS BADGE PILL */}
              {(() => {
                const totalOrig = cartProducts.reduce((sum, p) => {
                  const pId = String(p._id || p.id || "");
                  const qty = quantities[pId] || 1;
                  const orig = Number(p.originalPrice || p.price || 0);
                  return sum + orig * qty;
                }, 0);
                const prodDisc = Math.max(0, totalOrig - subtotal);
                const netSavings = prodDisc + discountAmount;

                if (netSavings > 0) {
                  return (
                    <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200 text-center animate-in fade-in duration-300">
                      <p className="text-xs font-black text-emerald-800 flex items-center justify-center gap-1.5">
                        <Sparkles size={15} className="text-emerald-600" />
                        <span>You save ₹{netSavings.toLocaleString("en-IN")} on this order! 🎉</span>
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="text-xl font-bold text-blue-600">₹{subtotal > 0 ? grandTotal.toFixed(2) : "0.00"}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setCheckoutStep(1);
                setIsCheckoutOpen(true);
              }}
              disabled={cartProducts.length === 0}
              className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Proceed to Checkout & Pay
            </button>

            <button
              onClick={() => navigate("/client/wishlist")}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Heart size={16} />
              View Wishlist
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          CHECKOUT & PAYMENT MODAL
      ===================================================== */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl my-auto">
            {/* MODAL HEADER FOR STEPS 1 & 2 */}
            {checkoutStep !== 3 ? (
              <div className="flex items-center justify-between p-5 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white font-extrabold shadow-sm">
                    {checkoutStep}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {checkoutStep === 1 && "Shipping & Delivery Information"}
                      {checkoutStep === 2 && "Select Payment Method"}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {checkoutStep === 1 && "Step 1 of 2 — Choose or add delivery address"}
                      {checkoutStep === 2 && "Step 2 of 2 — Choose UPI, Card or COD"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              /* SLEEK HEADER CLOSE BUTTON FOR STEP 3 SUCCESS SCREEN */
              <div className="flex items-center justify-end p-4 pb-0">
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* STEP 1: SHIPPING ADDRESS */}
            {checkoutStep === 1 && (
              <div className="p-6 space-y-5">
                {/* SAVED ADDRESSES SELECTOR */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <MapPin size={15} className="text-blue-600" />
                      Select Delivery Address
                    </h4>

                    <button
                      type="button"
                      onClick={openAddCheckoutAddressModal}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                    >
                      <Plus size={14} /> Add New Address
                    </button>
                  </div>

                  {loadingAddresses ? (
                    <div className="flex items-center justify-center p-8 rounded-xl bg-slate-50">
                      <Loader2 size={24} className="animate-spin text-blue-600" />
                    </div>
                  ) : savedAddresses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                      {savedAddresses.map((addr) => {
                        const addrId = addr._id || addr.id;
                        const isSelected = selectedAddressId === addrId;

                        return (
                          <div
                            key={addrId}
                            onClick={() => handleSelectAddress(addr)}
                            className={`relative cursor-pointer flex flex-col justify-between rounded-xl p-4 border transition ${
                              isSelected
                                ? "bg-blue-50/50 text-blue-900 border-blue-500 ring-1 ring-blue-500 font-semibold"
                                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  {addr.label === "Work" ? (
                                    <Building2 size={15} className="text-blue-600" />
                                  ) : (
                                    <HomeIcon size={15} className="text-blue-600" />
                                  )}
                                  <span className="text-xs font-bold uppercase text-slate-800">
                                    {addr.label || "HOME"}
                                  </span>
                                </div>

                                {addr.isDefault && (
                                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                    Default
                                  </span>
                                )}
                              </div>

                              <p className="text-xs font-bold text-slate-900">{addr.fullName}</p>
                              {addr.phone && (
                                <p className="text-[11px] text-slate-500 font-medium">{addr.phone}</p>
                              )}
                              <p className="text-xs text-slate-600 line-clamp-1 mt-1">
                                {addr.addressLine || addr.street}
                              </p>
                              <p className="text-xs text-slate-600 font-medium">
                                {addr.city}, {addr.state} - {addr.pincode || addr.zip}
                              </p>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-end gap-2 text-[11px]">
                              <button
                                type="button"
                                onClick={(e) => openEditCheckoutAddressModal(e, addr)}
                                className="font-semibold text-slate-600 hover:text-blue-600"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteCheckoutAddress(e, addrId)}
                                className="font-semibold text-rose-500 hover:text-rose-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 p-5 text-center bg-slate-50/50">
                      <p className="text-xs text-slate-500 font-medium">No saved addresses found.</p>
                      <button
                        type="button"
                        onClick={openAddCheckoutAddressModal}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                      >
                        <Plus size={14} /> Add your first delivery address
                      </button>
                    </div>
                  )}
                </div>

                {/* FORM INPUTS */}
                <div className="space-y-3.5 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Recipient Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={shippingInfo.name}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Phone (10 digits) *</label>
                      <input
                        type="text"
                        maxLength={10}
                        value={shippingInfo.contact}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, contact: e.target.value.replace(/\D/g, "") })}
                        placeholder="9876543210"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Street Address *</label>
                    <input
                      type="text"
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                      placeholder="123 Main Street, Flat / Suite"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder:text-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                      <input
                        type="text"
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                        placeholder="Mumbai"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">PIN Code (6 digits)</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={shippingInfo.pincode}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, pincode: e.target.value.replace(/\D/g, "") })}
                        placeholder="400001"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!shippingInfo.name || !shippingInfo.address || !shippingInfo.contact) {
                        toast.error("Please fill in recipient name, contact number, and address.");
                        return;
                      }
                      if (!/^\d{10}$/.test(shippingInfo.contact.trim())) {
                        toast.error("Contact number must be exactly 10 digits.");
                        return;
                      }
                      setCheckoutStep(2);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                  >
                    Proceed to Payment <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: PAYMENT METHOD */}
            {checkoutStep === 2 && (
              <div className="p-6 space-y-6">
                {/* PAYMENT METHOD SELECTOR */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Select Payment Method
                    </label>
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <ShieldCheck size={13} /> 256-Bit SSL Encrypted
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* RAZORPAY */}
                    {paymentSettings.enableRazorpay !== false && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("Razorpay")}
                        className={`relative flex flex-col justify-between rounded-2xl p-4 border text-left transition-all duration-200 ${
                          paymentMethod === "Razorpay"
                            ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/80 shadow-sm"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-xs transition-colors ${
                            paymentMethod === "Razorpay" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
                          }`}>
                            <Zap size={20} className={paymentMethod === "Razorpay" ? "fill-white" : ""} />
                          </div>
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-blue-800">
                            Fast & Safe
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                            <span>Razorpay Gateway</span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500 leading-snug">
                            UPI, Cards, NetBanking
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                          <span className={paymentMethod === "Razorpay" ? "font-bold text-blue-700" : "text-slate-400"}>
                            {paymentMethod === "Razorpay" ? "Selected" : "Select Option"}
                          </span>
                          <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                            paymentMethod === "Razorpay" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"
                          }`}>
                            {paymentMethod === "Razorpay" && <Check size={11} className="stroke-[3]" />}
                          </span>
                        </div>
                      </button>
                    )}

                    {/* UPI */}
                    {paymentSettings.enableUpi && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("UPI")}
                        className={`relative flex flex-col justify-between rounded-2xl p-4 border text-left transition-all duration-200 ${
                          paymentMethod === "UPI"
                            ? "bg-purple-50/70 border-purple-500 ring-2 ring-purple-500/80 shadow-sm"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-xs transition-colors ${
                            paymentMethod === "UPI" ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-600"
                          }`}>
                            <QrCode size={20} />
                          </div>
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-purple-800">
                            Scan QR
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                            <span>UPI Instant</span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500 leading-snug">
                            QR & Direct VPA Transfer
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                          <span className={paymentMethod === "UPI" ? "font-bold text-purple-700" : "text-slate-400"}>
                            {paymentMethod === "UPI" ? "Selected" : "Select Option"}
                          </span>
                          <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                            paymentMethod === "UPI" ? "border-purple-600 bg-purple-600 text-white" : "border-slate-300"
                          }`}>
                            {paymentMethod === "UPI" && <Check size={11} className="stroke-[3]" />}
                          </span>
                        </div>
                      </button>
                    )}

                    {/* CARD */}
                    {paymentSettings.enableCard && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("Card")}
                        className={`relative flex flex-col justify-between rounded-2xl p-4 border text-left transition-all duration-200 ${
                          paymentMethod === "Card"
                            ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/80 shadow-sm"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-xs transition-colors ${
                            paymentMethod === "Card" ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600"
                          }`}>
                            <CreditCard size={20} />
                          </div>
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-indigo-800">
                            Direct
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                            <span>Card Checkout</span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500 leading-snug">
                            Credit & Debit Cards
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                          <span className={paymentMethod === "Card" ? "font-bold text-indigo-700" : "text-slate-400"}>
                            {paymentMethod === "Card" ? "Selected" : "Select Option"}
                          </span>
                          <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                            paymentMethod === "Card" ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"
                          }`}>
                            {paymentMethod === "Card" && <Check size={11} className="stroke-[3]" />}
                          </span>
                        </div>
                      </button>
                    )}

                    {/* COD */}
                    {paymentSettings.enableCod && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("COD")}
                        className={`relative flex flex-col justify-between rounded-2xl p-4 border text-left transition-all duration-200 ${
                          paymentMethod === "COD"
                            ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/80 shadow-sm"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-xs transition-colors ${
                            paymentMethod === "COD" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-600"
                          }`}>
                            <Banknote size={20} />
                          </div>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-800">
                            +₹{paymentSettings.codExtraCharge || 50}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                            <span>Cash on Delivery</span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500 leading-snug">
                            Pay upon doorstep arrival
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                          <span className={paymentMethod === "COD" ? "font-bold text-emerald-700" : "text-slate-400"}>
                            {paymentMethod === "COD" ? "Selected" : "Select Option"}
                          </span>
                          <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                            paymentMethod === "COD" ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"
                          }`}>
                            {paymentMethod === "COD" && <Check size={11} className="stroke-[3]" />}
                          </span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* METHOD SPECIFIC FORMS */}
                {/* 0. RAZORPAY FORM */}
                {paymentMethod === "Razorpay" && (
                  <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/50 p-5 space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                          <Zap size={22} className="fill-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">Razorpay Payment Gateway</h4>
                            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                              Instant Order
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">Pay seamlessly with all Indian & International payment options.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 rounded-xl bg-white border border-blue-200 px-3 py-1.5 shadow-2xs">
                        <span className="text-xs text-slate-400 font-medium">Payable:</span>
                        <span className="text-sm font-extrabold text-blue-700">₹{grandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs text-slate-600">
                      <div className="flex items-start gap-2 rounded-xl bg-white p-3 border border-slate-100 shadow-2xs">
                        <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-800">All UPI Apps</p>
                          <p className="text-[11px] text-slate-400">GPay, PhonePe, Paytm, BHIM</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 rounded-xl bg-white p-3 border border-slate-100 shadow-2xs">
                        <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-800">Cards & EMI</p>
                          <p className="text-[11px] text-slate-400">Visa, Mastercard, RuPay</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 rounded-xl bg-white p-3 border border-slate-100 shadow-2xs">
                        <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-800">Instant Verification</p>
                          <p className="text-[11px] text-slate-400">Atomic inventory reservation</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 text-center sm:text-left">
                      * Clicking <span className="font-semibold text-slate-700">Pay via Razorpay</span> will launch the official Razorpay payment modal.
                    </p>
                  </div>
                )}

                {/* 1. UPI FORM */}
                {paymentMethod === "UPI" && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-5 pb-4 border-b border-slate-200/60">
                      <img
                        src={paymentSettings.upiQrUrl}
                        alt="UPI Scanner"
                        className="h-28 w-28 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm object-contain"
                        onError={(e) => {
                          e.target.src = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=UPI";
                        }}
                      />
                      <div className="text-center sm:text-left space-y-2 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">Scan QR or Copy Store VPA</p>
                        <p className="text-base font-bold text-slate-900">{paymentSettings.upiPayeeName}</p>
                        
                        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1 shadow-2xs">
                          <code className="text-xs font-mono font-bold text-slate-800">
                            {paymentSettings.upiId}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition"
                          >
                            <Copy size={12} />
                            <span>{copiedUpi ? "Copied!" : "Copy"}</span>
                          </button>
                        </div>

                        <p className="text-xs text-slate-500">Scan using Google Pay, PhonePe, Paytm, or BHIM.</p>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Enter UPI Transaction Reference Number (UTR) *
                      </label>
                      <input
                        type="text"
                        value={upiTransactionRef}
                        onChange={(e) => setUpiTransactionRef(e.target.value)}
                        placeholder="e.g. 129840192837"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100 placeholder:text-slate-400"
                      />
                      <p className="mt-1 text-xs text-slate-400">Enter the 12-digit UTR/Reference ID from your payment application.</p>
                    </div>
                  </div>
                )}

                {/* 2. CARD FORM */}
                {paymentMethod === "Card" && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                    {/* VIRTUAL CARD PREVIEW */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 p-5 text-white shadow-md max-w-sm mx-auto">
                      <div className="flex items-center justify-between text-xs text-white/70">
                        <span className="font-bold tracking-widest text-white/90">CREDIT / DEBIT</span>
                        <CreditCard size={20} className="text-blue-400" />
                      </div>
                      <div className="my-4 font-mono text-lg font-bold tracking-widest">
                        {cardInfo.cardNumber || "•••• •••• •••• ••••"}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <p className="text-[10px] text-white/60 uppercase">Cardholder</p>
                          <p className="font-semibold truncate max-w-[150px]">{cardInfo.cardHolder || "YOUR NAME"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/60 uppercase">Expires</p>
                          <p className="font-semibold font-mono">{cardInfo.expiry || "MM/YY"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">Card Number *</label>
                        <input
                          type="text"
                          maxLength={19}
                          value={cardInfo.cardNumber}
                          onChange={(e) => setCardInfo({ ...cardInfo, cardNumber: formatCardNumber(e.target.value) })}
                          placeholder="4242 4242 4242 4242"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 font-mono outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-700">Cardholder Name</label>
                          <input
                            type="text"
                            value={cardInfo.cardHolder}
                            onChange={(e) => setCardInfo({ ...cardInfo, cardHolder: e.target.value })}
                            placeholder="John Doe"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">Expiry</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              maxLength={5}
                              value={cardInfo.expiry}
                              onChange={(e) => setCardInfo({ ...cardInfo, expiry: formatExpiry(e.target.value) })}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 text-center font-mono outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">CVV</label>
                            <input
                              type="password"
                              maxLength={3}
                              placeholder="•••"
                              value={cardInfo.cvv}
                              onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 text-center font-mono outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. COD NOTICE */}
                {paymentMethod === "COD" && (
                  <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/40 p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                        <Banknote size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Cash on Delivery</h4>
                        <p className="text-xs text-slate-500">Pay cash or UPI upon parcel arrival directly to your delivery partner.</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 text-xs">
                      <span className="text-emerald-800 font-medium">Extra COD Handling Fee:</span>
                      <span className="font-extrabold text-emerald-900">+₹{paymentSettings.codExtraCharge || 50}</span>
                    </div>
                  </div>
                )}

                {/* FINAL BREAKDOWN SUMMARY */}
                <div className="rounded-2xl bg-slate-900 p-4 text-white text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Items Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Shipping Charge</span>
                    <span>₹{shipping.toFixed(2)}</span>
                  </div>
                  {paymentMethod === "COD" && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>COD Extra Handling Charge</span>
                      <span>+₹{codCharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-sm">
                    <span>Grand Total Payable</span>
                    <span className="text-emerald-400 text-base">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* ALL PAYMENT METHODS DISABLED WARNING */}
                {!paymentSettings.enableRazorpay && !paymentSettings.enableUpi && !paymentSettings.enableCard && !paymentSettings.enableCod && (
                  <div className="rounded-2xl bg-rose-50 p-5 text-center space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700">Payment Configuration Error</h4>
                    <p className="text-xs text-rose-600">
                      All payment methods are currently disabled by administration. Please contact support or try again later.
                    </p>
                  </div>
                )}

                {/* MODAL ACTIONS */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    onClick={() => setCheckoutStep(1)}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Back to Address
                  </button>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={
                      isSubmittingOrder ||
                      (!paymentSettings.enableRazorpay &&
                        !paymentSettings.enableUpi &&
                        !paymentSettings.enableCard &&
                        !paymentSettings.enableCod)
                    }
                    className={`rounded-xl px-6 py-3 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      paymentMethod === "Razorpay"
                        ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                        : paymentMethod === "COD"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isSubmittingOrder ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        {paymentMethod === "Razorpay" ? "Launching Razorpay Modal..." : "Creating Order..."}
                      </>
                    ) : (
                      <>
                        {paymentMethod === "Razorpay" ? <Zap size={16} className="fill-white" /> : <ShieldCheck size={16} />}
                        {paymentMethod === "Razorpay"
                          ? `Pay via Razorpay • ₹${grandTotal.toFixed(2)}`
                          : paymentMethod === "COD"
                          ? `Place Cash on Delivery Order • ₹${grandTotal.toFixed(2)}`
                          : `Confirm & Place Order • ₹${grandTotal.toFixed(2)}`}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: ORDER SUCCESS & CONFIRMATION */}
            {checkoutStep === 3 && placedOrder && (
              <div className="p-6 sm:p-8 text-center space-y-6">
                {/* HERO BADGE */}
                {placedOrder.paymentStatus === "Completed" || placedOrder.orderStatus === "Confirmed" ? (
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-in zoom-in duration-200">
                    <ShieldCheck size={44} />
                  </div>
                ) : (
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Clock size={40} />
                  </div>
                )}

                {/* HEADING & ORDER REF */}
                <div className="space-y-2">
                  <div className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold ${
                    placedOrder.paymentStatus === "Completed" || placedOrder.orderStatus === "Confirmed"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    <Sparkles size={13} />
                    {placedOrder.paymentStatus === "Completed" || placedOrder.orderStatus === "Confirmed"
                      ? "Payment Verified & Order Confirmed"
                      : "Order Placed & Awaiting Confirmation"}
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {placedOrder.paymentStatus === "Completed"
                      ? "Payment Successful!"
                      : "Order Submitted Successfully!"}
                  </h3>
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 pt-1">
                    <span>Order Reference:</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                      {placedOrder.orderId || placedOrder.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(placedOrder.orderId || placedOrder.id);
                        toast.success("Order Reference copied to clipboard!");
                      }}
                      className="text-slate-400 hover:text-blue-600 transition"
                      title="Copy Reference"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>

                {/* NOTICE CARD */}
                {placedOrder.paymentStatus === "Completed" || placedOrder.orderStatus === "Confirmed" ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-left max-w-lg mx-auto">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                        <Check size={18} />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                          Payment Verified Online
                        </h4>
                        <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                          Your online payment has been confirmed via Razorpay. Your order is now confirmed, stock reserved, and dispatch is being scheduled.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-amber-50/80 p-4 text-left max-w-lg mx-auto">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold">
                        <Clock size={18} />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                          Owner Confirmation Pending
                        </h4>
                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                          Your order has been submitted to the store owner. You will receive real-time notifications and status updates as your order is confirmed!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ORDER BREAKDOWN SUMMARY */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3.5 max-w-lg mx-auto text-left">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-medium text-slate-500">Fulfillment Status</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      placedOrder.orderStatus === "Confirmed" || placedOrder.orderStatus === "Completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {placedOrder.orderStatus === "Confirmed" ? <Check size={12} /> : <Clock size={12} />}
                      {placedOrder.orderStatus || "Awaiting Confirmation"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-medium text-slate-500">Payment Method</span>
                    <span className="font-bold text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                      {placedOrder.paymentMethod}
                    </span>
                  </div>
                  {placedOrder.paymentDetails?.razorpayPaymentId && (
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-xs font-medium text-slate-500">Razorpay Payment ID</span>
                      <span className="font-mono text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        {placedOrder.paymentDetails.razorpayPaymentId}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-medium text-slate-500">Payment Status</span>
                    <span className={`font-bold text-xs ${
                      placedOrder.paymentStatus === "Completed" ? "text-emerald-600 font-extrabold" : "text-slate-800"
                    }`}>
                      {placedOrder.paymentStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-xs font-bold text-slate-900">Total Amount</span>
                    <span className="text-xl font-extrabold text-emerald-600">
                      ₹{Number(placedOrder.totalAmount || placedOrder.total || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      navigate("/client/orders");
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition active:scale-98"
                  >
                    <Package size={16} />
                    View in My Orders
                    <ChevronRight size={15} />
                  </button>

                  <button
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      navigate("/client/shop");
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                  >
                    <ShoppingCart size={15} />
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* INLINE ADDRESS ADD / EDIT MODAL FOR CHECKOUT */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/35 backdrop-blur-md p-4 overflow-y-auto transition-all duration-300">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white/95 dark:bg-slate-900/95 dark:border-slate-800 p-6 shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 fade-in-0 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingAddress ? "Edit Address" : "Add New Delivery Address"}
              </h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCheckoutAddress} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Label</label>
                  <select
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-blue-500"
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    placeholder="Receiver's name"
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="10-digit mobile number"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Address Line *</label>
                <input
                  type="text"
                  required
                  value={addressForm.addressLine}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                  placeholder="Flat No, House Name, Street"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="City"
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    placeholder="State"
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                    placeholder="6-digit PIN code"
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={addressForm.landmark}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  placeholder="e.g. Near City Hospital"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="chkDefault" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Set as default delivery address
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
                >
                  {editingAddress ? "Save Changes" : "Add Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ADDRESS CONFIRMATION POPUP MODAL */}
      {deleteAddressTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
              <Trash2 size={24} />
            </div>

            <h3 className="text-center text-base font-bold text-slate-900">
              Delete Saved Address?
            </h3>
            <p className="mt-2 text-center text-xs text-slate-500 leading-relaxed">
              Are you sure you want to remove this delivery address?
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteAddressTargetId(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCheckoutAddress}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition"
              >
                Delete Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;