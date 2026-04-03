import { RouterProvider } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { router } from './routes'
import { queryClient } from './lib/queryClient'
import { useAuthListener } from './hooks/useAuth'

function AuthListenerSetup() {
  useAuthListener()
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthListenerSetup />
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4000}
      />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
