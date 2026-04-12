import { supabase, getAuthUserId } from '@/app/lib/supabase'
import type { Profile, ProfileUpdate, UserSettingsUpdate } from '@/app/types'
import {
  AVATAR_BUCKET,
  AVATAR_MIME_TO_EXT,
  ALLOWED_AVATAR_MIME_TYPES,
  MAX_AVATAR_SIZE_MB,
} from '@/app/config/constants'

export const profileService = {
  async getProfile(): Promise<Profile> {
    const userId = getAuthUserId()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data
  },

  async updateProfile(updates: ProfileUpdate): Promise<Profile> {
    const userId = getAuthUserId()
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async uploadAvatar(file: File): Promise<string> {
    // Defesa em profundidade: revalida tipo e tamanho mesmo que a UI já tenha filtrado.
    if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.type as typeof ALLOWED_AVATAR_MIME_TYPES[number])) {
      throw new Error('Formato de imagem não suportado.')
    }
    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
      throw new Error(`Imagem excede o limite de ${MAX_AVATAR_SIZE_MB} MB.`)
    }

    const userId = getAuthUserId()
    // Extensão derivada do MIME, não do nome do arquivo.
    const ext = AVATAR_MIME_TO_EXT[file.type] ?? 'png'
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadError) throw uploadError

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
    // Cache bust
    const avatarUrl = `${data.publicUrl}?t=${Date.now()}`

    await profileService.updateProfile({ avatar_url: avatarUrl })
    return avatarUrl
  },

  async getSettings() {
    const userId = getAuthUserId()
    const { data, error } = await supabase
      .from('user_settings')
      .select('id, user_id, push_notifications, email_notifications, transaction_alerts, budget_alerts, goal_alerts, dark_mode, language, two_factor_enabled, created_at, updated_at')
      .eq('user_id', userId)
      .single()
    if (error) throw error
    return data
  },

  async updateSettings(updates: Omit<UserSettingsUpdate, 'two_factor_secret'>) {
    const userId = getAuthUserId()
    const { two_factor_secret: _, ...safeUpdates } = updates as UserSettingsUpdate
    const { data, error } = await supabase
      .from('user_settings')
      .update(safeUpdates)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
