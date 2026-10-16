import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Trash2,
  CheckCheck,
  Truck,
  XCircle,
  ShoppingBag,
  AlertTriangle,
  Clock,
} from "lucide-react";
import axios from "axios";
import { NOTIFICATION_API_URL } from "../../config/api.js";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../../utils/notificationUtils";

const formatTime = (createdAt, timeFallback) => {
  if (!createdAt) return timeFallback || "Just now";
  const date = new Date(createdAt);
  if (isNaN(date.getTime())) return timeFallback || "Just now";

  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getVisuals = (n) => {
  const title = (n.title || "").toLowerCase();
  const msg = (n.message || "").toLowerCase();
  const type = (n.type || "").toLowerCase();
  const fullText = `${title} ${msg} ${type}`;

  // 1. Rejected / Cancelled / Failed -> Red Mark Icon Badge
  if (
    fullText.includes("reject") ||
    fullText.includes("cancel") ||
    fullText.includes("fail") ||
    fullText.includes("decline") ||
    fullText.includes("denied")
  ) {
    return { icon: XCircle, bg: "bg-rose-50 text-rose-600 border-rose-200" };
  }

  // 2. Processed / Confirmed / Delivered / Accepted / Placed / Success -> Green Go Icon Badge
  if (
    fullText.includes("confirm") ||
    fullText.includes("process") ||
    fullText.includes("success") ||
    fullText.includes("delivered") ||
    fullText.includes("accept") ||
    fullText.includes("placed") ||
    fullText.includes("completed")
  ) {
    return { icon: CheckCircle2, bg: "bg-emerald-50 text-emerald-600 border-emerald-200" };
  }

  // 3. Shipped / Out for Delivery / Transit / Picked Up -> Blue Truck Badge
  if (
    fullText.includes("ship") ||
    fullText.includes("transit") ||
    fullText.includes("out for delivery") ||
    fullText.includes("picked up") ||
    fullText.includes("dispatch")
  ) {
    return { icon: Truck, bg: "bg-blue-50 text-blue-600 border-blue-200" };
  }

  // 4. Pending / Awaiting -> Amber Clock Badge
  if (fullText.includes("pending") || fullText.includes("await")) {
    return { icon: Clock, bg: "bg-amber-50 text-amber-600 border-amber-200" };
  }

  // 5. Security -> Purple Shield
  if (type === "security" || fullText.includes("security")) {
    return { icon: ShieldAlert, bg: "bg-purple-50 text-purple-600 border-purple-200" };
  }

  // 6. Promo / Rewards / Quests -> Gold Sparkles
  if (type === "promo" || fullText.includes("reward") || fullText.includes("bonus") || fullText.includes("quest")) {
    return { icon: Sparkles, bg: "bg-amber-50 text-amber-600 border-amber-200" };
  }

  return { icon: ShoppingBag, bg: "bg-indigo-50 text-indigo-600 border-indigo-200" };
};

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showClearModal, setShowClearModal] = useState(false);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const res = await axios.get(NOTIFICATION_API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success && Array.isArray(res.data.notifications)) {
          setNotifications(res.data.notifications);
          return;
        }
      }
    } catch (e) {
      console.log("Notification API fetch note:", e.message);
    }
    setNotifications(getNotifications());
  };

  useEffect(() => {
    loadNotifications();

    const handleUpdate = () => {
      loadNotifications();
    };

    window.addEventListener("notificationsUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("notificationsUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const handleCardClick = async (notifObj) => {
    const id = notifObj._id || notifObj.id;
    if (!notifObj.isRead && !notifObj.read) {
      await handleMarkAsRead(id, notifObj);
    }

    const token = localStorage.getItem("token");
    let role = "client";
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        role = decoded.role || "client";
      } catch (e) {}
    }

    if (role === "admin") navigate("/admin/orders");
    else if (role === "delivery") navigate("/delivery/orders");
    else navigate("/client/orders");
  };

  const handleMarkAsRead = async (id, notifObj) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true, read: true } : n))
    );

    try {
      const token = localStorage.getItem("token");
      if (token && notifObj?._id) {
        await axios.patch(
          `${NOTIFICATION_API_URL}/${notifObj._id}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (e) {
      console.error(e);
    }
    markNotificationAsRead(id);
    window.dispatchEvent(new Event("notificationsUpdated"));
    loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, read: true }))
    );

    try {
      const token = localStorage.getItem("token");
      if (token) {
        await axios.patch(
          `${NOTIFICATION_API_URL}/read-all`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (e) {
      console.error(e);
    }
    markAllNotificationsAsRead();
    window.dispatchEvent(new Event("notificationsUpdated"));
    loadNotifications();
  };

  const handleDelete = (id) => {
    const updated = deleteNotification(id);
    setNotifications(updated);
    window.dispatchEvent(new Event("notificationsUpdated"));
  };

  const confirmClearAll = async () => {
    setShowClearModal(false);
    setNotifications([]);

    try {
      const token = localStorage.getItem("token");
      if (token) {
        await axios.delete(`${NOTIFICATION_API_URL}/clear`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) {
      console.error(e);
    }
    clearAllNotifications();
    window.dispatchEvent(new Event("notificationsUpdated"));
    loadNotifications();
  };

  const filteredNotifications = notifications.filter((n) => {
    const isRead = n.isRead || n.read;
    if (filter === "unread") return !isRead;
    if (filter === "read") return isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead && !n.read).length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Client Portal</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Notifications Center
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Stay updated with your real-time account activity and order updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <CheckCheck size={16} className="text-blue-600" />
              Mark all as read ({unreadCount})
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={() => setShowClearModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
            >
              <Trash2 size={15} />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {["all", "unread", "read"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-xl px-4 py-1.5 text-xs font-semibold capitalize transition ${
              filter === t
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t} {t === "unread" && unreadCount > 0 ? `(${unreadCount})` : ""}
          </button>
        ))}
      </div>

      {/* NOTIFICATIONS LIST */}
      {filteredNotifications.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Bell size={36} className="mx-auto text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-800">No notifications</h3>
          <p className="mt-1 text-xs text-slate-400">
            You are all caught up! New alerts will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n, idx) => {
            const isRead = n.isRead || n.read;
            const visual = getVisuals(n);
            const Icon = visual.icon;

            return (
              <div
                key={n._id || n.id || idx}
                onClick={() => handleCardClick(n)}
                className={`flex items-start gap-4 rounded-2xl border p-4 transition cursor-pointer hover:shadow-md ${
                  isRead
                    ? "border-slate-200 bg-white hover:border-blue-200"
                    : "border-blue-200 bg-blue-50/50 shadow-sm hover:bg-blue-50"
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${visual.bg}`}>
                  <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-bold ${isRead ? "text-slate-800" : "text-blue-950"}`}>{n.title}</h4>
                    <span className="text-xs text-slate-400 font-medium">{formatTime(n.createdAt, n.time)}</span>
                  </div>

                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{n.message}</p>
                </div>

                <div className="flex items-center gap-2">
                  {!isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(n._id || n.id, n);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition"
                      title="Mark as read"
                    >
                      <CheckCircle2 size={17} />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(n._id || n.id);
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CLEAR ALL CONFIRMATION POPUP MODAL */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-center text-base font-bold text-slate-900">
              Clear All Notifications?
            </h3>
            <p className="mt-2 text-center text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete all notifications? This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearAll}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
