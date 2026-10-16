import { useEffect, useState } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Home,
  Building2,
  Phone,
  Loader2,
  Pencil,
  X,
} from "lucide-react";
import axios from "axios";
import { toast } from "../../utils/toast.js";
import { USER_API_URL } from "../../config/api.js";

// =====================================================
// INITIAL FORM DATA
// =====================================================

const initialFormData = {
  label: "Home",
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  isDefault: false,
};

// =====================================================
// ADDRESSES COMPONENT
// =====================================================

const Addresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [deleteTargetAddressId, setDeleteTargetAddressId] = useState(null);

  const [formData, setFormData] = useState(initialFormData);

  // =====================================================
  // AUTH HEADERS
  // =====================================================

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return {};
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // =====================================================
  // FETCH ADDRESSES
  // =====================================================

  const fetchAddresses = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setAddresses([]);
        return;
      }

      const response = await axios.get(
        `${USER_API_URL}/addresses`,
        getAuthHeaders()
      );

      if (
        response.data?.success &&
        Array.isArray(response.data.addresses)
      ) {
        setAddresses(response.data.addresses);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error(
        "Fetch addresses error:",
        error.response?.data || error.message
      );

      setAddresses([]);

      const status = error.response?.status;

      if (status === 401) {
        toast.error("Session expired. Please login again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchAddresses();
  }, []);

  // =====================================================
  // OPEN ADD MODAL
  // =====================================================

  const openAddModal = () => {
    setEditingAddressId(null);
    const hasHome = addresses.some((a) => a.label === "Home");

    setFormData({
      ...initialFormData,
      label: hasHome ? "Work" : "Home",
      isDefault: addresses.length === 0,
    });

    setShowForm(true);
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const openEditModal = (address) => {
    const addressId = address?._id || address?.id;

    if (!addressId) {
      toast.error("Invalid address.");
      return;
    }

    setEditingAddressId(addressId);

    setFormData({
      label: address.label || "Home",
      fullName: address.fullName || "",
      phone: address.phone || "",
      addressLine: address.addressLine || address.street || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || address.zip || "",
      landmark: address.landmark || "",
      isDefault: Boolean(address.isDefault),
    });

    setShowForm(true);
  };

  // =====================================================
  // CLOSE FORM
  // =====================================================

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingAddressId(null);
    setFormData(initialFormData);
  };

  // =====================================================
  // HANDLE INPUT
  // =====================================================

  const handleInputChange = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // =====================================================
  // SET DEFAULT ADDRESS
  // =====================================================

  const setDefault = async (addressId) => {
    if (!addressId || settingDefault) return;

    try {
      setSettingDefault(true);

      const response = await axios.put(
        `${USER_API_URL}/addresses/${addressId}/default`,
        {},
        getAuthHeaders()
      );

      if (response.data?.success) {
        toast.success("Default address updated!");
        await fetchAddresses();
      } else {
        toast.error(
          response.data?.message || "Failed to update default address."
        );
      }
    } catch (error) {
      console.error(
        "Set default address error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to update default address."
      );
    } finally {
      setSettingDefault(false);
    }
  };

  // =====================================================
  // DELETE ADDRESS - OPEN CONFIRMATION
  // =====================================================

  const deleteAddress = (addressId) => {
    if (!addressId) {
      toast.error("Invalid address.");
      return;
    }

    setDeleteTargetAddressId(addressId);
  };

  // =====================================================
  // CANCEL DELETE
  // =====================================================

  const cancelDelete = () => {
    if (deleting) return;

    setDeleteTargetAddressId(null);
  };

  // =====================================================
  // CONFIRM DELETE
  // =====================================================

  const confirmDeleteAddress = async () => {
    if (!deleteTargetAddressId || deleting) return;

    try {
      setDeleting(true);

      const response = await axios.delete(
        `${USER_API_URL}/addresses/${deleteTargetAddressId}`,
        getAuthHeaders()
      );

      if (response.data?.success) {
        toast.success("Address deleted successfully!");

        setDeleteTargetAddressId(null);

        await fetchAddresses();
      } else {
        toast.error(
          response.data?.message || "Failed to delete address."
        );
      }
    } catch (error) {
      console.error(
        "Delete address error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to delete address."
      );
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // VALIDATE FORM
  // =====================================================

  const validateForm = () => {
    const fullName = formData.fullName.trim();
    const phone = formData.phone.trim();
    const addressLine = formData.addressLine.trim();
    const city = formData.city.trim();
    const state = formData.state.trim();
    const pincode = formData.pincode.trim();
    const landmark = formData.landmark.trim();

    if (
      !fullName ||
      !phone ||
      !addressLine ||
      !city ||
      !state ||
      !pincode
    ) {
      toast.error("Please fill in all required fields.");
      return false;
    }

    if (!/^\d{10}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return false;
    }

    if (!/^\d{6}$/.test(pincode)) {
      toast.error("Please enter a valid 6-digit PIN code.");
      return false;
    }

    return {
      label: formData.label || "Home",
      fullName,
      phone,
      addressLine,
      city,
      state,
      pincode,
      landmark,
      isDefault: Boolean(formData.isDefault),
    };
  };

  // =====================================================
  // SAVE ADDRESS
  // =====================================================

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    const payload = validateForm();

    if (!payload) return;

    try {
      setSaving(true);

      let response;

      if (editingAddressId) {
        response = await axios.put(
          `${USER_API_URL}/addresses/${editingAddressId}`,
          payload,
          getAuthHeaders()
        );
      } else {
        response = await axios.post(
          `${USER_API_URL}/addresses`,
          payload,
          getAuthHeaders()
        );
      }

      if (response.data?.success) {
        toast.success(
          editingAddressId
            ? "Address updated successfully!"
            : "Address added successfully!"
        );

        setShowForm(false);
        setEditingAddressId(null);
        setFormData(initialFormData);

        await fetchAddresses();
      } else {
        toast.error(
          response.data?.message || "Failed to save address."
        );
      }
    } catch (error) {
      console.error(
        "Save address error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to save address."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Client Portal
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Saved Addresses
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your delivery and billing addresses for fast
            checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={17} />
          Add New Address
        </button>
      </div>

      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 shadow-sm">
          <Loader2
            size={32}
            className="animate-spin text-blue-600"
          />

          <p className="text-sm font-semibold text-slate-500">
            Loading saved addresses...
          </p>
        </div>
      ) : addresses.length === 0 ? (
        /* =================================================
           EMPTY STATE
        ================================================= */

        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <MapPin
            size={36}
            className="mx-auto text-slate-300"
          />

          <h3 className="mt-4 text-base font-semibold text-slate-800">
            No saved addresses
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            Add a delivery address to complete orders easily
            during checkout.
          </p>

          <button
            type="button"
            onClick={openAddModal}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={15} />
            Add Address
          </button>
        </div>
      ) : (
        /* =================================================
           ADDRESS CARDS
        ================================================= */

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {addresses.map((address) => {
            const addressId =
              address?._id || address?.id;

            const addressLine =
              address?.addressLine ||
              address?.street ||
              "";

            const pincode =
              address?.pincode ||
              address?.zip ||
              "";

            return (
              <div
                key={addressId}
                className={`relative flex flex-col justify-between rounded-2xl border p-6 shadow-sm transition ${
                  address?.isDefault
                    ? "border-blue-500 bg-blue-50/20 ring-2 ring-blue-100"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div>
                  {/* ADDRESS HEADER */}

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {address?.label === "Work" ? (
                        <Building2
                          size={18}
                          className="text-blue-600"
                        />
                      ) : (
                        <Home
                          size={18}
                          className="text-blue-600"
                        />
                      )}

                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                        {address?.label || "HOME"}
                      </span>
                    </div>

                    {address?.isDefault ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 size={13} />
                        Default
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={settingDefault}
                        onClick={() =>
                          setDefault(addressId)
                        }
                        className="text-xs font-semibold text-blue-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {settingDefault
                          ? "Updating..."
                          : "Set as Default"}
                      </button>
                    )}
                  </div>

                  {/* ADDRESS DETAILS */}

                  <div className="mt-4 space-y-1 text-sm text-slate-600">
                    <p className="font-bold text-slate-900">
                      {address?.fullName || "N/A"}
                    </p>

                    {address?.phone && (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Phone
                          size={13}
                          className="text-slate-400"
                        />

                        {address.phone}
                      </p>
                    )}

                    <p className="pt-1">
                      {addressLine}
                    </p>

                    <p>
                      {address?.city || ""}
                      {address?.city && address?.state
                        ? ", "
                        : ""}
                      {address?.state || ""}
                      {pincode ? ` - ${pincode}` : ""}
                    </p>

                    {address?.landmark && (
                      <p className="text-xs text-slate-400">
                        Landmark: {address.landmark}
                      </p>
                    )}
                  </div>
                </div>

                {/* ACTIONS */}

                <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      openEditModal(address)
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteAddress(addressId)
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingAddressId
                  ? "Edit Delivery Address"
                  : "Add New Delivery Address"}
              </h3>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleFormSubmit}
              className="mt-4 space-y-4"
            >
              {/* LABEL + NAME */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Label
                  </label>

                  <select
                    value={formData.label}
                    onChange={(event) =>
                      handleInputChange(
                        "label",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none transition focus:border-blue-500"
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Full Name *
                  </label>

                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(event) =>
                      handleInputChange(
                        "fullName",
                        event.target.value
                      )
                    }
                    placeholder="Receiver's name"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

              {/* PHONE */}

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Phone Number *
                </label>

                <input
                  type="tel"
                  required
                  maxLength={10}
                  inputMode="numeric"
                  value={formData.phone}
                  onChange={(event) =>
                    handleInputChange(
                      "phone",
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                    )
                  }
                  placeholder="10-digit mobile number"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none transition focus:border-blue-500"
                />
              </div>

              {/* ADDRESS */}

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Street Address / Address Line *
                </label>

                <input
                  type="text"
                  required
                  value={formData.addressLine}
                  onChange={(event) =>
                    handleInputChange(
                      "addressLine",
                      event.target.value
                    )
                  }
                  placeholder="Building, street name, house no."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none transition focus:border-blue-500"
                />
              </div>

              {/* CITY / STATE / PIN */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    City *
                  </label>

                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(event) =>
                      handleInputChange(
                        "city",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none transition focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    State *
                  </label>

                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(event) =>
                      handleInputChange(
                        "state",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none transition focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    PIN Code *
                  </label>

                  <input
                    type="text"
                    required
                    maxLength={6}
                    inputMode="numeric"
                    value={formData.pincode}
                    onChange={(event) =>
                      handleInputChange(
                        "pincode",
                        event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6)
                      )
                    }
                    placeholder="6-digit PIN"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

              {/* LANDMARK */}

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Landmark
                </label>

                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(event) =>
                    handleInputChange(
                      "landmark",
                      event.target.value
                    )
                  }
                  placeholder="Nearby landmark (optional)"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none transition focus:border-blue-500"
                />
              </div>

              {/* DEFAULT */}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="defaultAddress"
                  checked={formData.isDefault}
                  onChange={(event) =>
                    handleInputChange(
                      "isDefault",
                      event.target.checked
                    )
                  }
                  className="rounded border-slate-300"
                />

                <label
                  htmlFor="defaultAddress"
                  className="text-xs font-medium text-slate-600"
                >
                  Set as default delivery address
                </label>
              </div>

              {/* FORM ACTIONS */}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Saving..."
                    : editingAddressId
                    ? "Update Address"
                    : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          DELETE CONFIRMATION MODAL
      ================================================= */}

      {deleteTargetAddressId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Trash2 size={24} />
            </div>

            <h3 className="text-center text-base font-bold text-slate-900">
              Delete Saved Address?
            </h3>

            <p className="mt-2 text-center text-xs leading-relaxed text-slate-500">
              Are you sure you want to remove this delivery
              address?
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={cancelDelete}
                disabled={deleting}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteAddress}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting && (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                )}

                {deleting
                  ? "Deleting..."
                  : "Delete Address"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Addresses;
