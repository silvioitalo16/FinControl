import { supabase } from '@/app/lib/supabase'
import { apiClient } from '@/app/lib/api'
import { logger } from '@/app/lib/logger'
import type { LoginInput, SignUpInput } from '@/app/validators/auth.schema'

export const authService = {
  async signIn({ email, password }: LoginInput) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signUp({ email, password, full_name }: SignUpInput) {
    await apiClient.post('/auth/sign-up', {
      email,
      password,
      full_name,
    })
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async sendPasswordResetEmail(email: string) {
    await apiClient.post('/auth/forgot-password', { email })
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error

    try {
      await apiClient.post('/auth/password-changed', undefined, { auth: true })
    } catch (notificationError) {
      logger.warn('Senha alterada, mas o email de notificação falhou.', {
        message: String(notificationError),
      })
    }
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data.user
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
