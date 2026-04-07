import { supabase } from '@/app/lib/supabase'

const API_URL = import.meta.env.VITE_API_URL ?? ''

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
}

async function getAuthHeaders(auth: boolean) {
  if (!auth) return {}

  const { data, error } = await supabase.auth.getSession()
  if (error) throw error

  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, options: ApiRequestOptions = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(await getAuthHeaders(Boolean(options.auth))),
  }

  const response = await fetch(`${API_URL}/api${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (response.status === 204) {
    return undefined as T
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message =
      typeof payload === 'string'
        ? payload
        : payload?.error?.message ?? payload?.error ?? 'Erro ao chamar a API.'

    throw new Error(message)
  }

  return payload as T
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
}
