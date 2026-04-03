import { Link, useLocation } from 'react-router'
import {
  DollarSign, Wallet, CreditCard, PiggyBank,
  Calendar, Settings, LogOut, X, User, Bell,
} from 'lucide-react'
import { useSignOut } from '@/app/hooks/useAuth'
import { ROUTES } from '@/app/config/routes'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { path: ROUTES.DASHBOARD,     icon: Wallet,    label: 'Dashboard' },
  { path: ROUTES.TRANSACTIONS,  icon: CreditCard, label: 'Transações' },
  { path: ROUTES.GOALS,         icon: PiggyBank,  label: 'Objetivos' },
  { path: ROUTES.PLANNING,      icon: Calendar,   label: 'Planejamento' },
]

const bottomItems = [
  { path: ROUTES.PROFILE,        icon: User,     label: 'Perfil' },
  { path: ROUTES.NOTIFICATIONS,  icon: Bell,     label: 'Notificações' },
  { path: ROUTES.SETTINGS,       icon: Settings, label: 'Configurações' },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const { mutate: signOut } = useSignOut()

  const isActive = (path: string) => location.pathname === path

  return (
    <aside
      className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}
    >
      <div className="p-6 flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between mb-8">
          <Link to={ROUTES.DASHBOARD} className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              FinControl
            </h1>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Nav principal */}
        <nav className="space-y-1 flex-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive(path)
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Nav inferior */}
        <div className="pt-6 border-t border-gray-200 space-y-1">
          {bottomItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive(path)
                  ? 'bg-gray-100 text-emerald-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </Link>
          ))}

          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
