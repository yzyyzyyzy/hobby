import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { FileText, Users, BookOpen, ChevronRight } from 'lucide-react-taro'
import { useUserStore } from '@/store/user-store'

interface CircleItem {
  id: string
  name: string
  category: string
}

export default function Publish() {
  const { userInfo, isLoggedIn } = useUserStore()
  const [circles, setCircles] = useState<CircleItem[]>([])
  const [selectedCircle, setSelectedCircle] = useState<CircleItem | null>(null)
  const [showCirclePicker, setShowCirclePicker] = useState(false)

  useEffect(() => {
    if (isLoggedIn && userInfo?.id) {
      loadMyCircles()
    }
  }, [isLoggedIn, userInfo?.id])

  const loadMyCircles = async () => {
    try {
      const res = await Network.request({
        url: `/api/users/circles?user_id=${userInfo!.id}`,
        method: 'GET',
      })
      console.log('My circles for publish:', res.data)
      if (res.data?.data) {
        setCircles(res.data.data)
      }
    } catch (err) {
      console.error('Load my circles failed:', err)
    }
  }

  const handleSelectCircle = (circle: CircleItem) => {
    setSelectedCircle(circle)
    setShowCirclePicker(false)
  }

  const handlePublish = (type: string) => {
    if (!isLoggedIn) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    if (!selectedCircle) {
      Taro.showToast({ title: '请先选择圈子', icon: 'none' })
      setShowCirclePicker(true)
      return
    }

    if (type === 'feed') {
      Taro.navigateTo({ url: `/pages/circle-detail/index?id=${selectedCircle.id}&tab=feed&publish=1` })
    } else if (type === 'buddy') {
      Taro.navigateTo({ url: `/pages/circle-detail/index?id=${selectedCircle.id}&tab=buddy&publish=1` })
    } else if (type === 'resource') {
      Taro.navigateTo({ url: `/pages/resource-detail/index?circle_id=${selectedCircle.id}&submit=1` })
    }
  }

  // 圈子选择弹窗
  if (showCirclePicker) {
    return (
      <View className="h-full bg-neutral-50">
        <View className="bg-white px-4 py-3 flex flex-row items-center justify-between border-b border-neutral-100">
          <Text className="block text-base font-semibold text-neutral-900">选择圈子</Text>
          <Text className="block text-sm text-orange-500" onClick={() => setShowCirclePicker(false)}>取消</Text>
        </View>
        {circles.length > 0 ? (
          <View className="px-4 py-2 space-y-2">
            {circles.map((circle) => (
              <Card key={circle.id} onClick={() => handleSelectCircle(circle)}>
                <CardContent className="p-4 flex flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Text className="block text-lg">{circle.name[0]}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="block text-sm font-semibold text-neutral-900">{circle.name}</Text>
                    <Text className="block text-xs text-neutral-500">{circle.category}</Text>
                  </View>
                  <ChevronRight size={16} color="#A3A3A3" />
                </CardContent>
              </Card>
            ))}
          </View>
        ) : (
          <View className="flex items-center justify-center py-16">
            <Text className="block text-sm text-neutral-400">还没有加入任何圈子</Text>
            <Text className="block text-sm text-orange-500 mt-2" onClick={() => Taro.switchTab({ url: '/pages/square/index' })}>
              去广场看看
            </Text>
          </View>
        )}
      </View>
    )
  }

  return (
    <View className="h-full bg-neutral-50 px-4 pt-6">
      <Text className="block text-xl font-bold text-neutral-900 mb-2">发布</Text>
      <Text className="block text-sm text-neutral-500 mb-6">选择你要发布的内容类型</Text>

      {/* 已选圈子 */}
      <View className="mb-6">
        <Text className="block text-sm font-medium text-neutral-700 mb-2">发布到圈子</Text>
        {selectedCircle ? (
          <Card onClick={() => setShowCirclePicker(true)}>
            <CardContent className="p-4 flex flex-row items-center gap-3">
              <View className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Text className="block text-lg">{selectedCircle.name[0]}</Text>
              </View>
              <View className="flex-1">
                <Text className="block text-sm font-semibold text-neutral-900">{selectedCircle.name}</Text>
                <Text className="block text-xs text-neutral-500">{selectedCircle.category}</Text>
              </View>
              <Text className="block text-xs text-orange-500">切换</Text>
            </CardContent>
          </Card>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowCirclePicker(true)}>
            <Text>选择圈子</Text>
          </Button>
        )}
      </View>

      {/* 发布类型 */}
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
