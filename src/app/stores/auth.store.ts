import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import type { Tables } from '@/app/types/database.types'

type Profile = Tables<'profiles'>

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean

  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),

  reset: () => set({
    user: null,
    session: null,
    profile: null,
    isLoading: false,
    isAuthenticated: false,
  }),
}))
