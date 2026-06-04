import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Skeleton } from '@/components/ui/skeleton'
import { Network } from '@/network'
import { useUserStore } from '@/store/user-store'
import { Heart, MessageCircle, ChevronRight, TrendingUp, Flame, CirclePlus } from 'lucide-react-taro'

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

  const goToPublish = () => {
    if (!userInfo?.id) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    Taro.navigateTo({ url: '/pages/publish-post/index' })
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
      <View className="h-full bg-stone-50">
        <View style={{ background: 'linear-gradient(to bottom, #F97316, #EA580C)', paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '24px' }}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text className="block text-xl font-bold text-white">动态</Text>
              <Text className="block text-xs text-orange-100 mt-1">圈子精选，按热度排序</Text>
            </View>
          </View>
        </View>
        <View style={{ paddingLeft: '20px', paddingRight: '20px', marginTop: '-16px' }}>
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
    <View className="h-full bg-stone-50">
      {/* Header - same style as 圈子 page */}
      <View style={{ background: 'linear-gradient(to bottom, #F97316, #EA580C)', paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '24px' }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text className="block text-xl font-bold text-white">动态</Text>
            <Text className="block text-xs text-orange-100 mt-1">近一周圈子精选动态</Text>
          </View>
          <View onClick={goToPublish} style={{ backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: '20px', paddingLeft: '12px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
            <CirclePlus size={14} color="#FFFFFF" />
            <Text className="block text-xs text-white font-medium">发布</Text>
          </View>
        </View>
      </View>

      {/* Post List */}
      {posts.length === 0 ? (
        <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '96px', paddingLeft: '20px', paddingRight: '20px' }}>
          <View style={{ width: '80px', height: '80px', backgroundColor: '#F5F5F4', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <TrendingUp size={32} color="#D6D3D1" />
          </View>
          <Text style={{ fontSize: '15px', fontWeight: '600', color: '#78716C', marginBottom: '8px' }}>暂无精选动态</Text>
          <Text style={{ fontSize: '13px', color: '#A8A29E', textAlign: 'center' }}>加入圈子后，精彩动态将出现在这里</Text>
        </View>
      ) : (
        <ScrollView scrollY style={{ flex: 1, paddingLeft: '20px', paddingRight: '20px', marginTop: '-16px', paddingBottom: '16px' }}>
          {posts.map((post, index) => (
            <View
              key={post.id}
              className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm"
              onClick={() => goToPostDetail(post.id)}
            >
              {/* Hot indicator for top 3 */}
              {index < 3 && (
                <View style={{ background: 'linear-gradient(to right, #F97316, #FBBF24)', paddingLeft: '16px', paddingRight: '16px', paddingTop: '6px', paddingBottom: '6px' }}>
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
                    <Flame size={12} color="#FFFFFF" />
                    <Text style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: '700' }}>HOT #{index + 1}</Text>
                  </View>
                </View>
              )}

              <View style={{ padding: '16px' }}>
                {/* Circle info bar */}
                <View
                  style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '12px', backgroundColor: '#FAFAF9', borderRadius: '12px', paddingLeft: '12px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px' }}
                  onClick={(e) => { e.stopPropagation(); goToCircleDetail(post.circle_id) }}
                >
                  <View style={{ width: '24px', height: '24px', borderRadius: '8px', background: 'linear-gradient(to bottom right, #FB923C, #FCD34D)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: '10px', color: '#FFFFFF', fontWeight: '700' }}>{(post.circle_name || '圈')[0]}</Text>
                  </View>
                  <Text style={{ fontSize: '13px', color: '#57534E', fontWeight: '500', marginLeft: '8px', flex: 1 }}>{post.circle_name}</Text>
                  <ChevronRight size={14} color="#A8A29E" />
                </View>

                {/* User info */}
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '12px' }}>
                  <View style={{ width: '36px', height: '36px', background: 'linear-gradient(to bottom right, #D6D3D1, #A8A29E)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
                    <Text style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: '700' }}>{(post.user_nickname || '?')[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: '13px', fontWeight: '600', color: '#44403C' }}>{post.user_nickname}</Text>
                    <Text style={{ fontSize: '11px', color: '#A8A29E' }}>{formatTime(post.created_at)}</Text>
                  </View>
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', backgroundColor: '#FEF2F2', borderRadius: '20px', paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px' }}>
                    <Heart size={11} color="#EF4444" filled />
                    <Text style={{ fontSize: '12px', color: '#EF4444', fontWeight: '600' }}>{post.likes_count || 0}</Text>
                  </View>
                </View>

                {/* Content */}
                <Text style={{ fontSize: '13px', color: '#57534E', lineHeight: '22px', marginBottom: '12px' }} numberOfLines={4}>
                  {post.content}
                </Text>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {post.tags.map((tag: string, idx: number) => (
                      <View key={idx} style={{ backgroundColor: '#FFF7ED', borderRadius: '10px', paddingLeft: '8px', paddingRight: '8px', paddingTop: '2px', paddingBottom: '2px' }}>
                        <Text style={{ fontSize: '11px', color: '#F97316' }}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Interaction bar */}
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px', paddingTop: '12px', borderTopWidth: '1px', borderTopColor: '#F5F5F4' }}>
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
                    <Heart size={15} color="#A8A29E" />
                    <Text style={{ fontSize: '12px', color: '#A8A29E' }}>{post.likes_count || 0}</Text>
                  </View>
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
                    <MessageCircle size={15} color="#A8A29E" />
                    <Text style={{ fontSize: '12px', color: '#A8A29E' }}>{post.comments_count || 0}</Text>
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
