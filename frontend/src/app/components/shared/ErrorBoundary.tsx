import { Component, type ReactNode } from 'react'
import { logger } from '@/app/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    logger.error('[ErrorBoundary] Erro de renderização', {
      message: error.message,
      stack:   error.stack,
    })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-lg font-semibold text-destructive">Algo deu errado</p>
          <p className="text-sm text-muted-foreground">
            {this.state.error?.message ?? 'Erro inesperado.'}
          </p>
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm text-white"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Tentar novamente
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
