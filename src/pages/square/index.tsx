import { useState, useCallback, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Search, Users, Flame, CirclePlus, TrendingUp } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
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

const CATEGORY_EMOJIS: Record<string, string> = {
  '运动': '🏂',
  '户外': '🏕️',
  '文化': '📚',
  '生活': '☕',
}

export default function Square() {
  const [circles, setCircles] = useState<CircleItem[]>([])
  const [myCircles, setMyCircles] = useState<CircleItem[]>([])
  const [category, setCategory] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const { userInfo } = useUserStore()

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

  const refreshAll = useCallback(async () => {
    await Promise.all([loadCircles(), loadMyCircles()])
  }, [loadCircles, loadMyCircles])

  useEffect(() => {
    loadCircles()
  }, [loadCircles])

  useEffect(() => {
    loadMyCircles()
  }, [loadMyCircles])

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
        Taro.showToast({ title: isJoined ? '已退出圈子' : '加入成功', icon: 'success' })
        refreshAll()
      } else {
        Taro.showToast({ title: res.data?.msg || (isJoined ? '退出失败' : '加入失败'), icon: 'none' })
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
    <View className="h-full bg-stone-50">
      {/* Header with search */}
      <View className="bg-gradient-to-b from-orange-500 to-orange-400 px-5 pt-4 pb-6">
        <View className="flex flex-row items-center justify-between mb-4">
          <View>
            <Text className="block text-xl font-bold text-white">发现圈子</Text>
            <Text className="block text-xs text-orange-100 mt-1">找到志同道合的伙伴</Text>
          </View>
          <View onClick={handleCreateCircle} className="bg-white bg-opacity-20 rounded-full px-3 py-2 flex flex-row items-center gap-1">
            <CirclePlus size={14} color="#FFFFFF" />
            <Text className="block text-xs text-white font-medium">创建</Text>
          </View>
        </View>
        <View className="bg-white bg-opacity-90 rounded-2xl px-4 py-3 flex flex-row items-center gap-2" onClick={handleSearch}>
          <Search size={16} color="#A8A29E" />
          <Input
            className="flex-1 bg-transparent text-sm text-stone-800"
            placeholder="搜索圈子、标签..."
            placeholderClass="text-stone-400"
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
            onConfirm={handleSearch}
          />
        </View>
      </View>

      {/* Category pills */}
      <View className="px-5 py-3">
        <Tabs defaultValue="all" value={category} onValueChange={(v) => setCategory(v as string)}>
          <TabsList className="w-full bg-transparent gap-2">
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.key} value={cat.key} className="flex-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-full bg-white text-stone-600 shadow-sm">
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </View>

      {/* All / My toggle */}
      <View className="px-5 pb-3 flex flex-row items-center gap-1">
        <View
          className={`rounded-full px-4 py-2 ${activeTab === 'all' ? 'bg-stone-800' : 'bg-white'}`}
          onClick={() => setActiveTab('all')}
        >
          <Text className={`block text-sm font-medium ${activeTab === 'all' ? 'text-white' : 'text-stone-500'}`}>全部</Text>
        </View>
        <View
          className={`rounded-full px-4 py-2 ${activeTab === 'my' ? 'bg-stone-800' : 'bg-white'}`}
          onClick={() => setActiveTab('my')}
        >
          <Text className={`block text-sm font-medium ${activeTab === 'my' ? 'text-white' : 'text-stone-500'}`}>我的{myCircles.length > 0 ? ` ${myCircles.length}` : ''}</Text>
        </View>
      </View>

      {/* Circle list */}
      <View className="px-5 gap-3 pb-4">
        {loading ? (
          <View className="flex items-center justify-center py-16">
            <View className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </View>
        ) : displayCircles.length > 0 ? (
          displayCircles.map((circle, index) => (
            <View key={circle.id} className="mb-3">
              <View
                className="bg-white rounded-2xl overflow-hidden shadow-sm"
                onClick={() => Taro.navigateTo({ url: `/pages/circle-detail/index?id=${circle.id}` })}
              >
                {/* Top accent line for visual interest */}
                <View className="h-1 bg-gradient-to-r from-orange-400 to-amber-300" />
                <View className="p-4">
                  <View className="flex flex-row gap-3">
                    {/* Circle avatar */}
                    <View className="w-14 h-14 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-orange-100">
                      <Text className="block text-xl">{CATEGORY_EMOJIS[circle.category] || circle.name[0]}</Text>
                    </View>
                    {/* Info */}
                    <View className="flex-1 min-w-0">
                      <View className="flex flex-row items-center gap-2">
                        <Text className="block text-base font-bold text-stone-800">{circle.name}</Text>
                        {index < 3 && activeTab === 'all' && (
                          <View className="bg-orange-50 rounded-full px-2 py-1 flex flex-row items-center gap-1">
                            <TrendingUp size={10} color="#F97316" />
                            <Text className="block text-orange-500" style={{ fontSize: '10px' }}>热门</Text>
                          </View>
                        )}
                      </View>
                      <Text className="block text-xs text-stone-400 mt-1 line-clamp-1">{circle.description}</Text>
                      <View className="flex flex-row items-center gap-3 mt-2">
                        <View className="flex flex-row items-center gap-1">
                          <Users size={11} color="#A8A29E" />
                          <Text className="block text-stone-400" style={{ fontSize: '11px' }}>{circle.member_count}人</Text>
                        </View>
                        <View className="flex flex-row items-center gap-1">
                          <Flame size={11} color="#FB923C" />
                          <Text className="block text-orange-400" style={{ fontSize: '11px' }}>{circle.activity_score}</Text>
                        </View>
                        <Badge variant="outline" className="border-orange-200 text-orange-500" style={{ fontSize: '10px' }}>{circle.category}</Badge>
                      </View>
                    </View>
                    {/* Join button */}
                    <View className="flex items-center flex-shrink-0 self-center">
                      {circle.is_joined ? (
                        <View className="bg-stone-100 rounded-full px-3 py-2">
                          <Text className="block text-stone-400 text-xs font-medium">已加入</Text>
                        </View>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation && e.stopPropagation()
                            handleJoinCircle(circle.id, circle.is_joined)
                          }}
                        >
                          <Text className="text-white text-xs font-medium">加入</Text>
                        </Button>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View className="flex items-center justify-center py-20">
            <Text className="block text-4xl mb-3">{activeTab === 'my' ? '🤝' : '🔍'}</Text>
            <Text className="block text-sm text-stone-400">
              {activeTab === 'my' ? '还没有加入圈子，去全部看看吧' : '暂无圈子'}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}
