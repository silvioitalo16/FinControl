import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { profileService } from '@/app/services/profile.service'
import { authService } from '@/app/services/auth.service'
import { useAuthStore } from '@/app/stores/auth.store'
import { QUERY_KEYS } from '@/app/config/queryKeys'
import type { ProfileInput } from '@/app/validators/profile.schema'
import type { UserSettingsUpdate } from '@/app/types'

export function useProfile() {
  const { isAuthenticated } = useAuthStore()
  return useQuery({
    queryKey: QUERY_KEYS.profile(),
    queryFn: () => profileService.getProfile(),
    enabled: isAuthenticated,
  })
}

export function useSettings() {
  const { isAuthenticated } = useAuthStore()
  return useQuery({
    queryKey: QUERY_KEYS.settings(),
    queryFn: () => profileService.getSettings(),
    enabled: isAuthenticated,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  const { setProfile } = useAuthStore()

  return useMutation({
    mutationFn: (input: ProfileInput) => profileService.updateProfile(input),
    onSuccess: (profile) => {
      setProfile(profile)
      qc.invalidateQueries({ queryKey: QUERY_KEYS.profile() })
      toast.success('Perfil atualizado.')
    },
  })
}

export function useUploadAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => profileService.uploadAvatar(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.profile() })
      toast.success('Foto atualizada.')
    },
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (updates: Omit<UserSettingsUpdate, 'two_factor_secret'>) => profileService.updateSettings(updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.settings() })
      toast.success('Configurações salvas.')
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (newPassword: string) => authService.updatePassword(newPassword),
    onSuccess: () => {
      toast.success('Senha alterada com sucesso.')
    },
  })
}
