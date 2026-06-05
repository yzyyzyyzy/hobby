import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Heart, MessageCircle, ChevronLeft, Send, Trash2 } from 'lucide-react-taro'
import { Input } from '@/components/ui/input'
import { useUserStore } from '@/store/user-store'
import { Network } from '@/network'

export default function PostDetail() {
  const postId = Taro.getCurrentInstance().router?.params?.id || ''
  const { userInfo } = useUserStore()
  const userId = userInfo?.id || Taro.getStorageSync('user_id') || ''

  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadPost()
    loadComments()
  }, [postId])

  const loadPost = async () => {
    try {
      const res = await Network.request({
        url: `/api/posts/${postId}`,
        data: { user_id: userId }
      })
      console.log('Post detail:', res.data)
      const data = res.data?.data || res.data
      setPost(data)
    } catch (err) {
      console.error('Load post failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const res = await Network.request({
        url: `/api/posts/${postId}/comments`,
        data: { user_id: userId }
      })
      console.log('Comments:', res.data)
      const data = res.data?.data || res.data
      setComments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Load comments failed:', err)
    }
  }

  const handleLikePost = async () => {
    if (!userId) { Taro.navigateTo({ url: '/pages/login/index' }); return }
    try {
      const res = await Network.request({
        url: `/api/posts/${postId}/like`,
        method: 'POST',
        data: { user_id: userId }
      })
      console.log('Like post result:', res.data)
      const data = res.data?.data || res.data
      const isLiked = data.liked === true
      setPost(prev => ({
        ...prev,
        is_liked: isLiked,
        likes_count: isLiked ? (prev.likes_count || 0) + 1 : Math.max(0, (prev.likes_count || 1) - 1)
      }))
    } catch (err) { console.error('Like failed:', err) }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!userId) { Taro.navigateTo({ url: '/pages/login/index' }); return }
    try {
      const res = await Network.request({
        url: `/api/posts/${postId}/comments/${commentId}/like`,
        method: 'POST',
        data: { user_id: userId }
      })
      console.log('Like comment result:', res.data)
      const data = res.data?.data || res.data
      const newLiked = data.liked === true
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return { ...c, is_liked: newLiked, likes_count: newLiked ? (c.likes_count || 0) + 1 : Math.max(0, (c.likes_count || 1) - 1) }
        }
        if (c.replies) {
          return { ...c, replies: c.replies.map((r: any) => {
            if (r.id === commentId) {
              return { ...r, is_liked: newLiked, likes_count: newLiked ? (r.likes_count || 0) + 1 : Math.max(0, (r.likes_count || 1) - 1) }
            }
            return r
          })}
        }
        return c
      }))
    } catch (err) { console.error('Like comment failed:', err) }
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return
    if (!userId) { Taro.navigateTo({ url: '/pages/login/index' }); return }
    setSubmitting(true)
    try {
      const data: any = {
        user_id: userId,
        content: commentText.trim()
      }
      if (replyTo) {
        data.parent_id = replyTo.parentId
        data.reply_to_user_id = replyTo.userId
      }
      await Network.request({
        url: `/api/posts/${postId}/comments`,
        method: 'POST',
        data
      })
      setCommentText('')
      setReplyTo(null)
      loadComments()
      setPost(prev => ({ ...prev, comments_count: (prev.comments_count || 0) + 1 }))
      Taro.showToast({ title: '评论成功', icon: 'success' })
    } catch (err) {
      console.error('Comment failed:', err)
      Taro.showToast({ title: '评论失败', icon: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    const res = await Taro.showModal({ title: '确认删除', content: '删除后不可恢复' })
    if (!res.confirm) return
    try {
      await Network.request({
        url: `/api/posts/${postId}/comments/${commentId}`,
        method: 'DELETE',
        data: { user_id: userId }
      })
      loadComments()
      setPost(prev => ({ ...prev, comments_count: Math.max(0, (prev.comments_count || 1) - 1) }))
      Taro.showToast({ title: '已删除', icon: 'success' })
    } catch (err) { console.error('Delete failed:', err) }
  }

  const handleReply = (comment: any) => {
    if (!userId) { Taro.navigateTo({ url: '/pages/login/index' }); return }
    setReplyTo({
      parentId: comment.parent_id || comment.id,
      userId: comment.user_id,
      nickname: getCommentNickname(comment)
    })
  }

  const formatTime = (t: string) => {
    if (!t) return ''
    const d = new Date(t)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }

  const getCommentNickname = (c: any) => c.user_nickname || c.nickname || '用户'

  if (loading) {
    return (
      <View className="flex items-center justify-center h-screen bg-stone-50">
        <Text className="block text-stone-400">加载中...</Text>
      </View>
    )
  }

  if (!post) {
    return (
      <View className="flex items-center justify-center h-screen bg-stone-50">
        <Text className="block text-stone-400">帖子不存在</Text>
      </View>
    )
  }

  const images = post.images ? (typeof post.images === 'string' ? JSON.parse(post.images) : post.images) : []
  const tags = post.tags ? (typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags) : []
  const authorName = post.user_nickname || post.nickname || '用户'

  return (
    <View className="flex flex-col min-h-screen bg-stone-50">
      {/* Header */}
      <View style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '12px 16px', backgroundColor: '#FAFAF9' }}>
        <View onClick={() => Taro.navigateBack()} style={{ padding: '4px' }}>
          <ChevronLeft size={22} color="#292524" />
        </View>
        <Text className="block flex-1 text-lg font-semibold text-stone-800 text-center">帖子详情</Text>
        <View style={{ width: '30px' }} />
      </View>

      {/* Post Content */}
      <View className="bg-white mx-3 mt-2 rounded-xl p-4 shadow-sm">
        {/* Author Info */}
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '12px' }}>
          <View style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px' }}>
            <Text className="block text-orange-700 font-bold text-sm">{authorName[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text className="block text-stone-800 font-medium text-sm">{authorName}</Text>
            <Text className="block text-stone-400 text-xs mt-1">{formatTime(post.created_at)} · {post.circle_name || ''}</Text>
          </View>
        </View>

        {/* Content */}
        <Text className="block text-stone-800 text-sm leading-6 mb-3">{post.content}</Text>

        {/* Images */}
        {images.length > 0 && (
          <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {images.map((img: string, idx: number) => (
              <Image
                key={idx}
                src={img}
                mode="aspectFill"
                style={{ width: images.length === 1 ? '100%' : '32%', height: images.length === 1 ? '200px' : '110px', borderRadius: '8px' }}
              />
            ))}
          </View>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {tags.map((tag: string, idx: number) => (
              <View key={idx} style={{ backgroundColor: '#FFF7ED', borderRadius: '12px', paddingLeft: '8px', paddingRight: '8px', paddingTop: '3px', paddingBottom: '3px' }}>
                <Text className="block text-orange-600 text-xs">#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px', paddingTop: '10px', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#F5F5F4' }}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }} onClick={handleLikePost}>
            <Heart size={18} color={post.is_liked ? '#EF4444' : '#A8A29E'} filled={post.is_liked} />
            <Text className="block text-xs" style={{ color: post.is_liked ? '#EF4444' : '#A8A29E' }}>{post.likes_count || 0}</Text>
          </View>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
            <MessageCircle size={18} color="#A8A29E" />
            <Text className="block text-xs text-stone-400">{post.comments_count || 0}</Text>
          </View>
        </View>
      </View>

      {/* Comments Section */}
      <View className="mx-3 mt-3 mb-24">
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '12px' }}>
          <Text className="block text-stone-800 font-semibold text-sm">评论 ({comments.length})</Text>
        </View>

        {comments.length === 0 && (
          <View className="flex items-center justify-center py-12">
            <Text className="block text-stone-400 text-sm">暂无评论，来说点什么吧</Text>
          </View>
        )}

        {comments.map(comment => (
          <View key={comment.id} className="bg-white rounded-xl p-4 mb-2 shadow-sm">
            {/* Comment Author */}
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E7E5E4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', flexShrink: 0 }}>
                <Text className="block text-stone-500 text-xs font-medium">{getCommentNickname(comment)[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text className="block text-stone-700 text-xs font-medium">{getCommentNickname(comment)}</Text>
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2px' }} onClick={() => handleLikeComment(comment.id)}>
                      <Heart size={14} color={comment.is_liked ? '#EF4444' : '#A8A29E'} filled={comment.is_liked} />
                      <Text className="block text-xs" style={{ color: comment.is_liked ? '#EF4444' : '#A8A29E' }}>{comment.likes_count || 0}</Text>
                    </View>
                    {(comment.user_id === userId) && (
                      <View onClick={() => handleDeleteComment(comment.id)} style={{ padding: '2px' }}>
                        <Trash2 size={12} color="#A8A29E" />
                      </View>
                    )}
                  </View>
                </View>
                <Text className="block text-stone-800 text-sm mt-1 leading-5">{comment.content}</Text>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                  <Text className="block text-stone-400 text-xs">{formatTime(comment.created_at)}</Text>
                  <Text
                    className="block text-orange-500 text-xs font-medium"
                    onClick={() => handleReply(comment)}
                  >回复</Text>
                </View>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <View style={{ marginTop: '8px', paddingLeft: '8px', borderLeftWidth: '2px', borderLeftStyle: 'solid', borderLeftColor: '#FED7AA' }}>
                    {comment.replies.map((reply: any) => (
                      <View key={reply.id} style={{ marginBottom: '8px' }}>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
                          <Text className="block text-orange-600 text-xs font-medium">{getCommentNickname(reply)}</Text>
                          {reply.reply_to_nickname && (
                            <>
                              <Text className="block text-stone-400 text-xs">回复</Text>
                              <Text className="block text-stone-500 text-xs font-medium">@{reply.reply_to_nickname}</Text>
                            </>
                          )}
                          <View style={{ flex: 1 }} />
                          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2px' }} onClick={() => handleLikeComment(reply.id)}>
                            <Heart size={12} color={reply.is_liked ? '#EF4444' : '#A8A29E'} filled={reply.is_liked} />
                            <Text className="block text-xs" style={{ color: reply.is_liked ? '#EF4444' : '#A8A29E' }}>{reply.likes_count || 0}</Text>
                          </View>
                        </View>
                        <Text className="block text-stone-700 text-sm mt-1 leading-5">{reply.content}</Text>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
                          <Text className="block text-stone-400 text-xs">{formatTime(reply.created_at)}</Text>
                          <Text className="block text-orange-500 text-xs font-medium" onClick={() => handleReply(reply)}>回复</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Bottom Comment Input */}
      <View
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          backgroundColor: '#FFFFFF', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#F5F5F4',
          padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px'
        }}
      >
        {replyTo && (
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF7ED', borderRadius: '8px', padding: '6px 10px' }}>
            <Text className="block text-orange-600 text-xs">回复 @{replyTo.nickname}</Text>
            <Text className="block text-stone-400 text-xs" onClick={() => setReplyTo(null)}>取消</Text>
          </View>
        )}
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
          <View style={{ flex: 1, backgroundColor: '#F5F5F4', borderRadius: '20px', padding: '0px' }}>
            <Input
              className="bg-transparent border-0 h-9 text-sm"
              placeholder={replyTo ? `回复 @${replyTo.nickname}...` : '写评论...'}
              value={commentText}
              onInput={(e: any) => setCommentText(e.detail.value)}
              onConfirm={handleSubmitComment}
              confirmType="send"
            />
          </View>
          <View
            onClick={submitting ? undefined : handleSubmitComment}
            style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', backgroundColor: commentText.trim() ? '#F97316' : '#E7E5E4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Send size={16} color={commentText.trim() ? '#FFFFFF' : '#A8A29E'} />
          </View>
        </View>
      </View>
    </View>
  )
}
