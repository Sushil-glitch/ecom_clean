// Utility helper to handle real-time Cart count updates & localStorage interactions

export const getUserId = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return "guest";
    const userObj = JSON.parse(userStr);
    return userObj?.id || userObj?._id || userObj?.email || "guest";
  } catch {
    return "guest";
  }
};

export const getCartKey = () => `clientCart_${getUserId()}`;
export const getCartQuantitiesKey = () => `clientCartQuantities_${getUserId()}`;

export const getValidCart = () => {
  try {
    const cartKey = getCartKey();
    let rawCart = localStorage.getItem(cartKey);

    // Fallback/migration from un-namespaced legacy cart key
    if (!rawCart && cartKey === "clientCart_guest") {
      rawCart = localStorage.getItem("clientCart");
    }

    if (!rawCart) return [];
    const parsed = JSON.parse(rawCart);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(cartKey);
      return [];
    }
    const valid = parsed.filter(
      (id) => id !== null && id !== undefined && id !== "null" && id !== "undefined" && String(id).trim() !== ""
    );
    // Auto-clean localStorage if invalid items like null or undefined were stored
    if (valid.length !== parsed.length) {
      localStorage.setItem(cartKey, JSON.stringify(valid));
    }
    return valid;
  } catch {
    localStorage.removeItem(getCartKey());
    return [];
  }
};

export const getCartCount = () => {
  try {
    const validCart = getValidCart();
    if (validCart.length === 0) return 0;

    let savedQuantities = {};
    try {
      const qKey = getCartQuantitiesKey();
      let rawQ = localStorage.getItem(qKey);
      if (!rawQ && qKey === "clientCartQuantities_guest") {
        rawQ = localStorage.getItem("clientCartQuantities");
      }
      savedQuantities = JSON.parse(rawQ || "{}");
    } catch {
      savedQuantities = {};
    }

    return validCart.reduce((sum, id) => {
      const qty = Number(savedQuantities[id]) || 1;
      return sum + Math.max(1, qty);
    }, 0);
  } catch {
    return 0;
  }
};

export const dispatchCartEvent = () => {
  window.dispatchEvent(new Event("cartUpdated"));
};

export const clearCartStorage = () => {
  try {
    localStorage.removeItem(getCartKey());
    localStorage.removeItem(getCartQuantitiesKey());
    localStorage.removeItem("clientCart");
    localStorage.removeItem("clientCartQuantities");
  } catch (e) {
    console.error("Error clearing cart storage:", e);
  }
  dispatchCartEvent();
};

export const saveCart = (cartIds, quantities = null) => {
  try {
    const validCart = (cartIds || []).filter(
      (id) => id !== null && id !== undefined && id !== "null" && id !== "undefined" && String(id).trim() !== ""
    );
    const cartKey = getCartKey();
    localStorage.setItem(cartKey, JSON.stringify(validCart));
    if (quantities !== null) {
      localStorage.setItem(getCartQuantitiesKey(), JSON.stringify(quantities));
    }
  } catch (e) {
    console.error("Error saving cart:", e);
  }
  dispatchCartEvent();
};

export const getCartQuantities = () => {
  try {
    const qKey = getCartQuantitiesKey();
    let rawQ = localStorage.getItem(qKey);
    if (!rawQ && qKey === "clientCartQuantities_guest") {
      rawQ = localStorage.getItem("clientCartQuantities");
    }
    return JSON.parse(rawQ || "{}");
  } catch {
    return {};
  }
};

export const getProductQuantity = (productId) => {
  if (!productId) return 0;
  const validCart = getValidCart();
  if (!validCart.includes(productId)) return 0;
  const quantities = getCartQuantities();
  return Number(quantities[productId]) || 1;
};

export const updateProductQuantity = (productId, delta, maxStock = Infinity) => {
  if (!productId) return 0;
  const validCart = getValidCart();
  const quantities = getCartQuantities();

  const isCurrentlyInCart = validCart.includes(productId);
  const currentQty = isCurrentlyInCart ? (Number(quantities[productId]) || 1) : 0;
  const newQty = currentQty + delta;

  if (newQty <= 0) {
    const updatedCart = validCart.filter((id) => id !== productId);
    delete quantities[productId];
    saveCart(updatedCart, quantities);
    return 0;
  } else {
    const clampedQty = Math.min(newQty, maxStock > 0 ? maxStock : Infinity);
    const updatedCart = isCurrentlyInCart ? validCart : [...validCart, productId];
    quantities[productId] = clampedQty;
    saveCart(updatedCart, quantities);
    return clampedQty;
  }
};
