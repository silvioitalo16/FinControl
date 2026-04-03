import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { notificationsService } from '@/app/services/notifications.service'
import { useNotificationsStore } from '@/app/stores/notifications.store'
import { useAuthStore } from '@/app/stores/auth.store'
import { QUERY_KEYS } from '@/app/config/queryKeys'

export function useNotifications(onlyUnread = false) {
  return useQuery({
    queryKey: [...QUERY_KEYS.notifications(), { onlyUnread }],
    queryFn: () => notificationsService.getNotifications(onlyUnread),
  })
}

export function useUnreadCount() {
  const { setUnreadCount } = useNotificationsStore()
  const query = useQuery({
    queryKey: QUERY_KEYS.unreadCount(),
    queryFn: () => notificationsService.getUnreadCount(),
  })

  useEffect(() => {
    if (query.data !== undefined) {
      setUnreadCount(query.data)
    }
  }, [query.data, setUnreadCount])

  return query
}

// Listener de notificações em tempo real via Supabase Realtime
export function useNotificationsRealtime() {
  const { user } = useAuthStore()
  const { increment } = useNotificationsStore()
  const qc = useQueryClient()

  useEffect(() => {
    if (!user?.id) return

    const channel = notificationsService.subscribeToNotifications(user.id, (notification) => {
      increment()
      qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications() })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount() })

      // Toast visual por tipo
      if (notification.type === 'goal') {
        toast.success(notification.title, { description: notification.message })
      } else if (notification.type === 'alert' || notification.type === 'warning') {
        toast.warning(notification.title, { description: notification.message })
      } else {
        toast.info(notification.title, { description: notification.message })
      }
    })

    return () => { channel.unsubscribe() }
  }, [user?.id, increment, qc])
}

export function useMarkAsRead() {
  const qc = useQueryClient()
  const { decrement } = useNotificationsStore()

  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      decrement()
      qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications() })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount() })
    },
  })
}

export function useMarkAllAsRead() {
  const qc = useQueryClient()
  const { reset } = useNotificationsStore()

  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      reset()
      qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications() })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount() })
      toast.success('Todas as notificações marcadas como lidas.')
    },
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsService.deleteNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications() })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount() })
    },
  })
}
