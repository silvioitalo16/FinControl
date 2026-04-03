import { BellOff, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle2, Star } from 'lucide-react'
import { formatRelativeTime } from '@/app/utils/formatters'
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '@/app/hooks/useNotifications'
import type { Notification } from '@/app/types'

const TYPE_CONFIG: Record<string, { icon: React.ElementType; bg: string; iconColor: string }> = {
  success: { icon: CheckCircle2, bg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-100', iconColor: 'text-amber-600' },
  alert:   { icon: AlertTriangle, bg: 'bg-red-100',   iconColor: 'text-red-600' },
  info:    { icon: Info,          bg: 'bg-blue-100',   iconColor: 'text-blue-600' },
  goal:    { icon: Star,          bg: 'bg-purple-100', iconColor: 'text-purple-600' },
}

export default function Notifications() {
  const { data: notifications, isLoading } = useNotifications()
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const deleteNotification = useDeleteNotification()

  const unread = (notifications ?? []).filter((n) => !n.is_read)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">
            {unread.length > 0 ? `${unread.length} não lida${unread.length > 1 ? 's' : ''}` : 'Tudo em dia'}
          </p>
        </div>
        {unread.length > 0 && (
          <button
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : (notifications ?? []).length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-20">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BellOff className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">Nenhuma notificação ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(notifications as Notification[]).map((n) => {
            const config = TYPE_CONFIG[n.type ?? 'info'] ?? TYPE_CONFIG.info
            const Icon = config.icon

            return (
              <div
                key={n.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
                  !n.is_read ? 'border-emerald-100 bg-emerald-50/30' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${config.bg}`}>
                    <Icon className={`w-5 h-5 ${config.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm font-semibold ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {n.title}
                          {!n.is_read && (
                            <span className="ml-2 inline-block w-2 h-2 bg-emerald-500 rounded-full align-middle" />
                          )}
                        </p>
                        {n.message && <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>}
                        <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(n.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!n.is_read && (
                          <button
                            onClick={() => markAsRead.mutate(n.id)}
                            disabled={markAsRead.isPending}
                            className="p-1.5 hover:bg-emerald-50 rounded-lg text-gray-400 hover:text-emerald-600 transition-colors"
                            title="Marcar como lida"
                          >
                            <CheckCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification.mutate(n.id)}
                          disabled={deleteNotification.isPending}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
