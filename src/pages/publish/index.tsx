import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { PenLine, Users, BookPlus } from 'lucide-react-taro'

const features = [
  {
    key: 'post',
    title: '发布动态',
    desc: '分享图文动态，记录精彩瞬间',
    icon: PenLine,
    color: '#F97316',
    bg: '#FFF7ED',
    path: '/pages/publish-post/index'
  },
  {
    key: 'activity',
    title: '找搭子',
    desc: '发起活动，找到志同道合的伙伴',
    icon: Users,
    color: '#10B981',
    bg: '#ECFDF5',
    path: '/pages/publish-activity/index'
  },
  {
    key: 'resource',
    title: '补充资料',
    desc: '为圈子资料库贡献内容',
    icon: BookPlus,
    color: '#6366F1',
    bg: '#EEF2FF',
    path: '/pages/submit-resource/index'
  }
]

export default function Publish() {
  const handleNavigate = (path: string) => {
    Taro.navigateTo({ url: path })
  }

  return (
    <View className="h-full bg-neutral-50 p-4">
      <Text className="block text-xl font-bold text-neutral-900 mb-2">发布</Text>
      <Text className="block text-sm text-neutral-500 mb-6">选择要发布的内容类型</Text>

      <View className="space-y-3">
        {features.map(f => {
          const IconComp = f.icon
          return (
            <Card key={f.key} onClick={() => handleNavigate(f.path)}>
              <CardContent className="p-4 flex flex-row items-center gap-4">
                <View className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: f.bg }}>
                  <IconComp size={24} color={f.color} />
                </View>
                <View className="flex-1">
                  <Text className="block text-base font-semibold text-neutral-900">{f.title}</Text>
                  <Text className="block text-xs text-neutral-500 mt-1">{f.desc}</Text>
                </View>
              </CardContent>
            </Card>
          )
        })}
      </View>
    </View>
  )
}
