import { useState, useEffect } from "react";
import {
  Bell,
  Trash2,
  ShoppingBag,
  ShieldAlert,
  CheckCircle2,
  X,
  Truck,
  XCircle,
  Sparkles,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { NOTIFICATION_API_URL } from "../config/api.js";
import {
  getNotifications,
  markAllNotificationsAsRead,
  clearAllNotifications,
  markNotificationAsRead,
} from "../utils/notificationUtils";

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

  // 1. Rejected / Cancelled / Failed -> Red Mark Icon
  if (
    fullText.includes("reject") ||
    fullText.includes("cancel") ||
    fullText.includes("fail") ||
    fullText.includes("decline") ||
    fullText.includes("denied")
  ) {
    return { icon: XCircle, bg: "bg-rose-500 text-white shadow-xs shadow-rose-500/30", text: "text-rose-600" };
  }

  // 2. Processed / Confirmed / Delivered / Accepted / Placed / Success -> Green Mark Icon
  if (
    fullText.includes("confirm") ||
    fullText.includes("process") ||
    fullText.includes("success") ||
    fullText.includes("delivered") ||
    fullText.includes("accept") ||
    fullText.includes("placed") ||
    fullText.includes("completed")
  ) {
    return { icon: CheckCircle2, bg: "bg-emerald-500 text-white shadow-xs shadow-emerald-500/30", text: "text-emerald-600" };
  }

  // 3. Shipped / Out for Delivery / Transit / Picked Up -> Blue Truck Icon
  if (
    fullText.includes("ship") ||
    fullText.includes("transit") ||
    fullText.includes("out for delivery") ||
    fullText.includes("picked up") ||
    fullText.includes("dispatch")
  ) {
    return { icon: Truck, bg: "bg-blue-600 text-white shadow-xs shadow-blue-500/30", text: "text-blue-600" };
  }

  // 4. Pending / Awaiting -> Amber Clock Icon
  if (fullText.includes("pending") || fullText.includes("await")) {
    return { icon: Clock, bg: "bg-amber-500 text-white shadow-xs shadow-amber-500/30", text: "text-amber-600" };
  }

  // 5. Security -> Purple Shield
  if (type === "security" || fullText.includes("security")) {
    return { icon: ShieldAlert, bg: "bg-purple-600 text-white shadow-xs shadow-purple-500/30", text: "text-purple-600" };
  }

  // 6. Promo / Rewards / Quests -> Gold Sparkles
  if (type === "promo" || fullText.includes("reward") || fullText.includes("bonus") || fullText.includes("quest")) {
    return { icon: Sparkles, bg: "bg-amber-600 text-white shadow-xs shadow-amber-500/30", text: "text-amber-600" };
  }

  return { icon: ShoppingBag, bg: "bg-indigo-600 text-white shadow-xs shadow-indigo-500/30", text: "text-indigo-600" };
};

const NotificationBell = ({ role = "client" }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const res = await axios.get(NOTIFICATION_API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success && Array.isArray(res.data.notifications)) {
        const list = res.data.notifications;
        const unread = list.filter((n) => !n.isRead && !n.read).length;
        setNotifications(list);
        setUnreadCount(unread);
        return;
      }
    } catch (err) {
      console.log("Notification API fetch fallback:", err.message);
    }

    const local = getNotifications();
    setNotifications(local);
    setUnreadCount(local.filter((n) => !n.read && !n.isRead).length);
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 4000);
    window.addEventListener("notificationsUpdated", fetchNotifications);
    window.addEventListener("userUpdated", fetchNotifications);
    window.addEventListener("storage", fetchNotifications);

    return () => {
      clearInterval(interval);
      window.removeEventListener("notificationsUpdated", fetchNotifications);
      window.removeEventListener("userUpdated", fetchNotifications);
      window.removeEventListener("storage", fetchNotifications);
    };
  }, []);

  const handleMarkAllRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, read: true }))
    );
    setUnreadCount(0);
    markAllNotificationsAsRead();

    try {
      const token = localStorage.getItem("token");
      if (token) {
        await axios.patch(
          `${NOTIFICATION_API_URL}/read-all`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (err) {
      console.error(err);
    }
    fetchNotifications();
  };

  const confirmClearAll = async () => {
    setShowClearModal(false);
    setNotifications([]);
    setUnreadCount(0);
    clearAllNotifications();

    try {
      const token = localStorage.getItem("token");
      if (token) {
        await axios.delete(`${NOTIFICATION_API_URL}/clear`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error(err);
    }
    fetchNotifications();
  };

  const handleItemClick = async (notif) => {
    const notifId = notif._id || notif.id;

    setNotifications((prev) =>
      prev.map((n) =>
        n._id === notifId || n.id === notifId
          ? { ...n, isRead: true, read: true }
          : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    if (notifId) {
      markNotificationAsRead(notifId);
    }

    try {
      const token = localStorage.getItem("token");
      if (token && notif._id) {
        await axios.patch(
          `${NOTIFICATION_API_URL}/${notif._id}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (err) {
      console.error(err);
    }

    fetchNotifications();
    setOpen(false);

    if (role === "admin") {
      navigate("/admin/orders");
    } else if (role === "delivery") {
      navigate("/delivery/orders");
    } else {
      navigate("/client/orders");
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const token = localStorage.getItem("token");
          if (!token) {
            navigate("/login");
            return;
          }
          setOpen((prev) => !prev);
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        title="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30 bg-transparent cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-11 z-40 w-[calc(100vw-2.5rem)] max-w-sm sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* TOP HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 p-4">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition px-2 py-1 rounded hover:bg-blue-50"
                      title="Mark all as read"
                    >
                      Read all
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearModal(true)}
                      className="text-slate-400 hover:text-rose-600 transition p-1 rounded hover:bg-rose-50"
                      title="Clear all notifications"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-slate-400 hover:text-slate-700 transition p-1 rounded"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* LIST */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-500">No notifications yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Updates on orders will appear here.</p>
                </div>
              ) : (
                notifications.map((n, i) => {
                  const isRead = n.isRead || n.read;
                  const visual = getVisuals(n);
                  const Icon = visual.icon;

                  return (
                    <div
                      key={n._id || n.id || i}
                      onClick={() => handleItemClick(n)}
                      className={`p-3.5 transition cursor-pointer flex gap-3 items-start ${
                        isRead ? "bg-white hover:bg-slate-50" : "bg-blue-50/40 hover:bg-blue-50/70"
                      }`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white ${visual.bg}`}>
                        <Icon size={15} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-bold truncate ${isRead ? "text-slate-800" : "text-blue-950"}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2 font-medium">
                            {formatTime(n.createdAt, n.time)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-snug line-clamp-2">
                          {n.message}
                        </p>
                      </div>

                      {!isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* FOOTER */}
            <div className="border-t border-slate-100 bg-slate-50 p-2.5 text-center">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate(role === "admin" ? "/admin/orders" : "/client/orders");
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
              >
                View All Orders & Details →
              </button>
            </div>
          </div>
        </>
      )}

      {/* CLEAR ALL CONFIRMATION POPUP MODAL */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
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

export default NotificationBell;
