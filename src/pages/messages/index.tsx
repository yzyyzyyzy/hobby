import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Network } from '@/network'
import { useUserStore } from '@/store/user-store'
import { Heart, MessageCircle, ChevronRight, TrendingUp, Flame } from 'lucide-react-taro'

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
      const userId = userInfo?.id || Taro.getStorageSync('user_id')
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
      <View className="flex flex-col min-h-screen bg-stone-50">
        <View className="bg-gradient-to-br from-orange-500 to-amber-400 px-5 pt-6 pb-8">
          <View className="flex flex-row items-center gap-2">
            <Flame size={24} color="#FFFFFF" />
            <Text className="block text-xl font-bold text-white">动态广场</Text>
          </View>
          <Text className="block text-sm text-orange-100 mt-1">近一周圈子精选动态</Text>
        </View>
        <View className="px-5 -mt-4">
          {[1, 2, 3].map(i => (
            <View key={i} className="mb-3 bg-white rounded-2xl overflow-hidden shadow-sm">
              <Skeleton className="h-36 w-full" />
            </View>
          ))}
        </View>
      </View>
    )
  }

  return (
    <View className="flex flex-col min-h-screen bg-stone-50">
      {/* Header with gradient */}
      <View className="bg-gradient-to-br from-orange-500 to-amber-400 px-5 pt-6 pb-8">
        <View className="flex flex-row items-center gap-2">
          <Flame size={24} color="#FFFFFF" />
          <Text className="block text-xl font-bold text-white">动态广场</Text>
        </View>
        <Text className="block text-sm text-orange-100 mt-1">近一周圈子精选动态，按热度排序</Text>
      </View>

      {/* Post List */}
      {posts.length === 0 ? (
        <View className="flex flex-col items-center justify-center py-24 px-5">
          <View className="w-20 h-20 bg-stone-100 rounded-3xl flex items-center justify-center mb-5">
            <TrendingUp size={32} color="#D6D3D1" />
          </View>
          <Text className="block text-base font-semibold text-stone-500 mb-2">暂无精选动态</Text>
          <Text className="block text-sm text-stone-400 text-center">加入圈子后，精彩动态将出现在这里</Text>
        </View>
      ) : (
        <ScrollView scrollY className="px-5 -mt-4 pb-4">
          {posts.map((post, index) => (
            <View
              key={post.id}
              className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm"
              onClick={() => goToPostDetail(post.id)}
            >
              {/* Hot indicator for top 3 */}
              {index < 3 && (
                <View className="bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2">
                  <View className="flex flex-row items-center gap-2">
                    <Flame size={12} color="#FFFFFF" />
                    <Text className="block text-white text-xs font-bold">HOT #{index + 1}</Text>
                  </View>
                </View>
              )}

              <View className="p-4">
                {/* Circle info bar */}
                <View
                  className="flex flex-row items-center mb-3 bg-stone-50 rounded-xl px-3 py-2"
                  onClick={(e) => { e.stopPropagation(); goToCircleDetail(post.circle_id) }}
                >
                  <View className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center">
                    <Text className="block text-white" style={{ fontSize: '10px' }}>{(post.circle_name || '圈')[0]}</Text>
                  </View>
                  <Text className="block text-sm text-stone-600 font-medium ml-2 flex-1">{post.circle_name}</Text>
                  <ChevronRight size={14} color="#A8A29E" />
                </View>

                {/* User info */}
                <View className="flex flex-row items-center mb-3">
                  <View className="w-9 h-9 bg-gradient-to-br from-stone-300 to-stone-400 rounded-full flex items-center justify-center mr-3">
                    <Text className="block text-white text-xs font-bold">{(post.user_nickname || '?')[0]}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="block text-sm font-semibold text-stone-700">{post.user_nickname}</Text>
                    <Text className="block text-xs text-stone-400">{formatTime(post.created_at)}</Text>
                  </View>
                  <View className="flex flex-row items-center gap-1 bg-red-50 rounded-full px-3 py-1">
                    <Heart size={11} color="#EF4444" filled />
                    <Text className="block text-xs text-red-500 font-semibold">{post.likes_count || 0}</Text>
                  </View>
                </View>

                {/* Content */}
                <Text className="block text-sm text-stone-600 leading-relaxed mb-3" numberOfLines={4}>
                  {post.content}
                </Text>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <View className="flex flex-row flex-wrap gap-2 mb-3">
                    {post.tags.map((tag: string, idx: number) => (
                      <Badge key={idx} className="bg-orange-50 text-orange-500 border-0" style={{ fontSize: '11px' }}>#{tag}</Badge>
                    ))}
                  </View>
                )}

                {/* Interaction bar */}
                <View className="flex flex-row items-center gap-5 pt-3 border-t border-stone-100">
                  <View className="flex flex-row items-center gap-2">
                    <Heart size={15} color="#A8A29E" />
                    <Text className="block text-xs text-stone-400">{post.likes_count || 0}</Text>
                  </View>
                  <View className="flex flex-row items-center gap-2">
                    <MessageCircle size={15} color="#A8A29E" />
                    <Text className="block text-xs text-stone-400">{post.comments_count || 0}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}
