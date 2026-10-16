import { useState, useEffect } from "react";
import axios from "axios";
import {
  Ticket,
  Plus,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  X,
  Percent,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api.js";
import { toast } from "../../utils/toast.js";

const API_URL = `${API_BASE_URL}/coupons`;

const emptyForm = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  minOrderAmount: "0",
  maxDiscountAmount: "0",
  expiryDate: "",
  usageLimit: "100",
  isActive: true,
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const token = localStorage.getItem("token");

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.coupons) {
        setCoupons(res.data.coupons);
      }
    } catch (err) {
      console.error("Fetch coupons error:", err);
      toast.error("Failed to load promo coupons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "percentage",
      discountValue: coupon.discountValue !== undefined ? coupon.discountValue : "",
      minOrderAmount: coupon.minOrderAmount !== undefined ? coupon.minOrderAmount : "0",
      maxDiscountAmount: coupon.maxDiscountAmount !== undefined ? coupon.maxDiscountAmount : "0",
      expiryDate: coupon.expiryDate ? coupon.expiryDate.split("T")[0] : "",
      usageLimit: coupon.usageLimit !== undefined ? coupon.usageLimit : "100",
      isActive: coupon.isActive !== undefined ? coupon.isActive : true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) return toast.error("Coupon code is required.");
    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      return toast.error("Discount value must be greater than 0.");
    }

    try {
      setSaving(true);
      if (editingCoupon) {
        await axios.put(`${API_URL}/admin/${editingCoupon._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success(`Coupon '${formData.code.toUpperCase()}' updated successfully!`);
      } else {
        await axios.post(`${API_URL}/admin`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success(`Coupon '${formData.code.toUpperCase()}' created successfully!`);
      }
      setShowModal(false);
      fetchCoupons();
    } catch (err) {
      console.error("Save coupon error:", err);
      toast.error(err.response?.data?.message || "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      const updated = !coupon.isActive;
      await axios.put(
        `${API_URL}/admin/${coupon._id}`,
        { isActive: updated },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Coupon '${coupon.code}' ${updated ? "activated" : "deactivated"}.`);
      setCoupons((prev) =>
        prev.map((c) => (c._id === coupon._id ? { ...c, isActive: updated } : c))
      );
    } catch (err) {
      console.error("Toggle coupon error:", err);
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await axios.delete(`${API_URL}/admin/${deleteConfirm._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Coupon '${deleteConfirm.code}' deleted.`);
      setCoupons((prev) => prev.filter((c) => c._id !== deleteConfirm._id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Delete coupon error:", err);
      toast.error("Failed to delete coupon.");
    }
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.isActive).length;
  const totalRedemptions = coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <Ticket size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                Coupons & Promo Campaigns
              </h1>
              <p className="text-xs text-slate-500">
                Create & manage promotional discount codes for client checkout
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition active:scale-95"
        >
          <Plus size={16} />
          <span>Create Promo Coupon</span>
        </button>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Ticket size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Campaigns</span>
            <h3 className="text-2xl font-extrabold text-slate-900">{totalCoupons}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">Active Coupons</span>
            <h3 className="text-2xl font-extrabold text-slate-900">{activeCoupons}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Client Redemptions</span>
            <h3 className="text-2xl font-extrabold text-slate-900">{totalRedemptions}</h3>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search promo codes by name or description..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-800 focus:border-blue-500 focus:outline-hidden shadow-2xs"
        />
      </div>

      {/* COUPONS TABLE */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            Loading promo campaigns...
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Coupon Codes Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Create your first promotional discount coupon code for your customers.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Promo Code</th>
                  <th className="px-6 py-4">Discount</th>
                  <th className="px-6 py-4">Min. Spend</th>
                  <th className="px-6 py-4">Usage / Redemptions</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCoupons.map((coupon) => {
                  const isExpired =
                    coupon.expiryDate && new Date(coupon.expiryDate) < new Date();

                  return (
                    <tr key={coupon._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="rounded-xl bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700 border border-blue-200 tracking-wider">
                            {coupon.code}
                          </span>
                        </div>
                        {coupon.description && (
                          <p className="mt-1 text-xs text-slate-500 font-normal">
                            {coupon.description}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4 font-extrabold text-slate-900">
                        {coupon.discountType === "percentage" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <Percent size={14} /> {coupon.discountValue}% OFF
                            {coupon.maxDiscountAmount > 0 && (
                              <span className="text-[10px] text-slate-400 font-normal block">
                                (Up to ₹{coupon.maxDiscountAmount})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-emerald-600">
                            ₹{coupon.discountValue} FLAT OFF
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {coupon.minOrderAmount > 0
                          ? `₹${coupon.minOrderAmount.toLocaleString("en-IN")}`
                          : "No minimum"}
                      </td>

                      <td className="px-6 py-4">
                        <div className="w-32">
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-slate-700">{coupon.usedCount} used</span>
                            <span className="text-slate-400">/ {coupon.usageLimit}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  ((coupon.usedCount || 0) / (coupon.usageLimit || 1)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-medium">
                        {coupon.expiryDate ? (
                          <span className={isExpired ? "text-rose-600 font-bold" : "text-slate-600"}>
                            {new Date(coupon.expiryDate).toLocaleDateString("en-IN")}
                            {isExpired && " (Expired)"}
                          </span>
                        ) : (
                          <span className="text-slate-400">Never</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(coupon)}
                          className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                            coupon.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {coupon.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition"
                            title="Edit Coupon"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(coupon)}
                            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Delete Coupon"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Ticket size={20} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingCoupon ? "Edit Promo Coupon" : "Create New Promo Coupon"}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Coupon Code (e.g. WELCOME10)
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SAVE20"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-extrabold uppercase text-blue-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. 20% discount on orders above ₹500"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Value ({formData.discountType === "percentage" ? "%" : "₹"})
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder={formData.discountType === "percentage" ? "e.g. 20" : "e.g. 100"}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Min Order Subtotal (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                {formData.discountType === "percentage" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      placeholder="0 = No Limit"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-bold text-slate-800">
                  Activate Coupon Code Immediately
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingCoupon ? "Update Coupon" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Delete Coupon?</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete coupon code <strong>{deleteConfirm.code}</strong>? Clients will no longer be able to use this code.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition"
              >
                Delete Coupon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
