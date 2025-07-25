import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, UserSettings, UserStore } from '@/types'

const defaultSettings: UserSettings = {
  fontSize: 16,
  theme: 'light',
  language: 'en',
  preferences: {
    autoSave: true,
    spellCheck: true,
    grammarCheck: true,
    aiSuggestions: true,
  },
}

const getUserStorageKey = (email?: string) => 
  email ? `penpad_user_${email}` : 'penpad_user_anonymous'

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      settings: defaultSettings,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user })
      },

      setSettings: (settings: Partial<UserSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...settings }
        }))
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading })
      },

      updateUser: (updates: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        }))
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          settings: defaultSettings,
        })
      },
    }),
    {
      name: getUserStorageKey(),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        settings: state.settings,
      }),
    }
  )
) 