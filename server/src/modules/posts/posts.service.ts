import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class PostsService {
  async listPosts(circleId: string, sort: string = 'latest') {
    const client = getSupabaseClient()

    let query = client
      .from('posts')
      .select('*')
      .eq('circle_id', circleId)
      .eq('is_draft', false)

    if (sort === 'hot') {
      query = query.order('likes_count', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query.limit(30)
    if (error) throw new Error(`List posts failed: ${error.message}`)

    const posts = data || []
    if (posts.length > 0) {
      const userIds = [...new Set(posts.map((p: any) => p.user_id))]
      const { data: users } = await client
        .from('users')
        .select('id, nickname, avatar_url')
        .in('id', userIds)
      const userMap = new Map((users || []).map((u: any) => [u.id, u]))

      return posts.map((p: any) => ({
        id: p.id,
        content: p.content,
        images: p.images || [],
        tags: p.tags || [],
        likes_count: p.likes_count,
        comments_count: p.comments_count,
        user_nickname: userMap.get(p.user_id)?.nickname || '未知用户',
        user_avatar: userMap.get(p.user_id)?.avatar_url || '',
        created_at: p.created_at,
      }))
    }

    return posts
  }

  async getFeaturedPosts(userId: string) {
    const client = getSupabaseClient()

    let circleIds: string[] = []
    if (userId) {
      const { data: memberships } = await client
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', userId)
      circleIds = (memberships || []).map((m: any) => m.circle_id)
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    let query = client
      .from('posts')
      .select('id, content, images, tags, likes_count, comments_count, user_id, circle_id, created_at')
      .eq('is_draft', false)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('likes_count', { ascending: false })

    if (circleIds.length > 0) {
      query = query.in('circle_id', circleIds)
    }

    const { data: posts, error } = await query.limit(50)
    if (error) throw new Error(`Get featured posts failed: ${error.message}`)

    if (!posts || posts.length === 0) return []

    const userIds = [...new Set(posts.map((p: any) => p.user_id))]
    const circleIdsUnique = [...new Set(posts.map((p: any) => p.circle_id))]

    const [usersRes, circlesRes] = await Promise.all([
      client.from('users').select('id, nickname, avatar_url').in('id', userIds),
      client.from('circles').select('id, name, cover_url').in('id', circleIdsUnique),
    ])

    const userMap = new Map((usersRes.data || []).map((u: any) => [u.id, u]))
    const circleMap = new Map((circlesRes.data || []).map((c: any) => [c.id, c]))

    return posts.map((p: any) => ({
      id: p.id,
      content: p.content,
      images: p.images || [],
      tags: p.tags || [],
      likes_count: p.likes_count,
      comments_count: p.comments_count,
      user_nickname: userMap.get(p.user_id)?.nickname || '未知用户',
      user_avatar: userMap.get(p.user_id)?.avatar_url || '',
      circle_id: p.circle_id,
      circle_name: circleMap.get(p.circle_id)?.name || '',
      circle_icon: circleMap.get(p.circle_id)?.cover_url || '',
      created_at: p.created_at,
    }))
  }

  async getPost(id: string, userId?: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('posts')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`Get post failed: ${error.message}`)
    if (!data) return null

    // Get user info
    const { data: user } = await client
      .from('users')
      .select('nickname, avatar_url')
      .eq('id', data.user_id)
      .maybeSingle()

    // Get circle info
    const { data: circle } = await client
      .from('circles')
      .select('id, name, cover_url')
      .eq('id', data.circle_id)
      .maybeSingle()

    // Check if user liked this post
    let isLiked = false
    if (userId) {
      const { data: likeRecord } = await client
        .from('post_likes')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', userId)
        .maybeSingle()
      isLiked = !!likeRecord
    }

    return {
      ...data,
      user_nickname: user?.nickname || '未知用户',
      user_avatar: user?.avatar_url || '',
      circle_name: circle?.name || '',
      circle_cover: circle?.cover_url || '',
      is_liked: isLiked,
    }
  }

  async createPost(body: {
    circle_id: string; user_id: string; content: string;
    images?: string[]; tags?: string[]; is_draft?: boolean;
  }) {
    const client = getSupabaseClient()

    await this.checkContentSafety(body.content)

    const { data, error } = await client
      .from('posts')
      .insert({
        circle_id: body.circle_id,
        user_id: body.user_id,
        content: body.content,
        images: body.images || [],
        tags: body.tags || [],
        is_draft: body.is_draft || false,
      })
      .select()
      .maybeSingle()
    if (error) throw new Error(`Create post failed: ${error.message}`)

    await client
      .from('circles')
      .update({ activity_score: await this.calculateActivityScore(body.circle_id) })
      .eq('id', body.circle_id)

    return data
  }

  async likePost(body: { post_id: string; user_id: string }) {
    const client = getSupabaseClient()

    const { data: existing } = await client
      .from('post_likes')
      .select('id')
      .eq('post_id', body.post_id)
      .eq('user_id', body.user_id)
      .maybeSingle()

    if (existing) {
      await client.from('post_likes').delete().eq('id', existing.id)
      const { data: post } = await client.from('posts').select('likes_count').eq('id', body.post_id).maybeSingle()
      if (post) {
        await client.from('posts').update({ likes_count: Math.max(0, post.likes_count - 1) }).eq('id', body.post_id)
      }
      return { liked: false }
    }

    await client.from('post_likes').insert({ post_id: body.post_id, user_id: body.user_id })
    const { data: post } = await client.from('posts').select('likes_count').eq('id', body.post_id).maybeSingle()
    if (post) {
      await client.from('posts').update({ likes_count: post.likes_count + 1 }).eq('id', body.post_id)
    }
    return { liked: true }
  }

  async deletePost(postId: string, userId: string) {
    const client = getSupabaseClient()
    const { data: post } = await client.from('posts').select('user_id').eq('id', postId).maybeSingle()
    if (!post) throw new Error('Post not found')

    await client.from('comments').delete().eq('post_id', postId)
    await client.from('post_likes').delete().eq('post_id', postId)
    await client.from('posts').delete().eq('id', postId)
    return { success: true }
  }

  async getComments(postId: string, userId?: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(`Get comments failed: ${error.message}`)

    const comments = data || []
    if (comments.length === 0) return []

    // Enrich with user info
    const userIds = [...new Set(comments.map((c: any) => c.user_id))]
    const { data: users } = await client
      .from('users')
      .select('id, nickname, avatar_url')
      .in('id', userIds)
    const userMap = new Map((users || []).map((u: any) => [u.id, u]))

    // Check liked status for user
    let likedCommentIds: Set<string> = new Set()
    if (userId) {
      const commentIds = comments.map((c: any) => c.id)
      const { data: likes } = await client
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', userId)
        .in('comment_id', commentIds)
      likedCommentIds = new Set((likes || []).map((l: any) => l.comment_id))
    }

    // Get reply_to nickname
    const replyToIds = comments.filter((c: any) => c.reply_to_id).map((c: any) => c.reply_to_id)
    let replyToUserMap: Map<string, string> = new Map()
    if (replyToIds.length > 0) {
      const { data: replyComments } = await client
        .from('comments')
        .select('id, user_id')
        .in('id', replyToIds)
      const replyUserIds = [...new Set((replyComments || []).map((r: any) => r.user_id))]
      const { data: replyUsers } = await client
        .from('users')
        .select('id, nickname')
        .in('id', replyUserIds)
      const rUserMap = new Map((replyUsers || []).map((u: any) => [u.id, u.nickname]))
      replyToUserMap = new Map(
        (replyComments || []).map((r: any) => [r.id, rUserMap.get(r.user_id) || '未知用户'])
      )
    }

    const enriched = comments.map((c: any) => ({
      id: c.id,
      content: c.content,
      parent_id: c.parent_id,
      reply_to_nickname: c.reply_to_id ? replyToUserMap.get(c.reply_to_id) || null : null,
      likes_count: c.likes_count || 0,
      is_liked: likedCommentIds.has(c.id),
      user_nickname: userMap.get(c.user_id)?.nickname || '未知用户',
      user_avatar: userMap.get(c.user_id)?.avatar_url || '',
      user_id: c.user_id,
      created_at: c.created_at,
      replies: [],
    }))

    // Build nested structure
    const commentMap = new Map(enriched.map((c: any) => [c.id, c]))
    const rootComments: any[] = []
    for (const comment of enriched) {
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        commentMap.get(comment.parent_id).replies.push(comment)
      } else {
        rootComments.push(comment)
      }
    }
    return rootComments
  }

  async createComment(postId: string, body: { user_id: string; content: string; parent_id?: string; reply_to_user_id?: string }) {
    const client = getSupabaseClient()

    await this.checkContentSafety(body.content)

    // Get reply_to_nickname if replying
    let replyToId = null
    if (body.reply_to_user_id) {
      const { data: replyUser } = await client
        .from('users')
        .select('id, nickname')
        .eq('id', body.reply_to_user_id)
        .maybeSingle()
      // We don't store reply_to_id in DB for simplicity, just use reply_to_user_id for display
    }

    const insertData: any = {
      post_id: postId,
      user_id: body.user_id,
      content: body.content,
      parent_id: body.parent_id || null,
      reply_to_id: null,
    }

    // If parent_id exists, set reply_to_id to parent comment's user
    if (body.parent_id) {
      const { data: parentComment } = await client
        .from('comments')
        .select('user_id')
        .eq('id', body.parent_id)
        .maybeSingle()
      if (parentComment) {
        insertData.reply_to_id = body.parent_id
      }
    }

    const { data, error } = await client
      .from('comments')
      .insert(insertData)
      .select()
      .maybeSingle()
    if (error) throw new Error(`Create comment failed: ${error.message}`)

    // Update comment count
    const { data: post } = await client.from('posts').select('comments_count').eq('id', postId).maybeSingle()
    if (post) {
      await client.from('posts').update({ comments_count: post.comments_count + 1 }).eq('id', postId)
    }

    return data
  }

  async likeComment(body: { comment_id: string; user_id: string }) {
    const client = getSupabaseClient()

    const { data: existing } = await client
      .from('comment_likes')
      .select('id')
      .eq('comment_id', body.comment_id)
      .eq('user_id', body.user_id)
      .maybeSingle()

    if (existing) {
      await client.from('comment_likes').delete().eq('id', existing.id)
      const { data: comment } = await client.from('comments').select('likes_count').eq('id', body.comment_id).maybeSingle()
      if (comment) {
        await client.from('comments').update({ likes_count: Math.max(0, comment.likes_count - 1) }).eq('id', body.comment_id)
      }
      return { liked: false }
    }

    await client.from('comment_likes').insert({ comment_id: body.comment_id, user_id: body.user_id })
    const { data: comment } = await client.from('comments').select('likes_count').eq('id', body.comment_id).maybeSingle()
    if (comment) {
      await client.from('comments').update({ likes_count: comment.likes_count + 1 }).eq('id', body.comment_id)
    }
    return { liked: true }
  }

  async deleteComment(commentId: string, userId: string) {
    const client = getSupabaseClient()
    const { data: comment } = await client.from('comments').select('post_id, user_id').eq('id', commentId).maybeSingle()
    if (!comment) throw new Error('Comment not found')

    // Delete likes first
    await client.from('comment_likes').delete().eq('comment_id', commentId)

    // Delete replies
    await client.from('comments').delete().eq('parent_id', commentId)

    // Delete comment
    await client.from('comments').delete().eq('id', commentId)

    // Update comment count
    const { data: post } = await client.from('posts').select('comments_count').eq('id', comment.post_id).maybeSingle()
    if (post) {
      await client.from('posts').update({ comments_count: Math.max(0, post.comments_count - 1) }).eq('id', comment.post_id)
    }
    return { success: true }
  }

  async updatePost(id: string, body: { content?: string; is_draft?: boolean }) {
    const client = getSupabaseClient()
    const updates: Record<string, unknown> = {}
    if (body.content !== undefined) updates.content = body.content
    if (body.is_draft !== undefined) updates.is_draft = body.is_draft

    const { data, error } = await client
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw new Error(`Update post failed: ${error.message}`)
    return data
  }

  private async checkContentSafety(content: string) {
    const forbidden = ['违规', '敏感']
    for (const word of forbidden) {
      if (content.includes(word)) {
        throw new Error('内容包含违规信息，请修改后重试')
      }
    }
  }

  private async calculateActivityScore(circleId: string): Promise<number> {
    const client = getSupabaseClient()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { count } = await client
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('circle_id', circleId)
      .eq('is_draft', false)
      .gte('created_at', sevenDaysAgo.toISOString())
    return count || 0
  }
}
