import { Link } from 'react-router'
import { ROUTES } from '@/app/config/routes'

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="text-xl font-semibold">Página não encontrada</p>
      <p className="text-muted-foreground">A página que você está procurando não existe.</p>
      <Link
        to={ROUTES.DASHBOARD}
        className="mt-4 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        Voltar ao Dashboard
      </Link>
    </div>
  )
}
