// Utility helper to handle real-time Wishlist count updates & localStorage interactions

export const getUserId = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    const userObj = JSON.parse(userStr);
    return userObj?.id || userObj?._id || userObj?.email || null;
  } catch {
    return null;
  }
};

export const getWishlistKey = () => {
  const uId = getUserId();
  return uId ? `clientWishlist_${uId}` : null;
};

export const getValidWishlist = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return [];

    const wKey = getWishlistKey();
    let raw = wKey ? localStorage.getItem(wKey) : null;

    // Fallback/migration from un-namespaced legacy wishlist key
    if (!raw) {
      raw = localStorage.getItem("clientWishlist");
    }

    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (id) => id !== null && id !== undefined && id !== "null" && id !== "undefined" && String(id).trim() !== ""
    );
  } catch {
    return [];
  }
};

export const getWishlistCount = () => {
  const token = localStorage.getItem("token");
  if (!token) return 0;
  return getValidWishlist().length;
};

export const dispatchWishlistEvent = () => {
  window.dispatchEvent(new Event("wishlistUpdated"));
};
