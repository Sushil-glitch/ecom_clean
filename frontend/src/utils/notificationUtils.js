const STORAGE_KEY = "clientNotificationsList";

export const INITIAL_NOTIFICATIONS = [];

export const getNotifications = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to load notifications:", e);
  }
  return [];
};

export const notifySubscribers = () => {
  window.dispatchEvent(new Event("notificationsUpdated"));
};

export const addNotification = ({ title, message, type = "system" }) => {
  const current = getNotifications();
  const newNotif = {
    id: `n-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    message,
    time: "Just now",
    type,
    read: false,
    createdAt: new Date().toISOString(),
  };

  const updated = [newNotif, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  notifySubscribers();
  return newNotif;
};

export const markNotificationAsRead = (id) => {
  const current = getNotifications();
  const updated = current.map((n) =>
    n.id === id || n._id === id ? { ...n, read: true, isRead: true } : n
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  notifySubscribers();
  return updated;
};

export const markAllNotificationsAsRead = () => {
  const current = getNotifications();
  const updated = current.map((n) => ({ ...n, read: true, isRead: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  notifySubscribers();
  return updated;
};

export const deleteNotification = (id) => {
  const current = getNotifications();
  const updated = current.filter((n) => n.id !== id && n._id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  notifySubscribers();
  return updated;
};

export const clearAllNotifications = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  notifySubscribers();
  return [];
};
