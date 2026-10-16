/**
 * Loads the Razorpay checkout.js SDK dynamically if not already present
 * @returns {Promise<boolean>}
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay SDK script.");
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * Initializes and displays the Razorpay checkout modal
 * @param {Object} params
 * @param {Object} params.razorpayOrder - { id, amount, currency, keyId }
 * @param {Object} params.order - Our database order object { orderId, totalAmount }
 * @param {Object} params.shippingInfo - { name, email, contact }
 * @param {Function} params.onSuccess - Callback triggered on verified payment { razorpay_payment_id, razorpay_order_id, razorpay_signature }
 * @param {Function} params.onDismiss - Callback triggered if customer closes popup without paying
 * @param {Function} [params.onFailure] - Callback triggered if payment attempt fails
 */
export const launchRazorpayPayment = async ({
  razorpayOrder,
  order,
  shippingInfo = {},
  onSuccess,
  onDismiss,
  onFailure,
}) => {
  const isLoaded = await loadRazorpayScript();

  if (!isLoaded || !window.Razorpay) {
    throw new Error("Razorpay SDK could not be loaded. Please check your internet connection.");
  }

  const key =
    razorpayOrder?.keyId ||
    import.meta.env.VITE_RAZORPAY_KEY_ID ||
    "rzp_test_Tme4VxZXJJ9EhK";

  // Pick up active theme accent color dynamically
  let themeColor = "#2563eb";
  if (typeof window !== "undefined") {
    try {
      const computed = getComputedStyle(document.documentElement).getPropertyValue("--primary")?.trim();
      if (computed && computed.startsWith("#")) {
        themeColor = computed;
      }
    } catch (_) {}
  }

  const options = {
    key,
    amount: razorpayOrder?.amount,
    currency: razorpayOrder?.currency || "INR",
    name: "ElectroZone",
    description: `Order Payment #${order?.orderId || ""}`,
    image: "/favicon.png",
    order_id: razorpayOrder?.id,
    handler: function (response) {
      if (typeof onSuccess === "function") {
        onSuccess(response);
      }
    },
    prefill: {
      name: shippingInfo.name || "",
      email: shippingInfo.email || "",
      contact: (shippingInfo.contact || "").replace(/[^0-9]/g, ""),
    },
    notes: {
      orderId: order?.orderId || "",
    },
    theme: {
      color: themeColor,
    },
    modal: {
      ondismiss: function () {
        if (typeof onDismiss === "function") {
          onDismiss();
        }
      },
    },
  };

  const razorpayInstance = new window.Razorpay(options);
  razorpayInstance.on("payment.failed", function (response) {
    console.error("Razorpay Payment Failed:", response.error);
    if (typeof onFailure === "function") {
      onFailure(response.error);
    }
  });
  razorpayInstance.open();
  return razorpayInstance;
};
