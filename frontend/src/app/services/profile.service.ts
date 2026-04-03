import { supabase, getAuthUserId } from '@/app/lib/supabase'
import type { Profile, ProfileUpdate, UserSettingsUpdate } from '@/app/types'
import { AVATAR_BUCKET } from '@/app/config/constants'

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
    const userId = getAuthUserId()
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { upsert: true })
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
      .select('*, two_factor_secret')  // two_factor_secret não será exposto via RLS
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
