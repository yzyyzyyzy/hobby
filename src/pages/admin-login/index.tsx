import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { ShieldCheck } from 'lucide-react-taro'
import { useUserStore } from '@/store/user-store'

export default function AdminLogin() {
  const { setUserInfo } = useUserStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Taro.showToast({ title: '请输入账号密码', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/admin/login',
        method: 'POST',
        data: { username: username.trim(), password: password.trim() },
      })
      console.log('Admin login response:', res.data)
      if (res.data?.data) {
        const adminUser = res.data.data
        setUserInfo({
          id: adminUser.id,
          openid: adminUser.openid || '',
          nickname: adminUser.nickname,
          avatar_url: adminUser.avatar_url || '',
          interest_tags: [],
          role: adminUser.role,
        })
        Taro.setStorageSync('userInfo', JSON.stringify({
          id: adminUser.id,
          nickname: adminUser.nickname,
          avatar_url: adminUser.avatar_url,
          role: adminUser.role,
        }))
        Taro.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => {
          Taro.redirectTo({ url: '/pages/admin/index' })
        }, 500)
      } else {
        Taro.showToast({ title: res.data?.msg || '登录失败', icon: 'none' })
      }
    } catch (err) {
      console.error('Admin login failed:', err)
      Taro.showToast({ title: '登录失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-full bg-neutral-50 flex flex-col items-center justify-center px-8">
      <View className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
        <ShieldCheck size={40} color="#F97316" />
      </View>
      <Text className="block text-xl font-bold text-neutral-900 mb-1">Hobby 管理后台</Text>
      <Text className="block text-sm text-neutral-400 mb-8">请使用管理员账号登录</Text>

      <View className="w-full max-w-sm space-y-4">
        <View className="bg-white rounded-xl px-4 py-3 border border-neutral-200">
          <Input
            placeholder="管理员账号"
            value={username}
            onInput={(e) => setUsername(e.detail.value)}
          />
        </View>
        <View className="bg-white rounded-xl px-4 py-3 border border-neutral-200">
          <Input
            placeholder="管理员密码"
            password
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>
        <Button
          className="w-full bg-orange-500 text-white rounded-xl py-3"
          onClick={handleLogin}
          disabled={loading}
        >
          <Text className="text-white font-medium">{loading ? '登录中...' : '登录'}</Text>
        </Button>
      </View>

      <View className="mt-8 px-4">
        <Text className="block text-xs text-neutral-400 text-center">
          仅限管理员访问 · 账号: admin / 密码: hobby2025
        </Text>
      </View>
    </View>
  )
}
