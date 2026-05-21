import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'
import { useUserStore } from '@/store/user-store'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share2, Flag } from 'lucide-react-taro'

interface PostDetail {
  id: string
  content: string
  images: string[]
  tags: string[]
  likes_count: number
  comments_count: number
  is_liked: boolean
  user_nickname: string
  user_avatar: string
  created_at: string
  circle_name: string
}

interface CommentItem {
  id: string
  content: string
  user_nickname: string
  user_avatar: string
  parent_id: string | null
  reply_to_nickname: string | null
  created_at: string
  replies?: CommentItem[]
}

export default function PostDetail() {
  const { isLoggedIn } = useUserStore()
  const [postId, setPostId] = useState('')
  const [post, setPost] = useState<PostDetail | null>(null)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [replyContent, setReplyContent] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string } | null>(null)

  useEffect(() => {
    const instance = Taro.getCurrentInstance()
    const id = instance?.router?.params?.id
    if (id) {
      setPostId(id)
      loadPost(id)
      loadComments(id)
    }
  }, [])

  const loadPost = async (id: string) => {
    try {
      const res = await Network.request({ url: `/api/posts/${id}`, method: 'GET' })
      console.log('Post detail:', res.data)
      if (res.data?.data) setPost(res.data.data)
    } catch (err) {
      console.error('Load post failed:', err)
    }
  }

  const loadComments = async (id: string) => {
    try {
      const res = await Network.request({ url: `/api/posts/${id}/comments`, method: 'GET' })
      console.log('Comments:', res.data)
      if (res.data?.data) setComments(res.data.data)
    } catch (err) {
      console.error('Load comments failed:', err)
    }
  }

  const handleLike = async () => {
    if (!isLoggedIn) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    try {
      const res = await Network.request({
        url: '/api/posts/like',
        method: 'POST',
        data: { post_id: postId },
      })
      console.log('Like response:', res.data)
      if (res.data?.data && post) {
        setPost({
          ...post,
          is_liked: !post.is_liked,
          likes_count: post.likes_count + (post.is_liked ? -1 : 1),
        })
      }
    } catch (err) {
      console.error('Like failed:', err)
    }
  }

  const handleComment = async () => {
    if (!isLoggedIn) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    if (!replyContent.trim()) return
    try {
      const res = await Network.request({
        url: '/api/comments',
        method: 'POST',
        data: {
          post_id: postId,
          content: replyContent,
          parent_id: replyTo?.id || null,
          reply_to_nickname: replyTo?.nickname || null,
        },
      })
      console.log('Comment response:', res.data)
      if (res.data?.data) {
        setReplyContent('')
        setReplyTo(null)
        loadComments(postId)
        if (post) setPost({ ...post, comments_count: post.comments_count + 1 })
        Taro.showToast({ title: '评论成功', icon: 'success' })
      }
    } catch (err) {
      console.error('Comment failed:', err)
      Taro.showToast({ title: '评论失败', icon: 'none' })
    }
  }

  const handleReport = () => {
    Taro.showModal({
      title: '举报',
      content: '确定举报此内容？',
      success: async (res) => {
        if (res.confirm && post) {
          try {
            await Network.request({
              url: '/api/reports',
              method: 'POST',
              data: { target_type: 'post', target_id: postId, reason: 'inappropriate' },
            })
            Taro.showToast({ title: '已举报', icon: 'success' })
          } catch {
            Taro.showToast({ title: '举报失败', icon: 'none' })
          }
        }
      },
    })
  }

  const renderComment = (comment: CommentItem, depth = 0) => (
    <View key={comment.id} className={depth > 0 ? 'ml-6 border-l-2 border-orange-100 pl-3' : ''}>
      <View className="flex flex-row items-start gap-2 mb-2">
        <View className="w-7 h-7 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <Text className="block text-xs">{comment.user_nickname?.[0] || 'U'}</Text>
        </View>
        <View className="flex-1">
          <View className="flex flex-row items-center gap-2">
            <Text className="block text-xs font-medium text-neutral-700">{comment.user_nickname}</Text>
            {comment.reply_to_nickname && (
              <Text className="block text-xs text-neutral-400">回复 {comment.reply_to_nickname}</Text>
            )}
          </View>
          <Text className="block text-sm text-neutral-800 mt-1">{comment.content}</Text>
          <View className="flex flex-row items-center gap-3 mt-1">
            <Text className="block text-xs text-neutral-400">{comment.created_at?.slice(5, 16)}</Text>
            <Text
              className="block text-xs text-orange-500"
              onClick={() => setReplyTo({ id: comment.id, nickname: comment.user_nickname })}
            >
              回复
            </Text>
          </View>
        </View>
      </View>
      {comment.replies?.map((reply) => renderComment(reply, depth + 1))}
    </View>
  )

  return (
    <View className="h-full bg-neutral-50">
      {/* 帖子内容 */}
      {post && (
        <View className="bg-white px-4 py-3">
          <View className="flex flex-row items-center gap-2 mb-3">
            <View className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
              <Text className="block text-sm">{post.user_nickname?.[0] || 'U'}</Text>
            </View>
            <View className="flex-1">
              <Text className="block text-sm font-semibold text-neutral-900">{post.user_nickname}</Text>
              <Text className="block text-xs text-neutral-400">{post.created_at?.slice(0, 16)}</Text>
            </View>
            <Flag size={16} color="#737373" onClick={handleReport} />
          </View>
          <Text className="block text-sm text-neutral-800 leading-relaxed">{post.content}</Text>
          {post.tags && post.tags.length > 0 && (
            <View className="flex flex-row flex-wrap gap-1 mt-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
              ))}
            </View>
          )}
          <View className="flex flex-row items-center gap-4 mt-3 pt-2 border-t border-neutral-100">
            <View className="flex flex-row items-center gap-1" onClick={handleLike}>
              <Heart size={16} color={post.is_liked ? '#EF4444' : '#737373'} />
              <Text className="block text-xs text-neutral-500">{post.likes_count}</Text>
            </View>
            <View className="flex flex-row items-center gap-1">
              <MessageCircle size={16} color="#737373" />
              <Text className="block text-xs text-neutral-500">{post.comments_count}</Text>
            </View>
            <View className="flex flex-row items-center gap-1">
              <Share2 size={16} color="#737373" />
              <Text className="block text-xs text-neutral-500">分享</Text>
            </View>
          </View>
        </View>
      )}

      <View className="h-2" />

      {/* 评论区 */}
      <View className="bg-white px-4 py-3">
        <Text className="block text-sm font-semibold text-neutral-900 mb-3">
          评论 ({comments.length})
        </Text>
        {comments.length > 0 ? (
          <View className="space-y-3">
            {comments.map((c) => renderComment(c))}
          </View>
        ) : (
          <Text className="block text-sm text-neutral-400 py-4 text-center">暂无评论</Text>
        )}
      </View>

      {/* 底部评论输入框 */}
      <View
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          display: 'flex', flexDirection: 'row', gap: '8px',
          padding: '12px', backgroundColor: '#fff', borderTop: '1px solid #e5e5e5', zIndex: 100,
        }}
      >
        <View style={{ flex: 1, backgroundColor: '#f5f5f5', borderRadius: '20px', padding: '8px 12px' }}>
          <Input
            style={{ width: '100%', fontSize: '14px' }}
            placeholder={replyTo ? `回复 ${replyTo.nickname}...` : '写评论...'}
            value={replyContent}
            onInput={(e) => setReplyContent(e.detail.value)}
          />
        </View>
        <View style={{ flexShrink: 0 }}>
          <Button size="sm" className="bg-orange-500 text-white" onClick={handleComment}>
            <Text className="text-white">发送</Text>
          </Button>
        </View>
      </View>

      {/* 底部免责声明 */}
      <View className="px-4 py-6 mb-12">
        <Text className="block text-xs text-neutral-400 text-center">
          用户评论不代表平台立场 | 违规内容请举报
        </Text>
      </View>
    </View>
  )
}
