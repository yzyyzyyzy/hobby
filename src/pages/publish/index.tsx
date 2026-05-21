import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import Taro from '@tarojs/taro'
import { FileText, Users, BookOpen } from 'lucide-react-taro'
import { useUserStore } from '@/store/user-store'

export default function Publish() {
  const { isLoggedIn } = useUserStore()

  const handlePublish = (type: string) => {
    if (!isLoggedIn) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    // 跳转到圈子详情页对应tab
    Taro.navigateTo({ url: `/pages/circle-detail/index?tab=${type}` })
  }

  return (
    <View className="h-full bg-neutral-50 px-4 pt-6">
      <Text className="block text-xl font-bold text-neutral-900 mb-2">发布</Text>
      <Text className="block text-sm text-neutral-500 mb-6">选择你要发布的内容类型</Text>

      <View className="space-y-4">
        <Card onClick={() => handlePublish('feed')}>
          <CardContent className="p-5">
            <View className="flex flex-row items-center gap-4">
              <View className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <FileText size={24} color="#F97316" />
              </View>
              <View className="flex-1">
                <Text className="block text-base font-semibold text-neutral-900">发布动态</Text>
                <Text className="block text-xs text-neutral-500 mt-1">分享你的想法、经验和发现</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        <Card onClick={() => handlePublish('buddy')}>
          <CardContent className="p-5">
            <View className="flex flex-row items-center gap-4">
              <View className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <Users size={24} color="#22C55E" />
              </View>
              <View className="flex-1">
                <Text className="block text-base font-semibold text-neutral-900">找搭子</Text>
                <Text className="block text-xs text-neutral-500 mt-1">发起活动，找到志同道合的伙伴</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        <Card onClick={() => handlePublish('resource')}>
          <CardContent className="p-5">
            <View className="flex flex-row items-center gap-4">
              <View className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <BookOpen size={24} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="block text-base font-semibold text-neutral-900">补充资料</Text>
                <Text className="block text-xs text-neutral-500 mt-1">为圈子资料库贡献内容</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      <View className="px-4 py-6 mt-4">
        <Text className="block text-xs text-neutral-400 text-center">
          发布内容须遵守社区规范，违规内容将被删除
        </Text>
      </View>
    </View>
  )
}
