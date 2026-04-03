import { create } from 'zustand'

interface NotificationsState {
  unreadCount: number
  setUnreadCount: (count: number) => void
  increment: () => void
  decrement: () => void
  reset: () => void
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  increment: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  decrement: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  reset: () => set({ unreadCount: 0 }),
}))
