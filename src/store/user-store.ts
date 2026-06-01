import { create } from 'zustand'
import Taro from '@tarojs/taro'

interface UserInfo {
  id: string
  openid: string
  nickname: string
  avatar_url: string
  interest_tags: string[]
  role?: string
}

interface UserState {
  userInfo: UserInfo | null
  isLoggedIn: boolean
  setUserInfo: (info: UserInfo) => void
  clearUserInfo: () => void
  updateTags: (tags: string[]) => void
}

const STORAGE_KEY = 'hobby_user_info'

const loadStoredUser = (): UserInfo | null => {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

const storedUser = loadStoredUser()

export const useUserStore = create<UserState>((set) => ({
  userInfo: storedUser,
  isLoggedIn: !!storedUser,
  setUserInfo: (info) => {
    try { Taro.setStorageSync(STORAGE_KEY, JSON.stringify(info)) } catch {}
    Taro.setStorageSync('user_id', info.id)
    set({ userInfo: info, isLoggedIn: true })
  },
  clearUserInfo: () => {
    try { Taro.removeStorageSync(STORAGE_KEY) } catch {}
    Taro.removeStorageSync('user_id')
    set({ userInfo: null, isLoggedIn: false })
  },
  updateTags: (tags) =>
    set((state) => {
      const updated = state.userInfo ? { ...state.userInfo, interest_tags: tags } : null
      if (updated) { try { Taro.setStorageSync(STORAGE_KEY, JSON.stringify(updated)) } catch {} }
      return { userInfo: updated }
    }),
}))
