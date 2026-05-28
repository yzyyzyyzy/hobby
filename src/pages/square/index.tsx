import { useState, useCallback, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Search, Users, Flame, CirclePlus } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Network } from '@/network'
import { useUserStore } from '@/store/user-store'

interface CircleItem {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  member_count: number
  activity_score: number
  is_joined: boolean
  owner_id?: string
}

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: '运动', label: '运动' },
  { key: '户外', label: '户外' },
  { key: '文化', label: '文化' },
  { key: '生活', label: '生活' },
]

export default function Square() {
  const [circles, setCircles] = useState<CircleItem[]>([])
  const [myCircles, setMyCircles] = useState<CircleItem[]>([])
  const [category, setCategory] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const { userInfo } = useUserStore()

  // 加载全部圈子
  const loadCircles = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (category !== 'all') params.category = category
      if (keyword) params.keyword = keyword
      if (userInfo?.id) params.user_id = userInfo.id

      const query = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
      const res = await Network.request({
        url: `/api/circles${query ? `?${query}` : ''}`,
        method: 'GET',
      })
      console.log('Load circles response:', res.data)
      if (res.data?.data) {
        setCircles(res.data.data)
      }
    } catch (err) {
      console.error('Load circles error:', err)
    } finally {
      setLoading(false)
    }
  }, [category, keyword, userInfo?.id])

  // 独立加载我的圈子
  const loadMyCircles = useCallback(async () => {
    if (!userInfo?.id) {
      setMyCircles([])
      return
    }
    try {
      const res = await Network.request({
        url: `/api/users/circles?user_id=${userInfo.id}`,
        method: 'GET',
      })
      console.log('Load my circles response:', res.data)
      if (res.data?.data) {
        setMyCircles(res.data.data)
      }
    } catch (err) {
      console.error('Load my circles error:', err)
    }
  }, [userInfo?.id])

  // 刷新所有数据
  const refreshAll = useCallback(async () => {
    await Promise.all([loadCircles(), loadMyCircles()])
  }, [loadCircles, loadMyCircles])

  useEffect(() => {
    loadCircles()
  }, [loadCircles])

  useEffect(() => {
    loadMyCircles()
  }, [loadMyCircles])

  // 页面显示时刷新（切回广场Tab时触发）
  Taro.useDidShow(() => {
    refreshAll()
  })

  const handleJoinCircle = async (circleId: string, isJoined: boolean) => {
    if (!userInfo?.id) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    try {
      const url = isJoined ? '/api/circles/leave' : '/api/circles/join'
      const res = await Network.request({
        url,
        method: 'POST',
        data: { circle_id: circleId, user_id: userInfo.id },
      })
      console.log(`${isJoined ? 'Leave' : 'Join'} circle response:`, res.data)
      if (res.data?.code === 200 || res.data?.data) {
        Taro.showToast({
          title: isJoined ? '已退出圈子' : '加入成功',
          icon: 'success',
        })
        refreshAll()
      } else {
        Taro.showToast({
          title: res.data?.msg || (isJoined ? '退出失败' : '加入失败'),
          icon: 'none',
        })
      }
    } catch (err) {
      console.error('Join/Leave circle error:', err)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleSearch = () => {
    loadCircles()
  }

  const handleCreateCircle = () => {
    if (!userInfo?.id) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    Taro.navigateTo({ url: '/pages/create-circle/index' })
  }

  const displayCircles = activeTab === 'my' ? myCircles : circles

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

      {/* 全部/我的 Tab */}
      <View className="bg-white px-4 pb-2 flex flex-row items-center justify-between">
        <View className="flex flex-row gap-4">
          <Text
            className={`block text-sm font-medium ${activeTab === 'all' ? 'text-orange-500' : 'text-neutral-500'}`}
            onClick={() => setActiveTab('all')}
          >
            全部
          </Text>
          <Text
            className={`block text-sm font-medium ${activeTab === 'my' ? 'text-orange-500' : 'text-neutral-500'}`}
            onClick={() => setActiveTab('my')}
          >
            我的{myCircles.length > 0 ? `(${myCircles.length})` : ''}
          </Text>
        </View>
        <View onClick={handleCreateCircle} className="flex flex-row items-center gap-1">
          <CirclePlus size={16} color="#F97316" />
          <Text className="block text-sm text-orange-500">创建圈子</Text>
        </View>
      </View>

      <View className="h-2" />

      {/* 圈子列表 */}
      <View className="px-4 space-y-3 pb-4">
        {loading ? (
          <View className="flex items-center justify-center py-12">
            <Text className="block text-sm text-neutral-400">加载中...</Text>
          </View>
        ) : displayCircles.length > 0 ? (
          displayCircles.map((circle) => (
            <Card key={circle.id} className="overflow-hidden">
              <CardContent className="p-4">
                <View
                  className="flex flex-row gap-3"
                  onClick={() => Taro.navigateTo({ url: `/pages/circle-detail/index?id=${circle.id}` })}
                >
                  {/* 圈子封面 */}
                  <View className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Text className="block text-2xl">{circle.name[0]}</Text>
                  </View>
                  {/* 圈子信息 */}
                  <View className="flex-1 min-w-0">
                    <Text className="block text-sm font-semibold text-neutral-900">{circle.name}</Text>
                    <Text className="block text-xs text-neutral-500 mt-1 line-clamp-1">{circle.description}</Text>
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
                  {/* 加入按钮 */}
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
          <View className="flex items-center justify-center py-12">
            <Text className="block text-sm text-neutral-400">
              {activeTab === 'my' ? '还没有加入圈子，去全部看看吧' : '暂无圈子'}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}
