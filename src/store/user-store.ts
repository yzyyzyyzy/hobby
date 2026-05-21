import { create } from 'zustand'

interface UserInfo {
  id: string
  openid: string
  nickname: string
  avatar_url: string
  interest_tags: string[]
}

interface UserState {
  userInfo: UserInfo | null
  isLoggedIn: boolean
  setUserInfo: (info: UserInfo) => void
  clearUserInfo: () => void
  updateTags: (tags: string[]) => void
}

export const useUserStore = create<UserState>((set) => ({
  userInfo: null,
  isLoggedIn: false,
  setUserInfo: (info) => set({ userInfo: info, isLoggedIn: true }),
  clearUserInfo: () => set({ userInfo: null, isLoggedIn: false }),
  updateTags: (tags) =>
    set((state) => ({
      userInfo: state.userInfo ? { ...state.userInfo, interest_tags: tags } : null,
    })),
}))
