import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { ROUTES } from '@/app/config/routes'
import { ProtectedRoute } from '@/app/components/shared/ProtectedRoute'
import { AppLayout } from '@/app/components/layout/AppLayout'

// Lazy loading — cada página é um chunk separado
const Login        = lazy(() => import('@/app/pages/auth/Login'))
const SignUp       = lazy(() => import('@/app/pages/auth/SignUp'))
const ForgotPassword = lazy(() => import('@/app/pages/auth/ForgotPassword'))
const ResetPassword  = lazy(() => import('@/app/pages/auth/ResetPassword'))
const Dashboard    = lazy(() => import('@/app/pages/Dashboard'))
const Transactions = lazy(() => import('@/app/pages/Transactions'))
const Goals        = lazy(() => import('@/app/pages/Goals'))
const Planning     = lazy(() => import('@/app/pages/Planning'))
const Profile      = lazy(() => import('@/app/pages/Profile'))
const Notifications= lazy(() => import('@/app/pages/Notifications'))
const Settings     = lazy(() => import('@/app/pages/Settings'))
const NotFound     = lazy(() => import('@/app/pages/NotFound'))

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  }>
    {children}
  </Suspense>
)

export const router = createBrowserRouter([
  // ── Rotas públicas ────────────────────────────────────────────────────────
  {
    path: ROUTES.LOGIN,
    element: <SuspenseWrapper><Login /></SuspenseWrapper>,
  },
  {
    path: ROUTES.SIGNUP,
    element: <SuspenseWrapper><SignUp /></SuspenseWrapper>,
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: <SuspenseWrapper><ForgotPassword /></SuspenseWrapper>,
  },
  {
    path: ROUTES.RESET_PASSWORD,
    element: <SuspenseWrapper><ResetPassword /></SuspenseWrapper>,
  },

  // ── Rotas protegidas ──────────────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: ROUTES.DASHBOARD,
            element: <SuspenseWrapper><Dashboard /></SuspenseWrapper>,
          },
          {
            path: ROUTES.TRANSACTIONS,
            element: <SuspenseWrapper><Transactions /></SuspenseWrapper>,
          },
          {
            path: ROUTES.GOALS,
            element: <SuspenseWrapper><Goals /></SuspenseWrapper>,
          },
          {
            path: ROUTES.PLANNING,
            element: <SuspenseWrapper><Planning /></SuspenseWrapper>,
          },
          {
            path: ROUTES.PROFILE,
            element: <SuspenseWrapper><Profile /></SuspenseWrapper>,
          },
          {
            path: ROUTES.NOTIFICATIONS,
            element: <SuspenseWrapper><Notifications /></SuspenseWrapper>,
          },
          {
            path: ROUTES.SETTINGS,
            element: <SuspenseWrapper><Settings /></SuspenseWrapper>,
          },
        ],
      },
    ],
  },

  // Redireciona /app para /dashboard
  { path: '/app', element: <Navigate to={ROUTES.DASHBOARD} replace /> },

  // 404
  { path: '*', element: <SuspenseWrapper><NotFound /></SuspenseWrapper> },
])
