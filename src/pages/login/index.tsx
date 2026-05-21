import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/user-store'
import { Network } from '@/network'

export default function Login() {
  const setUserInfo = useUserStore((s) => s.setUserInfo)

  const handleWechatLogin = async () => {
    try {
      // 微信小程序一键登录
      const { code } = await Taro.login()
      console.log('Login code:', code)

      // 获取用户信息（微信小程序）
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

      // 调用后端登录接口
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
    <View className="flex flex-col items-center justify-center h-full px-8 bg-white">
      <View className="mb-8">
        <Text className="block text-4xl font-bold text-orange-500">Hobby</Text>
        <Text className="block text-sm text-neutral-500 mt-2">找到你的兴趣圈子</Text>
      </View>

      <View className="w-full space-y-3">
        <Button
          className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-3"
          onClick={handleWechatLogin}
        >
          <Text className="text-white font-medium">微信一键登录</Text>
        </Button>
      </View>

      <View className="mt-8 px-4">
        <Text className="block text-xs text-neutral-400 text-center">
          登录即代表同意《用户协议》和《隐私政策》
        </Text>
      </View>
    </View>
  )
}
