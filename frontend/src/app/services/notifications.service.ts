import { supabase, getAuthUserId } from '@/app/lib/supabase'
import type { Notification } from '@/app/types'

export const notificationsService = {
  async getNotifications(onlyUnread = false): Promise<Notification[]> {
    const userId = getAuthUserId()
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (onlyUnread) query = query.eq('is_read', false)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  async getUnreadCount(): Promise<number> {
    const userId = getAuthUserId()
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    if (error) throw error
    return count ?? 0
  },

  async markAsRead(id: string): Promise<void> {
    const userId = getAuthUserId()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
  },

  async markAllAsRead(): Promise<void> {
    const userId = getAuthUserId()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    if (error) throw error
  },

  async deleteNotification(id: string): Promise<void> {
    const userId = getAuthUserId()
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
  },

  subscribeToNotifications(
    userId: string,
    onNew: (notification: Notification) => void
  ) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => onNew(payload.new as Notification)
      )
      .subscribe()
  },
}
