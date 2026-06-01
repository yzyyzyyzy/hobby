import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/user-store'
import { Network } from '@/network'

export default function Login() {
  const setUserInfo = useUserStore((s) => s.setUserInfo)

  const handleWechatLogin = async () => {
    try {
      const { code } = await Taro.login()
      console.log('Login code:', code)

      const isMiniApp = (Taro.getEnv() === Taro.ENV_TYPE.WEAPP || Taro.getEnv() === Taro.ENV_TYPE.TT)
      let nickname = 'Hobby用户'
      let avatarUrl = ''

      if (isMiniApp) {
        try {
          const userProfile = await Taro.getUserProfile({ desc: '用于完善个人资料' })
          nickname = userProfile.userInfo.nickName
          avatarUrl = userProfile.userInfo.avatarUrl
        } catch {
          // 用户拒绝授权头像昵称，使用默认值
        }
      }

      const res = await Network.request({
        url: '/api/auth/login',
        method: 'POST',
        data: { code, nickname, avatar_url: avatarUrl },
      })

      console.log('Login response:', res.data)
      const userData = res.data?.data
      if (userData) {
        setUserInfo({
          id: userData.id,
          openid: userData.openid,
          nickname: userData.nickname || nickname,
          avatar_url: userData.avatar_url || avatarUrl,
          interest_tags: userData.interest_tags || [],
        })
        Taro.switchTab({ url: '/pages/square/index' })
      }
    } catch (err) {
      console.error('Login failed:', err)
      Taro.showToast({ title: '登录失败，请重试', icon: 'none' })
    }
  }

  return (
    <View className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg, #FFF7ED 0%, #FFFFFF 50%)' }}>
      <View className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Brand */}
        <View className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', boxShadow: '0 8px 24px rgba(249,115,22,0.3)' }}>
          <Text className="text-white text-3xl font-black">H</Text>
        </View>
        <Text className="block text-3xl font-black text-neutral-900 tracking-tight">Hobby</Text>
        <Text className="block text-base text-neutral-400 mt-2">找到你的兴趣圈子</Text>

        {/* Features */}
        <View className="flex flex-row gap-6 mt-8">
          <View className="flex flex-col items-center">
            <View className="w-10 h-10 rounded-xl flex items-center justify-center mb-1" style={{ background: '#FFF7ED' }}>
              <Text className="text-lg">🎿</Text>
            </View>
            <Text className="block text-xs text-neutral-500">滑雪</Text>
          </View>
          <View className="flex flex-col items-center">
            <View className="w-10 h-10 rounded-xl flex items-center justify-center mb-1" style={{ background: '#ECFDF5' }}>
              <Text className="text-lg">🚴</Text>
            </View>
            <Text className="block text-xs text-neutral-500">骑行</Text>
          </View>
          <View className="flex flex-col items-center">
            <View className="w-10 h-10 rounded-xl flex items-center justify-center mb-1" style={{ background: '#EFF6FF' }}>
              <Text className="text-lg">🏔</Text>
            </View>
            <Text className="block text-xs text-neutral-500">户外</Text>
          </View>
          <View className="flex flex-col items-center">
            <View className="w-10 h-10 rounded-xl flex items-center justify-center mb-1" style={{ background: '#FDF2F8' }}>
              <Text className="text-lg">📸</Text>
            </View>
            <Text className="block text-xs text-neutral-500">摄影</Text>
          </View>
        </View>
      </View>

      {/* Bottom CTA */}
      <View className="px-8 pb-12">
        <Button
          className="w-full rounded-2xl py-4"
          style={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}
          onClick={handleWechatLogin}
        >
          <Text className="text-white font-bold text-base">微信一键登录</Text>
        </Button>
        <Text className="block text-xs text-neutral-400 text-center mt-4">
          登录即代表同意《用户协议》和《隐私政策》
        </Text>
      </View>
    </View>
  )
}
