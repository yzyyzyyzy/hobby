import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Search, Users, Flame , Target } from 'lucide-react-taro'
import { useUserStore } from '@/store/user-store'

interface CircleItem {
  id: string
  name: string
  category: string
  description: string
  cover_url: string
  member_count: number
  activity_score: number
  tags: string[]
  is_joined: boolean
}

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: '运动', label: '运动' },
  { key: '户外', label: '户外' },
  { key: '文化', label: '文化' },
  { key: '生活', label: '生活' },
]

export default function Index() {
  const userInfo = useUserStore((s) => s.userInfo)
  const [circles, setCircles] = useState<CircleItem[]>([])
  const [category, setCategory] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userInfo) {
      Taro.redirectTo({ url: '/pages/login/index' })
      return
    }
    loadCircles()
  }, [category, userInfo])

  const loadCircles = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { user_id: userInfo?.id || '' }
      if (category !== 'all') params.category = category
      if (keyword) params.keyword = keyword

      const query = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
      const res = await Network.request({
        url: `/api/circles?${query}`,
        method: 'GET',
      })
      console.log('Load circles response:', res.data)
      if (res.data?.data) {
        setCircles(res.data.data)
      }
    } catch (err) {
      console.error('Load circles failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    Taro.navigateTo({ url: `/pages/search/index?keyword=${keyword}` })
  }

  const handleJoinCircle = async (circleId: string, isJoined: boolean) => {
    try {
      const url = isJoined ? '/api/circles/leave' : '/api/circles/join'
      const res = await Network.request({
        url,
        method: 'POST',
        data: { circle_id: circleId, user_id: userInfo?.id },
      })
      console.log('Join/leave response:', res.data)
      if (res.data?.data) {
        setCircles((prev) =>
          prev.map((c) =>
            c.id === circleId
              ? { ...c, is_joined: !isJoined, member_count: c.member_count + (isJoined ? -1 : 1) }
              : c
          )
        )
        Taro.showToast({ title: isJoined ? '已退出圈子' : '已加入圈子', icon: 'success' })
      }
    } catch (err) {
      console.error('Join/leave circle failed:', err)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  return (
    <View className="h-full bg-neutral-50">
      {/* 搜索栏 */}
      <View className="bg-white px-4 pt-2 pb-3">
        <View className="bg-neutral-100 rounded-xl px-3 py-2 flex flex-row items-center gap-2" onClick={handleSearch}>
          <Search size={16} color="#737373" />
          <Input
            className="flex-1 bg-transparent text-sm"
            placeholder="搜索圈子、标签..."
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
            onConfirm={handleSearch}
          />
        </View>
      </View>

      {/* 分类 Tabs */}
      <View className="bg-white px-4 pb-2">
        <Tabs defaultValue="all" value={category} onValueChange={(v) => setCategory(v as string)}>
          <TabsList className="w-full">
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.key} value={cat.key} className="flex-1">
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </View>

      <View className="h-2" />

      {/* 圈子列表 */}
      <View className="px-4 space-y-3 pb-4">
        {loading ? (
          <View className="flex items-center justify-center py-12">
            <Text className="block text-sm text-neutral-400">加载中...</Text>
          </View>
        ) : circles.length > 0 ? (
          circles.map((circle) => (
            <Card key={circle.id} className="overflow-hidden">
              <CardContent className="p-4">
                <View
                  className="flex flex-row gap-3"
                  onClick={() => Taro.navigateTo({ url: `/pages/circle-detail/index?id=${circle.id}` })}
                >
                  <View className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Text className="block text-2xl">{circle.name[0]}</Text>
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="block text-sm font-semibold text-neutral-900">{circle.name}</Text>
                    <Text className="block text-xs text-neutral-500 mt-1 ">{circle.description}</Text>
                    <View className="flex flex-row items-center gap-3 mt-2">
                      <View className="flex flex-row items-center gap-1">
                        <Users size={12} color="#737373" />
                        <Text className="block text-xs text-neutral-500">{circle.member_count}人</Text>
                      </View>
                      <View className="flex flex-row items-center gap-1">
                        <Flame size={12} color="#F97316" />
                        <Text className="block text-xs text-orange-500">{circle.activity_score}</Text>
                      </View>
                      <Badge variant="outline" className="text-xs">{circle.category}</Badge>
                    </View>
                  </View>
                  <View className="flex items-center flex-shrink-0">
                    <Button
                      size="sm"
                      className={circle.is_joined ? 'bg-neutral-100 text-neutral-600' : 'bg-orange-500 text-white'}
                      onClick={(e) => {
                        e.stopPropagation && e.stopPropagation()
                        handleJoinCircle(circle.id, circle.is_joined)
                      }}
                    >
                      <Text className={circle.is_joined ? 'text-neutral-600' : 'text-white'}>
                        {circle.is_joined ? '已加入' : '加入'}
                      </Text>
                    </Button>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))
        ) : (
          <View className="flex flex-col items-center justify-center py-12">
            <Target size={40} color="#D6D3D1" />
            <Text className="block text-sm text-neutral-500">暂无圈子，快来创建一个吧</Text>
          </View>
        )}
      </View>

      {/* 底部免责声明 */}
      <View className="px-4 py-3">
        <Text className="block text-xs text-neutral-400 text-center">
          内容由用户生成，平台不承担相关责任 |《用户协议》《隐私政策》
        </Text>
      </View>
    </View>
  )
}
