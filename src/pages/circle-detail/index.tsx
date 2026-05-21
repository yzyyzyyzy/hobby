import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { useUserStore } from '@/store/user-store'
import { Users, Flame, Heart, MessageCircle, MapPin, Clock, BookOpen, FileText, UserPlus } from 'lucide-react-taro'

interface CircleInfo {
  id: string
  name: string
  category: string
  description: string
  member_count: number
  activity_score: number
  tags: string[]
  is_joined: boolean
  owner_id: string
}

interface PostItem {
  id: string
  content: string
  images: string[]
  tags: string[]
  likes_count: number
  comments_count: number
  user_nickname: string
  user_avatar: string
  created_at: string
}

interface ActivityItem {
  id: string
  title: string
  description: string
  activity_time: string
  location: string
  level_requirement: string
  max_participants: number
  current_participants: number
  fee_description: string
  status: string
  user_nickname: string
}

interface ResourceItem {
  id: string
  title: string
  resource_type: string
  cover_url: string
  created_at: string
}

export default function CircleDetail() {
  const { isLoggedIn } = useUserStore()
  const [circleId, setCircleId] = useState('')
  const [circle, setCircle] = useState<CircleInfo | null>(null)
  const [activeTab, setActiveTab] = useState('resource')
  const [posts, setPosts] = useState<PostItem[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [postSort, setPostSort] = useState<'latest' | 'hot'>('latest')

  useEffect(() => {
    const instance = Taro.getCurrentInstance()
    const id = instance?.router?.params?.id
    const tab = instance?.router?.params?.tab
    if (id) {
      setCircleId(id)
      loadCircleDetail(id)
    }
    if (tab === 'feed') setActiveTab('feed')
    else if (tab === 'buddy') setActiveTab('buddy')
    else if (tab === 'resource') setActiveTab('resource')
  }, [])

  useEffect(() => {
    if (circleId) {
      if (activeTab === 'feed') loadPosts()
      else if (activeTab === 'buddy') loadActivities()
      else if (activeTab === 'resource') loadResources()
    }
  }, [activeTab, circleId, postSort])

  const loadCircleDetail = async (id: string) => {
    try {
      const res = await Network.request({ url: `/api/circles/${id}`, method: 'GET' })
      console.log('Circle detail:', res.data)
      if (res.data?.data) setCircle(res.data.data)
    } catch (err) {
      console.error('Load circle detail failed:', err)
    }
  }

  const loadPosts = async () => {
    try {
      const res = await Network.request({
        url: `/api/circles/${circleId}/posts?sort=${postSort}`,
        method: 'GET',
      })
      console.log('Posts:', res.data)
      if (res.data?.data) setPosts(res.data.data)
    } catch (err) {
      console.error('Load posts failed:', err)
    }
  }

  const loadActivities = async () => {
    try {
      const res = await Network.request({
        url: `/api/circles/${circleId}/activities`,
        method: 'GET',
      })
      console.log('Activities:', res.data)
      if (res.data?.data) setActivities(res.data.data)
    } catch (err) {
      console.error('Load activities failed:', err)
    }
  }

  const loadResources = async () => {
    try {
      const res = await Network.request({
        url: `/api/circles/${circleId}/resources`,
        method: 'GET',
      })
      console.log('Resources:', res.data)
      if (res.data?.data) setResources(res.data.data)
    } catch (err) {
      console.error('Load resources failed:', err)
    }
  }

  const handleJoin = async () => {
    if (!isLoggedIn) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    try {
      const url = circle?.is_joined ? '/api/circles/leave' : '/api/circles/join'
      const res = await Network.request({
        url,
        method: 'POST',
        data: { circle_id: circleId },
      })
      console.log('Join/leave response:', res.data)
      if (res.data?.data) {
        setCircle((prev) =>
          prev
            ? {
                ...prev,
                is_joined: !prev.is_joined,
                member_count: prev.member_count + (prev.is_joined ? -1 : 1),
              }
            : null
        )
        Taro.showToast({ title: circle?.is_joined ? '已退出' : '已加入', icon: 'success' })
      }
    } catch (err) {
      console.error('Join/leave failed:', err)
    }
  }

  const handleLikePost = async (postId: string) => {
    try {
      const res = await Network.request({
        url: '/api/posts/like',
        method: 'POST',
        data: { post_id: postId },
      })
      console.log('Like response:', res.data)
      if (res.data?.data) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p
          )
        )
      }
    } catch (err) {
      console.error('Like failed:', err)
    }
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    recruiting: { label: '招募中', color: 'bg-green-50 text-green-600' },
    full: { label: '已满员', color: 'bg-yellow-50 text-yellow-600' },
    cancelled: { label: '已取消', color: 'bg-red-50 text-red-600' },
    completed: { label: '已完成', color: 'bg-neutral-100 text-neutral-500' },
  }

  return (
    <View className="h-full bg-neutral-50">
      {/* 圈子头部信息 */}
      {circle && (
        <View className="bg-white px-4 pt-4 pb-3">
          <View className="flex flex-row items-center gap-3">
            <View className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Text className="block text-2xl">{circle.name[0]}</Text>
            </View>
            <View className="flex-1">
              <Text className="block text-lg font-bold text-neutral-900">{circle.name}</Text>
              <View className="flex flex-row items-center gap-3 mt-1">
                <View className="flex flex-row items-center gap-1">
                  <Users size={12} color="#737373" />
                  <Text className="block text-xs text-neutral-500">{circle.member_count}人</Text>
                </View>
                <View className="flex flex-row items-center gap-1">
                  <Flame size={12} color="#F97316" />
                  <Text className="block text-xs text-orange-500">{circle.activity_score}</Text>
                </View>
              </View>
            </View>
            <Button
              size="sm"
              className={circle.is_joined ? 'bg-neutral-100 text-neutral-600' : 'bg-orange-500 text-white'}
              onClick={handleJoin}
            >
              <Text className={circle.is_joined ? 'text-neutral-600' : 'text-white'}>
                {circle.is_joined ? '已加入' : '加入'}
              </Text>
            </Button>
          </View>
          {circle.description && (
            <Text className="block text-xs text-neutral-500 mt-2">{circle.description}</Text>
          )}
          {circle.tags && circle.tags.length > 0 && (
            <View className="flex flex-row flex-wrap gap-1 mt-2">
              {circle.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </View>
          )}
        </View>
      )}

      <Separator />

      {/* 三Tab 内容 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as string)}>
        <TabsList className="w-full">
          <TabsTrigger value="resource" className="flex-1">
            <View className="flex flex-row items-center gap-1">
              <BookOpen size={14} color={activeTab === 'resource' ? '#F97316' : '#737373'} />
              <Text>资料库</Text>
            </View>
          </TabsTrigger>
          <TabsTrigger value="feed" className="flex-1">
            <View className="flex flex-row items-center gap-1">
              <FileText size={14} color={activeTab === 'feed' ? '#F97316' : '#737373'} />
              <Text>动态</Text>
            </View>
          </TabsTrigger>
          <TabsTrigger value="buddy" className="flex-1">
            <View className="flex flex-row items-center gap-1">
              <UserPlus size={14} color={activeTab === 'buddy' ? '#F97316' : '#737373'} />
              <Text>找搭子</Text>
            </View>
          </TabsTrigger>
        </TabsList>

        {/* 资料库 Tab */}
        <TabsContent value="resource">
          <View className="px-4 py-3 space-y-3">
            {resources.length > 0 ? (
              resources.map((r) => (
                <Card key={r.id} onClick={() => Taro.navigateTo({ url: `/pages/resource-detail/index?id=${r.id}` })}>
                  <CardContent className="p-4">
                    <View className="flex flex-row items-center gap-3">
                      <View className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen size={20} color="#3B82F6" />
                      </View>
                      <View className="flex-1">
                        <Text className="block text-sm font-semibold text-neutral-900">{r.title}</Text>
                        <View className="flex flex-row items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{r.resource_type}</Badge>
                        </View>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              ))
            ) : (
              <View className="flex flex-col items-center py-12">
                <Text className="block text-3xl mb-2">📚</Text>
                <Text className="block text-sm text-neutral-400">暂无资料，主理人可编辑模板</Text>
              </View>
            )}
          </View>
        </TabsContent>

        {/* 动态 Feed Tab */}
        <TabsContent value="feed">
          {/* 排序选项 */}
          <View className="flex flex-row px-4 py-2 gap-3">
            <Badge
              variant={postSort === 'latest' ? 'default' : 'outline'}
              className={postSort === 'latest' ? 'bg-orange-500 text-white' : ''}
              onClick={() => setPostSort('latest')}
            >
              最新
            </Badge>
            <Badge
              variant={postSort === 'hot' ? 'default' : 'outline'}
              className={postSort === 'hot' ? 'bg-orange-500 text-white' : ''}
              onClick={() => setPostSort('hot')}
            >
              热门
            </Badge>
          </View>

          <View className="px-4 space-y-3 pb-4">
            {posts.length > 0 ? (
              posts.map((post) => (
                <Card key={post.id} onClick={() => Taro.navigateTo({ url: `/pages/post-detail/index?id=${post.id}` })}>
                  <CardContent className="p-4">
                    <View className="flex flex-row items-center gap-2 mb-2">
                      <View className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center">
                        <Text className="block text-xs">{post.user_nickname?.[0] || 'U'}</Text>
                      </View>
                      <Text className="block text-sm font-medium text-neutral-700">{post.user_nickname}</Text>
                      <Text className="block text-xs text-neutral-400 ml-auto">{post.created_at?.slice(5, 10)}</Text>
                    </View>
                    <Text className="block text-sm text-neutral-800 mb-2">{post.content}</Text>
                    {post.tags && post.tags.length > 0 && (
                      <View className="flex flex-row flex-wrap gap-1 mb-2">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
                        ))}
                      </View>
                    )}
                    <View className="flex flex-row items-center gap-4 mt-2">
                      <View className="flex flex-row items-center gap-1" onClick={(e) => { e.stopPropagation && e.stopPropagation(); handleLikePost(post.id) }}>
                        <Heart size={14} color="#737373" />
                        <Text className="block text-xs text-neutral-500">{post.likes_count}</Text>
                      </View>
                      <View className="flex flex-row items-center gap-1">
                        <MessageCircle size={14} color="#737373" />
                        <Text className="block text-xs text-neutral-500">{post.comments_count}</Text>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              ))
            ) : (
              <View className="flex flex-col items-center py-12">
                <Text className="block text-3xl mb-2">✍️</Text>
                <Text className="block text-sm text-neutral-400">暂无动态，来发第一条吧</Text>
              </View>
            )}
          </View>
        </TabsContent>

        {/* 找搭子 Tab */}
        <TabsContent value="buddy">
          <View className="px-4 py-3 space-y-3">
            {activities.length > 0 ? (
              activities.map((act) => (
                <Card key={act.id} onClick={() => Taro.navigateTo({ url: `/pages/activity-detail/index?id=${act.id}` })}>
                  <CardContent className="p-4">
                    <View className="flex flex-row items-start justify-between mb-2">
                      <Text className="block text-sm font-semibold text-neutral-900 flex-1">{act.title}</Text>
                      <Badge className={statusMap[act.status]?.color || 'bg-neutral-100 text-neutral-500'}>
                        {statusMap[act.status]?.label || act.status}
                      </Badge>
                    </View>
                    {act.description && (
                      <Text className="block text-xs text-neutral-500 mb-2 line-clamp-2">{act.description}</Text>
                    )}
                    <View className="flex flex-row items-center gap-3 flex-wrap">
                      <View className="flex flex-row items-center gap-1">
                        <Clock size={12} color="#737373" />
                        <Text className="block text-xs text-neutral-500">{act.activity_time?.slice(0, 16)}</Text>
                      </View>
                      {act.location && (
                        <View className="flex flex-row items-center gap-1">
                          <MapPin size={12} color="#737373" />
                          <Text className="block text-xs text-neutral-500">{act.location}</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex flex-row items-center gap-3 mt-2">
                      <View className="flex flex-row items-center gap-1">
                        <Users size={12} color="#737373" />
                        <Text className="block text-xs text-neutral-500">
                          {act.current_participants}/{act.max_participants || '不限'}
                        </Text>
                      </View>
                      {act.fee_description && (
                        <Badge variant="outline" className="text-xs">{act.fee_description}</Badge>
                      )}
                    </View>
                  </CardContent>
                </Card>
              ))
            ) : (
              <View className="flex flex-col items-center py-12">
                <Text className="block text-3xl mb-2">🤝</Text>
                <Text className="block text-sm text-neutral-400">暂无活动，来发起一个吧</Text>
              </View>
            )}
          </View>
        </TabsContent>
      </Tabs>
    </View>
  )
}
