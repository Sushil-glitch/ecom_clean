/**
 * Standard Indian Rupee Currency Formatter
 * Complies with Indian numbering system (e.g. ₹1,899, ₹1,19,999)
 */
const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatPrice = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return "₹0";
  return inrFormatter.format(num);
};

export default formatPrice;
