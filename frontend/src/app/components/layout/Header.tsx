import { Link, useLocation } from 'react-router'
import { Menu, Bell } from 'lucide-react'
import { useAuthStore } from '@/app/stores/auth.store'
import { useNotificationsStore } from '@/app/stores/notifications.store'
import { getInitials } from '@/app/utils/formatters'
import { ROUTES } from '@/app/config/routes'

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.DASHBOARD]:     'Dashboard',
  [ROUTES.TRANSACTIONS]:  'Transações',
  [ROUTES.GOALS]:         'Objetivos Financeiros',
  [ROUTES.PLANNING]:      'Planejamento',
  [ROUTES.PROFILE]:       'Meu Perfil',
  [ROUTES.NOTIFICATIONS]: 'Notificações',
  [ROUTES.SETTINGS]:      'Configurações',
}

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { profile } = useAuthStore()
  const { unreadCount } = useNotificationsStore()
  const location = useLocation()

  const title = PAGE_TITLES[location.pathname] ?? 'FinControl'
  const initials = getInitials(profile?.full_name ?? 'U')

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
              <p className="text-sm text-gray-500">
                {profile?.full_name ? `Bem-vindo, ${profile.full_name.split(' ')[0]}!` : 'Bem-vindo de volta!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.NOTIFICATIONS}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-6 h-6 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            <Link
              to={ROUTES.PROFILE}
              className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm hover:shadow-lg transition-shadow overflow-hidden"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
