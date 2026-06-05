import { View, ScrollView, Text } from '@tarojs/components'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'
import { useUserStore } from '@/store/user-store'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Trophy, Image, ListChecks, Users, MapPin, Clock, DollarSign, ChevronRight, Heart, ThumbsUp, MessageCircle, Plus, Lock, Sparkles } from 'lucide-react-taro'

interface Circle {
  id: string; name: string; description: string; category: string;
  tags: string[]; cover_url: string; member_count: number; activity_score: number;
}

interface Resource {
  id: string; title: string; template_type: string; description: string;
  template_data: any; sort_order: number;
}

interface Post {
  id: string; user_id: string; content: string; images: string[];
  tags: string[]; like_count: number; comment_count: number;
  created_at: string; nickname: string; avatar_url: string;
}

interface Activity {
  id: string; user_id: string; title: string; description: string;
  activity_time: string; location: string; max_participants: number;
  current_participants: number; fee_description: string;
  status: string; auto_approve: boolean; nickname: string;
}


export default function CircleDetail() {
  const userStoreInfo = useUserStore((s) => s.userInfo)
  const [circle, setCircle] = useState<Circle | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [activeTab, setActiveTab] = useState('resources')
  const [resources, setResources] = useState<Resource[]>([])
  const [resourceItems, setResourceItems] = useState<Record<string, any[]>>({})
  const [posts, setPosts] = useState<Post[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const userId = Taro.getStorageSync('user_id') || userStoreInfo?.id || ''

  useEffect(() => {
    const instance = Taro.getCurrentInstance()
    const id = instance?.router?.params?.id
    if (id) loadCircle(id)
  }, [])

  const loadCircle = async (id: string) => {
    try {
      const res = await Network.request({ url: `/api/circles/${id}`, data: { user_id: userId } })
      console.log('Circle detail:', res.data)
      if (res.data?.data) {
        setCircle(res.data.data)
        setIsMember(res.data.data.is_joined || false)
      }
      const resRes = await Network.request({ url: `/api/resources/circle/${id}` })
      if (resRes.data?.data) {
        setResources(resRes.data.data)
        const itemsMap: Record<string, any[]> = {}
        for (const rsc of resRes.data.data) {
          try {
            const itemsRes = await Network.request({ url: `/api/resources/${rsc.id}/items?sort_by=likes&limit=5` })
            const itemsData = itemsRes.data?.data || itemsRes.data
            if (Array.isArray(itemsData)) itemsMap[rsc.id] = itemsData
          } catch (e) { console.error('Load items for resource failed:', e) }
        }
        setResourceItems(itemsMap)
      }
      loadPosts(id)
      loadActivities(id)
    } catch (err) { console.error('Load circle failed:', err) }
  }

  const loadPosts = async (circleId: string) => {
    try {
      const res = await Network.request({ url: `/api/posts?circle_id=${circleId}&sort=latest` })
      if (res.data?.data) setPosts(res.data.data)
    } catch (err) { console.error('Load posts failed:', err) }
  }

  const loadActivities = async (circleId: string) => {
    try {
      const res = await Network.request({ url: `/api/activities?circle_id=${circleId}` })
      if (res.data?.data) setActivities(res.data.data)
    } catch (err) { console.error('Load activities failed:', err) }
  }

  const handleJoin = async () => {
    if (!circle || !userId) return
    try {
      await Network.request({ url: `/api/circles/join`, method: 'POST', data: { circle_id: circle.id, user_id: userId } })
      setIsMember(true)
      Taro.showToast({ title: '已加入圈子', icon: 'success' })
    } catch (err) {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleLeave = async () => {
    if (!circle || !userId) return
    try {
      await Network.request({ url: `/api/circles/leave`, method: 'POST', data: { circle_id: circle.id, user_id: userId } })
      setIsMember(false)
      Taro.showToast({ title: '已退出圈子', icon: 'success' })
    } catch (err) {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleLike = async (postId: string) => {
    if (!userId) return
    try {
      await Network.request({ url: `/api/posts/like`, method: 'POST', data: { post_id: postId, user_id: userId } })
      setPosts(posts.map(p => p.id === postId ? { ...p, like_count: p.like_count + 1 } : p))
    } catch (err) { console.error('Like failed:', err) }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }

  // 渲染排行榜模板
  const renderRanking = (resource: Resource) => {
    const items = resourceItems[resource.id] || []
    return (
      <View className="mb-4">
        <View className="flex flex-row items-center gap-2 mb-3">
          <View className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
            <Trophy size={16} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="block text-sm font-bold text-stone-800">{resource.title}</Text>
            {resource.description && <Text className="block text-xs text-stone-400">{resource.description}</Text>}
          </View>
        </View>
        <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {items.length > 0 ? items.map((item: any, idx: number) => (
            <View
              key={item.id || idx}
              className="flex flex-row items-center px-4 py-3 border-b border-stone-50 last:border-b-0 active:bg-stone-50"
              onClick={() => Taro.navigateTo({ url: `/pages/item-detail/index?id=${item.id}` })}
            >
              <View className="w-7 flex items-center justify-center">
                {idx < 3 ? (
                  <View className={`w-6 h-6 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-stone-300' : 'bg-orange-300'}`}>
                    <Text className="block text-white text-xs font-bold">{idx + 1}</Text>
                  </View>
                ) : (
                  <Text className="block text-sm text-stone-300 font-semibold">{idx + 1}</Text>
                )}
              </View>
              <View className="flex-1 ml-3">
                <Text className="block text-sm font-semibold text-stone-700">{item.title}</Text>
                {item.subtitle && <Text className="block text-xs text-stone-400 mt-1">{item.subtitle}</Text>}
              </View>
              <View className="flex flex-row items-center gap-1">
                <Heart size={12} color={item.is_liked ? '#ef4444' : '#d6d3d1'} filled={item.is_liked} />
                <Text className="block text-xs text-stone-400">{item.like_count || 0}</Text>
              </View>
            </View>
          )) : (
            <View className="py-8 flex items-center justify-center">
              <Text className="block text-xs text-stone-300">暂无条目</Text>
            </View>
          )}
          <View className="px-4 py-3 border-t border-stone-50" onClick={() => Taro.navigateTo({ url: `/pages/resource-detail/index?id=${resource.id}` })}>
            <View className="flex flex-row items-center justify-center gap-1">
              <Text className="block text-xs text-orange-500 font-medium">查看全部</Text>
              <ChevronRight size={14} color="#F97316" />
            </View>
          </View>
        </View>
      </View>
    )
  }

  // 渲染图集模板
  const renderGallery = (resource: Resource) => {
    const items = resourceItems[resource.id] || []
    return (
      <View className="mb-4">
        <View className="flex flex-row items-center gap-2 mb-3">
          <View className="w-8 h-8 bg-gradient-to-br from-violet-400 to-purple-500 rounded-lg flex items-center justify-center">
            <Image size={16} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="block text-sm font-bold text-stone-800">{resource.title}</Text>
            {resource.description && <Text className="block text-xs text-stone-400">{resource.description}</Text>}
          </View>
        </View>
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          {items.length > 0 ? (
            <View className="grid grid-cols-3 gap-3">
              {items.slice(0, 6).map((item: any, idx: number) => (
                <View
                  key={item.id || idx}
                  className="flex flex-col items-center"
                  onClick={() => Taro.navigateTo({ url: `/pages/item-detail/index?id=${item.id}` })}
                >
                  <View className="w-14 h-14 bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl flex items-center justify-center mb-2 shadow-sm">
                    <Text className="block text-lg font-bold text-orange-400">{item.title?.charAt(0) || '?'}</Text>
                  </View>
                  <Text className="block text-xs font-medium text-stone-700 text-center">{item.title}</Text>
                  {item.subtitle && <Text className="block text-xs text-stone-400 text-center">{item.subtitle}</Text>}
                </View>
              ))}
            </View>
          ) : (
            <View className="py-8 flex items-center justify-center">
              <Text className="block text-xs text-stone-300">暂无条目</Text>
            </View>
          )}
          <View className="mt-3 pt-3 border-t border-stone-50" onClick={() => Taro.navigateTo({ url: `/pages/resource-detail/index?id=${resource.id}` })}>
            <View className="flex flex-row items-center justify-center gap-1">
              <Text className="block text-xs text-orange-500 font-medium">查看全部</Text>
              <ChevronRight size={14} color="#F97316" />
            </View>
          </View>
        </View>
      </View>
    )
  }

  // 渲染列表模板
  const renderList = (resource: Resource) => {
    const items = resourceItems[resource.id] || []
    return (
      <View className="mb-4">
        <View className="flex flex-row items-center gap-2 mb-3">
          <View className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center">
            <ListChecks size={16} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="block text-sm font-bold text-stone-800">{resource.title}</Text>
            {resource.description && <Text className="block text-xs text-stone-400">{resource.description}</Text>}
          </View>
        </View>
        <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {items.length > 0 ? items.map((item: any, idx: number) => (
            <View
              key={item.id || idx}
              className="flex flex-row items-center px-4 py-3 border-b border-stone-50 last:border-b-0 active:bg-stone-50"
              onClick={() => Taro.navigateTo({ url: `/pages/item-detail/index?id=${item.id}` })}
            >
              <View className="flex-1">
                <Text className="block text-sm font-medium text-stone-700">{item.title}</Text>
                {item.subtitle && <Text className="block text-xs text-stone-400 mt-1">{item.subtitle}</Text>}
              </View>
              <View className="flex flex-row items-center gap-2">
                {Array.isArray(item.tags) && item.tags.slice(0, 2).map((tag: string, ti: number) => (
                  <Badge key={ti} className="bg-orange-50 text-orange-500 border-0" style={{ fontSize: '10px' }}>{tag}</Badge>
                ))}
                <View className="flex flex-row items-center gap-1">
                  <Heart size={11} color={item.is_liked ? '#ef4444' : '#d6d3d1'} filled={item.is_liked} />
                  <Text className="block text-xs text-stone-400">{item.like_count || 0}</Text>
                </View>
              </View>
            </View>
          )) : (
            <View className="py-8 flex items-center justify-center">
              <Text className="block text-xs text-stone-300">暂无条目</Text>
            </View>
          )}
          <View className="px-4 py-3 border-t border-stone-50" onClick={() => Taro.navigateTo({ url: `/pages/resource-detail/index?id=${resource.id}` })}>
            <View className="flex flex-row items-center justify-center gap-1">
              <Text className="block text-xs text-orange-500 font-medium">查看全部</Text>
              <ChevronRight size={14} color="#F97316" />
            </View>
          </View>
        </View>
      </View>
    )
  }

  const renderResource = (resource: Resource) => {
    switch (resource.template_type) {
      case 'ranking': return renderRanking(resource)
      case 'gallery': return renderGallery(resource)
      case 'list': return renderList(resource)
      default: return null
    }
  }

  // 未加入圈子的锁定提示
  const renderLockedTab = (tabName: string) => (
    <View className="flex flex-col items-center justify-center py-24">
      <View className="w-20 h-20 bg-stone-100 rounded-3xl flex items-center justify-center mb-5">
        <Lock size={32} color="#A8A29E" />
      </View>
      <Text className="block text-lg font-bold text-stone-600 mb-2">加入圈子后可见</Text>
      <Text className="block text-sm text-stone-400 mb-6">加入圈子即可查看{tabName}内容</Text>
      <Button className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full px-8 shadow-lg" onClick={handleJoin}>
        <Text className="text-white font-medium">加入圈子</Text>
      </Button>
    </View>
  )

  const statusMap: Record<string, { label: string; color: string }> = {
    recruiting: { label: '招募中', color: 'bg-emerald-50 text-emerald-600' },
    full: { label: '已满员', color: 'bg-amber-50 text-amber-600' },
    cancelled: { label: '已取消', color: 'bg-red-50 text-red-600' },
    completed: { label: '已完成', color: 'bg-stone-100 text-stone-400' },
  }

  if (!circle) {
    return (
      <View className="flex items-center justify-center h-screen bg-stone-50">
        <View className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </View>
    )
  }

  return (
    <View className="min-h-full bg-stone-50">
      {/* Circle Header with gradient */}
      <View className="bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 px-5 pt-4 pb-6">
        <View className="flex flex-row items-center gap-3">
          <View className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <Text className="block text-3xl text-orange-500 font-bold">{circle.name[0]}</Text>
          </View>
          <View className="flex-1">
            <Text className="block text-xl font-bold text-white">{circle.name}</Text>
            <Text className="block text-xs text-orange-100 mt-1">{circle.description}</Text>
          </View>
          {/* 右上角加入/已加入按钮 */}
          {isMember ? (
            <View className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-4 py-2 border border-white border-opacity-30" onClick={handleLeave}>
              <Text className="block text-xs text-white font-medium">已加入</Text>
            </View>
          ) : (
            <Button size="sm" className="bg-white text-orange-500 rounded-full font-bold shadow-sm" onClick={handleJoin}>
              <Text className="text-orange-500 text-xs font-bold">加入</Text>
            </Button>
          )}
        </View>
        <View className="flex flex-row items-center gap-5 mt-4">
          <View className="flex flex-row items-center gap-2">
            <Users size={14} color="rgba(255,255,255,0.8)" />
            <Text className="block text-xs text-orange-100">{circle.member_count} 成员</Text>
          </View>
          <View className="flex flex-row items-center gap-2">
            <Sparkles size={14} color="rgba(255,255,255,0.8)" />
            <Text className="block text-xs text-orange-100">活跃度 {circle.activity_score}</Text>
          </View>
          <View className="flex flex-row flex-wrap gap-2 ml-auto">
            {circle.tags?.slice(0, 3).map((tag, i) => (
              <View key={i} className="rounded-full px-2 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}>
                <Text className="block" style={{ fontSize: '10px', color: '#FFFFFF' }}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Three Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-white shadow-sm">
          <TabsTrigger value="resources" className="flex-1">资料库</TabsTrigger>
          <TabsTrigger value="feed" className="flex-1">动态</TabsTrigger>
          <TabsTrigger value="activities" className="flex-1">找搭子</TabsTrigger>
        </TabsList>

        {/* 资料库 Tab - 所有人可见 */}
        <TabsContent value="resources">
          <ScrollView scrollY className="px-5 py-4">
            {resources.length === 0 ? (
              <View className="flex flex-col items-center py-20">
                <ListChecks size={40} color="#D6D3D1" />
                <Text className="block text-sm text-stone-400">暂无资料，管理员可在后台添加模板</Text>
              </View>
            ) : (
              resources.sort((a, b) => a.sort_order - b.sort_order).map(rsc => (
                <View key={rsc.id}>{renderResource(rsc)}</View>
              ))
            )}
          </ScrollView>
        </TabsContent>

        {/* 动态 Feed Tab */}
        <TabsContent value="feed">
          {isMember ? (
            <View className="relative">
              <ScrollView scrollY className="px-5 py-4" style={{ paddingBottom: '80px' }}>
                {posts.length === 0 ? (
                  <View className="flex flex-col items-center py-20">
                    <MessageCircle size={40} color="#D6D3D1" />
                    <Text className="block text-sm text-stone-400">暂无动态，来发第一条吧</Text>
                  </View>
                ) : posts.map(post => (
                  <View key={post.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm" onClick={() => Taro.navigateTo({ url: `/pages/post-detail/index?id=${post.id}` })}>
                    <View className="flex flex-row items-center gap-3 mb-3">
                      <View className="w-9 h-9 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center">
                        <Text className="block text-white text-xs font-bold">{post.nickname?.charAt(0) || '?'}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="block text-sm font-semibold text-stone-700">{post.nickname || '用户'}</Text>
                        <Text className="block text-xs text-stone-400">{formatDate(post.created_at)}</Text>
                      </View>
                    </View>
                    <Text className="block text-sm text-stone-600 leading-relaxed mb-3">{post.content}</Text>
                    {post.tags?.length > 0 && (
                      <View className="flex flex-row flex-wrap gap-2 mb-3">
                        {post.tags.map((tag, i) => (
                          <Badge key={i} className="bg-orange-50 text-orange-500 border-0" style={{ fontSize: '11px' }}>#{tag}</Badge>
                        ))}
                      </View>
                    )}
                    <View className="flex flex-row items-center gap-5 pt-3 border-t border-stone-100">
                      <View className="flex flex-row items-center gap-2" onClick={() => handleLike(post.id)}>
                        <ThumbsUp size={15} color="#A8A29E" />
                        <Text className="block text-xs text-stone-400">{post.like_count}</Text>
                      </View>
                      <View className="flex flex-row items-center gap-2" onClick={() => Taro.navigateTo({ url: `/pages/post-detail/index?id=${post.id}` })}>
                        <MessageCircle size={15} color="#A8A29E" />
                        <Text className="block text-xs text-stone-400">{post.comment_count}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
              {/* FAB - 动态Tab */}
              <View
                style={{
                  position: 'fixed', bottom: 80, right: 16,
                  width: '52px', height: '52px',
                  background: 'linear-gradient(135deg, #F97316, #F59E0B)',
                  borderRadius: '26px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(249,115,22,0.4)', zIndex: 100
                }}
                onClick={() => Taro.navigateTo({ url: `/pages/publish-post/index?circleId=${circle.id}` })}
              >
                <Plus size={24} color="#ffffff" />
              </View>
            </View>
          ) : (
            renderLockedTab('动态')
          )}
        </TabsContent>

        {/* 找搭子 Tab */}
        <TabsContent value="activities">
          {isMember ? (
            <View className="relative">
              <ScrollView scrollY className="px-5 py-4" style={{ paddingBottom: '80px' }}>
                {activities.length === 0 ? (
                  <View className="flex flex-col items-center py-20">
                    <Users size={40} color="#D6D3D1" />
                    <Text className="block text-sm text-stone-400">暂无活动，来发起第一个吧</Text>
                  </View>
                ) : activities.map(act => (
                  <View key={act.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm" onClick={() => Taro.navigateTo({ url: `/pages/activity-detail/index?id=${act.id}` })}>
                    <View className="flex flex-row items-start justify-between mb-3">
                      <Text className="block text-sm font-bold text-stone-800 flex-1">{act.title}</Text>
                      <Badge className={statusMap[act.status]?.color || 'bg-stone-100 text-stone-400'}>
                        {statusMap[act.status]?.label || act.status}
                      </Badge>
                    </View>
                    <View className="gap-2">
                      <View className="flex flex-row items-center gap-2">
                        <Clock size={13} color="#A8A29E" />
                        <Text className="block text-xs text-stone-500">{formatTime(act.activity_time)}</Text>
                      </View>
                      <View className="flex flex-row items-center gap-2">
                        <MapPin size={13} color="#A8A29E" />
                        <Text className="block text-xs text-stone-500">{act.location}</Text>
                      </View>
                      {act.fee_description && (
                        <View className="flex flex-row items-center gap-2">
                          <DollarSign size={13} color="#A8A29E" />
                          <Text className="block text-xs text-stone-500">{act.fee_description}</Text>
                        </View>
                      )}
                      <View className="flex flex-row items-center gap-2">
                        <Users size={13} color="#A8A29E" />
                        <Text className="block text-xs text-stone-500">{act.current_participants}/{act.max_participants}人</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
              {/* FAB - 找搭子Tab */}
              <View
                style={{
                  position: 'fixed', bottom: 80, right: 16,
                  width: '52px', height: '52px',
                  background: 'linear-gradient(135deg, #F97316, #F59E0B)',
                  borderRadius: '26px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(249,115,22,0.4)', zIndex: 100
                }}
                onClick={() => Taro.navigateTo({ url: `/pages/publish-activity/index?circleId=${circle.id}` })}
              >
                <Plus size={24} color="#ffffff" />
              </View>
            </View>
          ) : (
            renderLockedTab('找搭子')
          )}
        </TabsContent>
      </Tabs>

      {/* 底部免责声明 */}
      <View className="px-5 py-4">
        <Text className="block text-xs text-stone-300 text-center">免责声明 | 隐私政策 | 用户协议</Text>
      </View>
    </View>
  )
}
