// Global Toast Notification Utility

const listeners = new Set();

export const toast = {
  show: (message, type = "info", duration = 3500) => {
    if (!message) return;
    const newToast = {
      id: Date.now() + Math.random().toString(36).substring(2, 9),
      message,
      type,
      duration,
    };
    listeners.forEach((listener) => listener(newToast));
  },

  success: (message, duration = 3500) => {
    toast.show(message, "success", duration);
  },

  error: (message, duration = 3500) => {
    toast.show(message, "error", duration);
  },

  info: (message, duration = 3500) => {
    toast.show(message, "info", duration);
  },

  warning: (message, duration = 3500) => {
    toast.show(message, "warning", duration);
  },

  subscribe: (listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export default toast;
