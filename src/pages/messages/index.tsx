import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Network } from '@/network'
import { useUserStore } from '@/store/user-store'
import { Heart, MessageCircle, ChevronRight } from 'lucide-react-taro'

export default function FeedSquare() {
  const { userInfo } = useUserStore()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeaturedPosts()
  }, [])

  const loadFeaturedPosts = async () => {
    try {
      setLoading(true)
      const userId = userInfo?.id || Taro.getStorageSync('userId')
      const res = await Network.request({
        url: '/api/posts/featured',
        method: 'GET',
        data: userId ? { user_id: userId } : {},
      })
      console.log('[FeedSquare] featured posts:', res.data)
      const list = res.data?.data || []
      setPosts(list)
    } catch (e) {
      console.error('[FeedSquare] load failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const goToCircleDetail = (circleId: string) => {
    Taro.navigateTo({ url: `/pages/circle-detail/index?id=${circleId}` })
  }

  const goToPostDetail = (postId: string) => {
    Taro.navigateTo({ url: `/pages/post-detail/index?id=${postId}` })
  }

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}分钟前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}天前`
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  if (loading) {
    return (
      <View className="flex flex-col min-h-screen bg-gray-50">
        <View className="px-4 pt-4 pb-2">
          <Text className="block text-xl font-bold text-gray-900">动态广场</Text>
          <Text className="block text-sm text-gray-500 mt-1">近一周圈子精选动态</Text>
        </View>
        {[1, 2, 3].map(i => (
          <View key={i} className="mx-4 mb-3">
            <Skeleton className="h-32 w-full rounded-xl" />
          </View>
        ))}
      </View>
    )
  }

  return (
    <View className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="block text-xl font-bold text-gray-900">动态广场</Text>
        <Text className="block text-sm text-gray-500 mt-1">近一周圈子精选动态，按热度排序</Text>
      </View>

      {/* Post List */}
      {posts.length === 0 ? (
        <View className="flex flex-col items-center justify-center py-20">
          <Text className="block text-gray-400 text-lg">暂无精选动态</Text>
          <Text className="block text-gray-400 text-sm mt-2">加入圈子后，精彩动态将出现在这里</Text>
        </View>
      ) : (
        <View className="px-4 pb-4">
          {posts.map((post) => (
            <Card key={post.id} className="mb-3 overflow-hidden">
              <CardContent className="p-4">
                {/* Circle info bar */}
                <View
                  className="flex flex-row items-center mb-3"
                  onClick={() => goToCircleDetail(post.circle_id)}
                >
                  <View className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center mr-2 overflow-hidden">
                    {post.circle_icon ? (
                      <Text className="text-xs">🔵</Text>
                    ) : (
                      <Text className="text-xs">📝</Text>
                    )}
                  </View>
                  <Text className="text-sm text-orange-600 font-medium">{post.circle_name}</Text>
                  <View className="ml-auto">
                    <ChevronRight size={14} color="#9ca3af" />
                  </View>
                </View>

                {/* User info */}
                <View className="flex flex-row items-center mb-2">
                  <View className="w-8 h-8 rounded-full bg-gray-200 mr-2 overflow-hidden">
                    {post.user_avatar ? (
                      <Text className="text-xs">👤</Text>
                    ) : (
                      <View className="w-full h-full flex items-center justify-center">
                        <Text className="text-xs text-gray-500">
                          {(post.user_nickname || '?')[0]}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="flex flex-col">
                    <Text className="block text-sm font-medium text-gray-900">{post.user_nickname}</Text>
                    <Text className="block text-xs text-gray-400">{formatTime(post.created_at)}</Text>
                  </View>
                </View>

                {/* Content */}
                <View onClick={() => goToPostDetail(post.id)}>
                  <Text className="block text-sm text-gray-800 leading-relaxed mb-2" numberOfLines={4}>
                    {post.content}
                  </Text>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <View className="flex flex-row flex-wrap gap-1 mb-2">
                      {post.tags.map((tag: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          <Text className="text-xs">#{tag}</Text>
                        </Badge>
                      ))}
                    </View>
                  )}

                  {/* Interaction bar */}
                  <View className="flex flex-row items-center gap-4 mt-2 pt-2 border-t border-gray-100">
                    <View className="flex flex-row items-center">
                      <Heart size={14} color="#ef4444" />
                      <Text className="block text-xs text-gray-500 ml-1">{post.likes_count || 0}</Text>
                    </View>
                    <View className="flex flex-row items-center">
                      <MessageCircle size={14} color="#9ca3af" />
                      <Text className="block text-xs text-gray-500 ml-1">{post.comments_count || 0}</Text>
                    </View>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))}
        </View>
      )}
    </View>
  )
}
