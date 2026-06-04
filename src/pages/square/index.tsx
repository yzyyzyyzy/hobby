import { useState, useCallback, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Search, Users, Flame, CirclePlus, TrendingUp, X } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [searchExpanded, setSearchExpanded] = useState(false)
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
      {/* Header - unified gradient style */}
      <View style={{ background: 'linear-gradient(to bottom, #F97316, #EA580C)', paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '24px' }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <View>
            <Text className="block text-xl font-bold text-white">圈子</Text>
            <Text className="block text-xs text-orange-100 mt-1">找到志同道合的伙伴</Text>
          </View>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            {/* Search toggle button */}
            <View
              style={{ backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: '20px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => { setSearchExpanded(!searchExpanded); if (searchExpanded) { setKeyword(''); loadCircles() } }}
            >
              {searchExpanded ? <X size={16} color="#FFFFFF" /> : <Search size={16} color="#FFFFFF" />}
            </View>
            <View onClick={handleCreateCircle} style={{ backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: '20px', paddingLeft: '12px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
              <CirclePlus size={14} color="#FFFFFF" />
              <Text className="block text-xs text-white font-medium">创建</Text>
            </View>
          </View>
        </View>
        {/* Expandable search input */}
        {searchExpanded && (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '12px 16px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <Search size={16} color="#A8A29E" />
            <Input
              style={{ flex: 1, backgroundColor: 'transparent', fontSize: '14px', color: '#292524' }}
              placeholder="搜索圈子、标签..."
              placeholderClass="text-stone-400"
              value={keyword}
              onInput={(e) => setKeyword(e.detail.value)}
              onConfirm={handleSearch}
              autoFocus
            />
          </View>
        )}
      </View>

      {/* Category pills - using inline styles for mini-program compatibility */}
      <View style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', display: 'flex', flexDirection: 'row', gap: '8px' }}>
        {CATEGORIES.map((cat) => (
          <View
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: '8px',
              paddingBottom: '8px',
              borderRadius: '20px',
              backgroundColor: category === cat.key ? '#F97316' : '#FFFFFF',
              boxShadow: category !== cat.key ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <Text style={{ fontSize: '13px', fontWeight: category === cat.key ? '600' : '400', color: category === cat.key ? '#FFFFFF' : '#57534E' }}>
              {cat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* All / My toggle */}
      <View style={{ paddingLeft: '20px', paddingRight: '20px', paddingBottom: '12px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
        <View
          style={{ borderRadius: '20px', paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', backgroundColor: activeTab === 'all' ? '#292524' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setActiveTab('all')}
        >
          <Text style={{ fontSize: '13px', fontWeight: '500', color: activeTab === 'all' ? '#FFFFFF' : '#78716C' }}>全部</Text>
        </View>
        <View
          style={{ borderRadius: '20px', paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', backgroundColor: activeTab === 'my' ? '#292524' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setActiveTab('my')}
        >
          <Text style={{ fontSize: '13px', fontWeight: '500', color: activeTab === 'my' ? '#FFFFFF' : '#78716C' }}>我的{myCircles.length > 0 ? ` ${myCircles.length}` : ''}</Text>
        </View>
      </View>

      {/* Circle list */}
      <ScrollView scrollY style={{ flex: 1 }}>
        <View style={{ paddingLeft: '20px', paddingRight: '20px', paddingBottom: '16px' }}>
          {loading ? (
            <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '64px' }}>
              <View className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </View>
          ) : displayCircles.length > 0 ? (
            displayCircles.map((circle, index) => (
              <View key={circle.id} style={{ marginBottom: '12px' }}>
                <View
                  style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                  onClick={() => Taro.navigateTo({ url: `/pages/circle-detail/index?id=${circle.id}` })}
                >
                  {/* Top accent line */}
                  <View style={{ height: '3px', background: 'linear-gradient(to right, #FB923C, #FCD34D)' }} />
                  <View style={{ padding: '16px' }}>
                    <View style={{ display: 'flex', flexDirection: 'row', gap: '12px' }}>
                      {/* Circle avatar with first character */}
                      <View style={{ width: '56px', height: '56px', backgroundColor: '#F5F5F4', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderWidth: '1px', borderColor: '#E7E5E4' }}>
                        <Text style={{ fontSize: '18px', fontWeight: '700', color: '#78716C' }}>{circle.name[0]}</Text>
                      </View>
                      {/* Info */}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
                          <Text style={{ fontSize: '15px', fontWeight: '700', color: '#292524' }}>{circle.name}</Text>
                          {index < 3 && activeTab === 'all' && (
                            <View style={{ backgroundColor: '#FFF7ED', borderRadius: '10px', paddingLeft: '8px', paddingRight: '8px', paddingTop: '2px', paddingBottom: '2px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '3px' }}>
                              <TrendingUp size={10} color="#F97316" />
                              <Text style={{ fontSize: '10px', color: '#F97316' }}>热门</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: '12px', color: '#A8A29E', marginTop: '4px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{circle.description}</Text>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '3px' }}>
                            <Users size={11} color="#A8A29E" />
                            <Text style={{ fontSize: '11px', color: '#A8A29E' }}>{circle.member_count}人</Text>
                          </View>
                          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '3px' }}>
                            <Flame size={11} color="#FB923C" />
                            <Text style={{ fontSize: '11px', color: '#FB923C' }}>{circle.activity_score}</Text>
                          </View>
                          <View style={{ borderRadius: '10px', paddingLeft: '8px', paddingRight: '8px', paddingTop: '2px', paddingBottom: '2px', borderWidth: '1px', borderColor: '#FED7AA', backgroundColor: '#FFFFFF' }}>
                            <Text style={{ fontSize: '10px', color: '#F97316' }}>{circle.category}</Text>
                          </View>
                        </View>
                      </View>
                      {/* Join button */}
                      <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {circle.is_joined ? (
                          <View style={{ backgroundColor: '#F5F5F4', borderRadius: '20px', paddingLeft: '12px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px' }}>
                            <Text style={{ fontSize: '12px', color: '#A8A29E', fontWeight: '500' }}>已加入</Text>
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
            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
              <Users size={40} color="#D6D3D1" />
              <Text style={{ fontSize: '14px', color: '#A8A29E', marginTop: '12px' }}>
                {activeTab === 'my' ? '还没有加入圈子，去全部看看吧' : '暂无圈子'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
