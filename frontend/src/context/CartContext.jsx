import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Check, ArrowRight, X } from "lucide-react";
import {
  getValidCart,
  getCartCount,
  getCartQuantities,
  updateProductQuantity,
  saveCart,
  clearCartStorage,
  dispatchCartEvent,
} from "../utils/cartUtils.js";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartQuantities, setCartQuantities] = useState({});
  const [cartCount, setCartCount] = useState(0);

  // Modern Pop-up / Toast State
  const [toast, setToast] = useState({
    show: false,
    message: "",
    productName: "",
    qty: 1,
  });

  const syncCartState = useCallback(() => {
    try {
      const items = getValidCart();
      const quantities = getCartQuantities();
      const count = getCartCount();
      setCartItems(items);
      setCartQuantities(quantities);
      setCartCount(count);
    } catch (err) {
      console.error("Cart sync error:", err);
    }
  }, []);

  useEffect(() => {
    syncCartState();

    const handleUpdate = () => syncCartState();
    window.addEventListener("cartUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("cartUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [syncCartState]);

  // Show floating cart notification popup
  const showCartNotification = useCallback((message, productName = "", qty = 1) => {
    setToast({
      show: true,
      message,
      productName,
      qty,
    });
  }, []);

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  // Auto-dismiss popup after 3.5 seconds
  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(() => {
      closeToast();
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast.show, closeToast]);

  const updateQuantity = useCallback(
    (productId, delta, maxStock = Infinity, productName = "") => {
      const newQty = updateProductQuantity(productId, delta, maxStock);
      syncCartState();
      if (delta > 0 && newQty > 0) {
        showCartNotification("Updated in cart", productName, newQty);
      } else if (newQty === 0) {
        showCartNotification("Removed from cart", productName, 0);
      }
      return newQty;
    },
    [syncCartState, showCartNotification]
  );

  const addToCart = useCallback(
    (productId, quantity = 1, maxStock = Infinity, productName = "") => {
      const newQty = updateProductQuantity(productId, quantity, maxStock);
      syncCartState();
      showCartNotification("Added to cart", productName, newQty);
      return newQty;
    },
    [syncCartState, showCartNotification]
  );

  const removeFromCart = useCallback(
    (productId, productName = "") => {
      const valid = getValidCart().filter((id) => id !== productId);
      const q = { ...getCartQuantities() };
      delete q[productId];
      saveCart(valid, q);
      syncCartState();
      showCartNotification("Item removed from cart", productName, 0);
    },
    [syncCartState, showCartNotification]
  );

  const clearCart = useCallback(() => {
    clearCartStorage();
    syncCartState();
    showCartNotification("Cart has been cleared", "", 0);
  }, [syncCartState, showCartNotification]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartQuantities,
        cartCount,
        updateQuantity,
        addToCart,
        removeFromCart,
        clearCart,
        showCartNotification,
      }}
    >
      {children}

      {/* CLEAN FLOATING CART POPUP NOTIFICATION */}
      {toast.show && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[999] flex w-full max-w-sm items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Check size={20} className="stroke-[2.5]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">
                {toast.message}
              </p>
              {toast.productName && (
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {toast.productName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              onClick={closeToast}
              className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
            >
              <span>View Cart</span>
              <ArrowRight size={12} />
            </Link>
            <button
              type="button"
              onClick={closeToast}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Close notification"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    // Graceful fallback for components outside of CartProvider
    return {
      cartItems: getValidCart(),
      cartQuantities: getCartQuantities(),
      cartCount: getCartCount(),
      updateQuantity: updateProductQuantity,
      addToCart: updateProductQuantity,
      removeFromCart: () => {},
      clearCart: clearCartStorage,
      showCartNotification: () => {},
    };
  }
  return context;
};

export default CartContext;
