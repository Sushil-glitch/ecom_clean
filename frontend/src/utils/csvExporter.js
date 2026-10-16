export const exportSalesToCSV = (orders = [], filename = "electrozone-sales-report.csv") => {
  if (!Array.isArray(orders) || orders.length === 0) {
    return false;
  }

  const headers = [
    "Order ID",
    "Order Date",
    "Customer Name",
    "Customer Contact",
    "Delivery Address",
    "Payment Method",
    "Payment Status",
    "Order Status",
    "Subtotal (₹)",
    "Discount (₹)",
    "Shipping (₹)",
    "COD Fee (₹)",
    "Grand Total (₹)",
    "Items Count",
    "Items Summary",
  ];

  const rows = orders.map((order) => {
    const orderId = order._id || order.id || order.orderId || "";
    const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN");
    const clientName = order.user?.name || order.clientInfo?.name || order.shippingInfo?.fullName || "Customer";
    const clientContact = order.user?.contact || order.clientInfo?.contact || order.shippingInfo?.phone || "";
    const address = (order.shippingInfo?.addressLine || order.clientInfo?.address || order.shippingAddress || "").replace(/,/g, " ");
    const paymentMethod = order.paymentMethod || "COD";
    const paymentStatus = order.paymentStatus || "Completed";
    const orderStatus = order.orderStatus || "Confirmed";

    const subtotal = Number(order.subtotal || order.totalAmount || order.total || 0);
    const discount = Number(order.discountAmount || order.discount || 0);
    const shipping = Number(order.shippingFee || 0);
    const codFee = Number(order.codCharge || 0);
    const grandTotal = Number(order.totalAmount || order.total || 0);

    const items = Array.isArray(order.items) ? order.items : [];
    const itemsCount = items.reduce((sum, i) => sum + Number(i.qty || i.quantity || 1), 0);
    const itemsSummary = items.map((i) => `${i.name} (x${i.qty || 1})`).join(" | ").replace(/,/g, " ");

    return [
      `"${orderId}"`,
      `"${orderDate}"`,
      `"${clientName}"`,
      `"${clientContact}"`,
      `"${address}"`,
      `"${paymentMethod}"`,
      `"${paymentStatus}"`,
      `"${orderStatus}"`,
      subtotal,
      discount,
      shipping,
      codFee,
      grandTotal,
      itemsCount,
      `"${itemsSummary}"`,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
};
