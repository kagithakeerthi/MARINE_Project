import { create } from 'zustand';

interface Alert {
  id: string;
  type: 'debris' | 'ecosystem' | 'wave' | 'drift';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: { lat: number; lon: number };
  message: string;
  timestamp: string;
  read: boolean;
}

interface AlertStore {
  alerts: Alert[];
  unreadCount: number;
  addAlert: (alert: Alert) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: [],
  unreadCount: 0,
  
  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts],
      unreadCount: state.unreadCount + 1,
    })),
  
  markAsRead: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, read: true } : a
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  
  markAllAsRead: () =>
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, read: true })),
      unreadCount: 0,
    })),
  
  removeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
      unreadCount: state.alerts.find((a) => a.id === id && !a.read)
        ? state.unreadCount - 1
        : state.unreadCount,
    })),
  
  clearAlerts: () => set({ alerts: [], unreadCount: 0 }),
}));
