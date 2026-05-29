import { View, ScrollView, Text } from '@tarojs/components'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Trophy, Image, ListChecks, Users, MessageSquare, MapPin, Clock, DollarSign, ChevronRight, Heart, ThumbsUp, MessageCircle, Plus, Lock } from 'lucide-react-taro'

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
  const [circle, setCircle] = useState<Circle | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [activeTab, setActiveTab] = useState('resources')
  const [resources, setResources] = useState<Resource[]>([])
  const [resourceItems, setResourceItems] = useState<Record<string, any[]>>({})
  const [posts, setPosts] = useState<Post[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const userId = Taro.getStorageSync('user_id') || ''

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
        // Load items for each resource
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
      <Card className="mb-3">
        <CardContent className="p-4">
          <View className="flex flex-row items-center gap-2 mb-3">
            <Trophy size={18} color="#F97316" />
            <Text className="block text-sm font-semibold text-neutral-900">{resource.title}</Text>
          </View>
          {resource.description && (
            <Text className="block text-xs text-neutral-500 mb-3">{resource.description}</Text>
          )}
          {items.length > 0 ? items.map((item: any, idx: number) => (
            <View
              key={item.id || idx}
              className="flex flex-row items-center py-2 border-b border-neutral-100 last:border-b-0"
              onClick={() => Taro.navigateTo({ url: `/pages/item-detail/index?id=${item.id}` })}
            >
              <View className="w-7 flex items-center justify-center">
                {idx < 3 ? (
                  <View className={`w-6 h-6 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-neutral-300' : 'bg-orange-400'}`}>
                    <Text className="block text-white text-xs font-bold">{idx + 1}</Text>
                  </View>
                ) : (
                  <Text className="block text-sm text-neutral-400 font-medium">{idx + 1}</Text>
                )}
              </View>
              <View className="flex-1 ml-2">
                <Text className="block text-sm font-medium text-neutral-800">{item.title}</Text>
                {item.subtitle && <Text className="block text-xs text-neutral-400">{item.subtitle}</Text>}
              </View>
              <View className="flex flex-row items-center gap-1">
                <Heart size={10} color={item.is_liked ? '#ef4444' : '#9ca3af'} filled={item.is_liked} />
                <Text className="block text-xs text-neutral-500">{item.like_count || 0}</Text>
              </View>
            </View>
          )) : (
            <Text className="block text-xs text-neutral-400 py-3 text-center">暂无条目</Text>
          )}
          <View className="mt-2" onClick={() => Taro.navigateTo({ url: `/pages/resource-detail/index?id=${resource.id}` })}>
            <View className="flex flex-row items-center justify-center py-2">
              <Text className="block text-xs text-orange-500 mr-1">查看全部</Text>
              <ChevronRight size={12} color="#F97316" />
            </View>
          </View>
        </CardContent>
      </Card>
    )
  }

  // 渲染图集模板
  const renderGallery = (resource: Resource) => {
    const items = resourceItems[resource.id] || []
    return (
      <Card className="mb-3">
        <CardContent className="p-4">
          <View className="flex flex-row items-center gap-2 mb-3">
            <Image size={18} color="#F97316" />
            <Text className="block text-sm font-semibold text-neutral-900">{resource.title}</Text>
          </View>
          {resource.description && (
            <Text className="block text-xs text-neutral-500 mb-3">{resource.description}</Text>
          )}
          {items.length > 0 ? (
            <View className="grid grid-cols-3 gap-2">
              {items.slice(0, 6).map((item: any, idx: number) => (
                <View
                  key={item.id || idx}
                  className="flex flex-col items-center p-2 bg-neutral-50 rounded-lg"
                  onClick={() => Taro.navigateTo({ url: `/pages/item-detail/index?id=${item.id}` })}
                >
                  <View className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-50 rounded-lg flex items-center justify-center mb-1">
                    <Text className="block text-lg font-bold text-orange-400">{item.title?.charAt(0) || '?'}</Text>
                  </View>
                  <Text className="block text-xs font-medium text-neutral-800 text-center">{item.title}</Text>
                  {item.subtitle && <Text className="block text-xs text-neutral-400 text-center">{item.subtitle}</Text>}
                </View>
              ))}
            </View>
          ) : (
            <Text className="block text-xs text-neutral-400 py-3 text-center">暂无条目</Text>
          )}
          <View className="mt-2" onClick={() => Taro.navigateTo({ url: `/pages/resource-detail/index?id=${resource.id}` })}>
            <View className="flex flex-row items-center justify-center py-2">
              <Text className="block text-xs text-orange-500 mr-1">查看全部</Text>
              <ChevronRight size={12} color="#F97316" />
            </View>
          </View>
        </CardContent>
      </Card>
    )
  }

  // 渲染列表模板
  const renderList = (resource: Resource) => {
    const items = resourceItems[resource.id] || []
    return (
      <Card className="mb-3">
        <CardContent className="p-4">
          <View className="flex flex-row items-center gap-2 mb-3">
            <ListChecks size={18} color="#F97316" />
            <Text className="block text-sm font-semibold text-neutral-900">{resource.title}</Text>
          </View>
          {resource.description && (
            <Text className="block text-xs text-neutral-500 mb-3">{resource.description}</Text>
          )}
          {items.length > 0 ? items.map((item: any, idx: number) => (
            <View
              key={item.id || idx}
              className="flex flex-row items-center py-2 border-b border-neutral-100 last:border-b-0"
              onClick={() => Taro.navigateTo({ url: `/pages/item-detail/index?id=${item.id}` })}
            >
              <View className="flex-1">
                <Text className="block text-sm font-medium text-neutral-800">{item.title}</Text>
                {item.subtitle && <Text className="block text-xs text-neutral-400">{item.subtitle}</Text>}
              </View>
              <View className="flex flex-row items-center gap-2">
                {Array.isArray(item.tags) && item.tags.slice(0, 2).map((tag: string, ti: number) => (
                  <Badge key={ti} className="bg-orange-50 text-orange-600 text-xs px-1 py-0">{tag}</Badge>
                ))}
                <View className="flex flex-row items-center gap-0.5">
                  <Heart size={10} color={item.is_liked ? '#ef4444' : '#9ca3af'} filled={item.is_liked} />
                  <Text className="block text-xs text-neutral-500">{item.like_count || 0}</Text>
                </View>
              </View>
            </View>
          )) : (
            <Text className="block text-xs text-neutral-400 py-3 text-center">暂无条目</Text>
          )}
          <View className="mt-2" onClick={() => Taro.navigateTo({ url: `/pages/resource-detail/index?id=${resource.id}` })}>
            <View className="flex flex-row items-center justify-center py-2">
              <Text className="block text-xs text-orange-500 mr-1">查看全部</Text>
              <ChevronRight size={12} color="#F97316" />
            </View>
          </View>
        </CardContent>
      </Card>
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
    <View className="flex flex-col items-center justify-center py-20">
      <View className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
        <Lock size={28} color="#9ca3af" />
      </View>
      <Text className="block text-base font-medium text-neutral-600 mb-2">加入圈子后可见</Text>
      <Text className="block text-sm text-neutral-400 mb-4">加入圈子即可查看{tabName}内容</Text>
      <Button className="bg-orange-500 text-white rounded-xl px-6" onClick={handleJoin}>
        <Text className="text-white">加入圈子</Text>
      </Button>
    </View>
  )

  const statusMap: Record<string, { label: string; color: string }> = {
    recruiting: { label: '招募中', color: 'bg-green-50 text-green-600' },
    full: { label: '已满员', color: 'bg-yellow-50 text-yellow-600' },
    cancelled: { label: '已取消', color: 'bg-red-50 text-red-600' },
    completed: { label: '已完成', color: 'bg-neutral-50 text-neutral-500' },
  }

  if (!circle) {
    return (
      <View className="flex items-center justify-center h-screen bg-neutral-50">
        <Text className="block text-neutral-400">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-full bg-neutral-50">
      {/* Circle Header - 右上角加入/已加入按钮 */}
      <View className="bg-white px-4 pt-3 pb-4">
        <View className="flex flex-row items-center gap-3 mb-2">
          <View className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
            <Text className="block text-2xl">{circle.category === '运动' ? '⛷️' : circle.category === '文化' ? '📚' : circle.category === '生活' ? '☕' : '🏕️'}</Text>
          </View>
          <View className="flex-1">
            <Text className="block text-lg font-bold text-neutral-900">{circle.name}</Text>
            <Text className="block text-xs text-neutral-400 mt-1">{circle.description}</Text>
          </View>
          {/* 右上角加入/已加入按钮 */}
          {isMember ? (
            <View className="bg-neutral-100 rounded-lg px-3 py-1 flex items-center" onClick={handleLeave}>
              <Text className="block text-xs text-neutral-500">已加入</Text>
            </View>
          ) : (
            <Button size="sm" className="bg-orange-500 text-white rounded-lg" onClick={handleJoin}>
              <Text className="text-white text-xs">加入</Text>
            </Button>
          )}
        </View>
        <View className="flex flex-row items-center gap-4 mt-2">
          <View className="flex flex-row items-center gap-1">
            <Users size={14} color="#737373" />
            <Text className="block text-xs text-neutral-500">{circle.member_count} 成员</Text>
          </View>
          <View className="flex flex-row items-center gap-1">
            <MessageSquare size={14} color="#737373" />
            <Text className="block text-xs text-neutral-500">活跃度 {circle.activity_score}</Text>
          </View>
          <View className="flex flex-row flex-wrap gap-1 ml-auto">
            {circle.tags?.slice(0, 3).map((tag, i) => (
              <Badge key={i} className="bg-orange-50 text-orange-600 text-xs">{tag}</Badge>
            ))}
          </View>
        </View>
      </View>

      <Separator />

      {/* Three Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="resources" className="flex-1">资料库</TabsTrigger>
          <TabsTrigger value="feed" className="flex-1">动态</TabsTrigger>
          <TabsTrigger value="activities" className="flex-1">找搭子</TabsTrigger>
        </TabsList>

        {/* 资料库 Tab - 所有人可见 */}
        <TabsContent value="resources">
          <ScrollView scrollY className="px-4 py-3">
            {resources.length === 0 ? (
              <View className="flex flex-col items-center py-16">
                <Text className="block text-3xl mb-2">📋</Text>
                <Text className="block text-sm text-neutral-400">暂无资料，管理员可在后台添加模板</Text>
              </View>
            ) : (
              resources.sort((a, b) => a.sort_order - b.sort_order).map(rsc => (
                <View key={rsc.id}>{renderResource(rsc)}</View>
              ))
            )}
          </ScrollView>
        </TabsContent>

        {/* 动态 Feed Tab - 未加入显示锁定 */}
        <TabsContent value="feed">
          {isMember ? (
            <View className="relative">
              <ScrollView scrollY className="px-4 py-3" style={{ paddingBottom: '80px' }}>
                {posts.length === 0 ? (
                  <View className="flex flex-col items-center py-16">
                    <Text className="block text-3xl mb-2">💬</Text>
                    <Text className="block text-sm text-neutral-400">暂无动态，来发第一条吧</Text>
                  </View>
                ) : posts.map(post => (
                  <Card key={post.id} className="mb-3">
                    <CardContent className="p-4">
                      <View className="flex flex-row items-center gap-2 mb-2">
                        <View className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <Text className="block text-xs">{post.nickname?.charAt(0) || '?'}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="block text-sm font-medium text-neutral-800">{post.nickname || '用户'}</Text>
                          <Text className="block text-xs text-neutral-400">{formatDate(post.created_at)}</Text>
                        </View>
                      </View>
                      <Text className="block text-sm text-neutral-700 mb-2">{post.content}</Text>
                      {post.tags?.length > 0 && (
                        <View className="flex flex-row flex-wrap gap-1 mb-2">
                          {post.tags.map((tag, i) => (
                            <Badge key={i} className="bg-orange-50 text-orange-600 text-xs">#{tag}</Badge>
                          ))}
                        </View>
                      )}
                      <View className="flex flex-row items-center gap-4 mt-2 pt-2 border-t border-neutral-100">
                        <View className="flex flex-row items-center gap-1" onClick={() => handleLike(post.id)}>
                          <ThumbsUp size={14} color="#737373" />
                          <Text className="block text-xs text-neutral-500">{post.like_count}</Text>
                        </View>
                        <View className="flex flex-row items-center gap-1" onClick={() => Taro.navigateTo({ url: `/pages/post-detail/index?id=${post.id}` })}>
                          <MessageCircle size={14} color="#737373" />
                          <Text className="block text-xs text-neutral-500">{post.comment_count}</Text>
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                ))}
              </ScrollView>
              {/* 悬浮发布按钮 - 动态Tab */}
              <View
                style={{
                  position: 'fixed', bottom: 80, right: 16,
                  width: '48px', height: '48px',
                  backgroundColor: '#F97316', borderRadius: '24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(249,115,22,0.4)', zIndex: 100
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

        {/* 找搭子 Tab - 未加入显示锁定 */}
        <TabsContent value="activities">
          {isMember ? (
            <View className="relative">
              <ScrollView scrollY className="px-4 py-3" style={{ paddingBottom: '80px' }}>
                {activities.length === 0 ? (
                  <View className="flex flex-col items-center py-16">
                    <Text className="block text-3xl mb-2">🎯</Text>
                    <Text className="block text-sm text-neutral-400">暂无活动，来发起第一个吧</Text>
                  </View>
                ) : activities.map(act => (
                  <Card key={act.id} className="mb-3" onClick={() => Taro.navigateTo({ url: `/pages/activity-detail/index?id=${act.id}` })}>
                    <CardContent className="p-4">
                      <View className="flex flex-row items-start justify-between mb-2">
                        <Text className="block text-sm font-semibold text-neutral-900 flex-1">{act.title}</Text>
                        <Badge className={statusMap[act.status]?.color || 'bg-neutral-50 text-neutral-500'}>
                          {statusMap[act.status]?.label || act.status}
                        </Badge>
                      </View>
                      <View className="space-y-1">
                        <View className="flex flex-row items-center gap-2">
                          <Clock size={12} color="#737373" />
                          <Text className="block text-xs text-neutral-500">{formatTime(act.activity_time)}</Text>
                        </View>
                        <View className="flex flex-row items-center gap-2">
                          <MapPin size={12} color="#737373" />
                          <Text className="block text-xs text-neutral-500">{act.location}</Text>
                        </View>
                        {act.fee_description && (
                          <View className="flex flex-row items-center gap-2">
                            <DollarSign size={12} color="#737373" />
                            <Text className="block text-xs text-neutral-500">{act.fee_description}</Text>
                          </View>
                        )}
                        <View className="flex flex-row items-center gap-2">
                          <Users size={12} color="#737373" />
                          <Text className="block text-xs text-neutral-500">{act.current_participants}/{act.max_participants}人</Text>
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                ))}
              </ScrollView>
              {/* 悬浮发布按钮 - 找搭子Tab */}
              <View
                style={{
                  position: 'fixed', bottom: 80, right: 16,
                  width: '48px', height: '48px',
                  backgroundColor: '#F97316', borderRadius: '24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(249,115,22,0.4)', zIndex: 100
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
      <View className="px-4 py-3 bg-neutral-50 border-t border-neutral-100">
        <Text className="block text-xs text-neutral-300 text-center">
          免责声明 | 隐私政策 | 用户协议
        </Text>
      </View>
    </View>
  )
}
