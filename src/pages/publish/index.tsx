import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PenLine, Users, BookPlus } from 'lucide-react-taro'

const features = [
  {
    key: 'post',
    title: '发布动态',
    desc: '分享图文动态，记录精彩瞬间',
    icon: PenLine,
    gradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
    path: '/pages/publish-post/index'
  },
  {
    key: 'activity',
    title: '找搭子',
    desc: '发起活动，找到志同道合的伙伴',
    icon: Users,
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    path: '/pages/publish-activity/index'
  },
  {
    key: 'resource',
    title: '补充资料',
    desc: '为圈子资料库贡献内容',
    icon: BookPlus,
    gradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
    path: '/pages/submit-resource/index'
  }
]

export default function Publish() {
  const handleNavigate = (path: string) => {
    Taro.navigateTo({ url: path })
  }

  return (
    <View className="h-full bg-neutral-50">
      {/* Header */}
      <View className="px-5 pt-6 pb-4">
        <Text className="block text-2xl font-bold text-neutral-900">发布</Text>
        <Text className="block text-sm text-neutral-400 mt-1">选择你要发布的内容类型</Text>
      </View>

      {/* Cards */}
      <View className="px-5 gap-4">
        {features.map((f) => {
          const IconComp = f.icon
          return (
            <View
              key={f.key}
              className="rounded-2xl overflow-hidden mb-4"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              onClick={() => handleNavigate(f.path)}
            >
              <View className="p-5 flex flex-row items-center" style={{ background: f.gradient }}>
                <View className="w-14 h-14 rounded-2xl flex items-center justify-center mr-4" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <IconComp size={28} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="block text-lg font-bold text-white">{f.title}</Text>
                  <Text className="block text-sm mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{f.desc}</Text>
                </View>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}
