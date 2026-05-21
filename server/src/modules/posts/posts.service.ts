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
      // Hot: sort by interaction count + time decay
      query = query.order('likes_count', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query.limit(30)
    if (error) throw new Error(`List posts failed: ${error.message}`)

    // Enrich with user info
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

  async getPost(id: string) {
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

    return {
      ...data,
      user_nickname: user?.nickname || '未知用户',
      user_avatar: user?.avatar_url || '',
      is_liked: false, // TODO: check with user_id
    }
  }

  async createPost(body: {
    circle_id: string; user_id: string; content: string;
    images?: string[]; tags?: string[]; mention_owner?: boolean; is_draft?: boolean;
  }) {
    const client = getSupabaseClient()

    // Content safety check
    await this.checkContentSafety(body.content)

    const { data, error } = await client
      .from('posts')
      .insert({
        circle_id: body.circle_id,
        user_id: body.user_id,
        content: body.content,
        images: body.images || [],
        tags: body.tags || [],
        mention_owner: body.mention_owner || false,
        is_draft: body.is_draft || false,
      })
      .select()
      .maybeSingle()
    if (error) throw new Error(`Create post failed: ${error.message}`)

    // Update circle activity score
    await client
      .from('circles')
      .update({ activity_score: await this.calculateActivityScore(body.circle_id) })
      .eq('id', body.circle_id)

    return data
  }

  async likePost(body: { post_id: string; user_id: string }) {
    const client = getSupabaseClient()

    // Check if already liked
    const { data: existing } = await client
      .from('post_likes')
      .select('id')
      .eq('post_id', body.post_id)
      .eq('user_id', body.user_id)
      .maybeSingle()

    if (existing) {
      // Unlike
      await client.from('post_likes').delete().eq('id', existing.id)
      await client.rpc('decrement_likes', { post_id: body.post_id }) // fallback: manual update
      // Manual update fallback
      const { data: post } = await client.from('posts').select('likes_count').eq('id', body.post_id).maybeSingle()
      if (post) {
        await client.from('posts').update({ likes_count: Math.max(0, post.likes_count - 1) }).eq('id', body.post_id)
      }
      return { liked: false }
    }

    // Like
    await client.from('post_likes').insert({ post_id: body.post_id, user_id: body.user_id })
    const { data: post } = await client.from('posts').select('likes_count').eq('id', body.post_id).maybeSingle()
    if (post) {
      await client.from('posts').update({ likes_count: post.likes_count + 1 }).eq('id', body.post_id)
    }
    return { liked: true }
  }

  async getComments(postId: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(`Get comments failed: ${error.message}`)

    // Enrich with user info
    const comments = data || []
    if (comments.length > 0) {
      const userIds = [...new Set(comments.map((c: any) => c.user_id))]
      const { data: users } = await client
        .from('users')
        .select('id, nickname, avatar_url')
        .in('id', userIds)
      const userMap = new Map((users || []).map((u: any) => [u.id, u]))

      const enriched = comments.map((c: any) => ({
        id: c.id,
        content: c.content,
        parent_id: c.parent_id,
        reply_to_nickname: c.reply_to_id ? null : null, // simplified
        user_nickname: userMap.get(c.user_id)?.nickname || '未知用户',
        user_avatar: userMap.get(c.user_id)?.avatar_url || '',
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
    return comments
  }

  async createComment(postId: string, body: { user_id: string; content: string; parent_id?: string; reply_to_nickname?: string }) {
    const client = getSupabaseClient()

    // Content safety check
    await this.checkContentSafety(body.content)

    const { data, error } = await client
      .from('comments')
      .insert({
        post_id: postId,
        user_id: body.user_id,
        content: body.content,
        parent_id: body.parent_id || null,
        reply_to_id: null,
      })
      .select()
      .maybeSingle()
    if (error) throw new Error(`Create comment failed: ${error.message}`)

    // Update comment count
    const { data: post } = await client.from('posts').select('comments_count').eq('id', postId).maybeSingle()
    if (post) {
      await client.from('posts').update({ comments_count: post.comments_count + 1 }).eq('id', postId)
    }

    // Create notification
    await client.from('messages').insert({
      user_id: (await client.from('posts').select('user_id').eq('id', postId).maybeSingle()).data?.user_id,
      type: 'comment',
      title: '新评论',
      content: body.content.slice(0, 50),
      related_id: postId,
    })

    return data
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
    const client = getSupabaseClient()
    const { data: keywords } = await client
      .from('blocked_keywords')
      .select('keyword')
    if (keywords && keywords.length > 0) {
      for (const kw of keywords) {
        if (content.includes(kw.keyword)) {
          throw new Error(`内容包含违规关键词，请修改后重试`)
        }
      }
    }
  }

  private async calculateActivityScore(circleId: string): Promise<number> {
    const client = getSupabaseClient()
    const { count: postCount } = await client
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('circle_id', circleId)
      .eq('is_draft', false)
    return (postCount || 0) * 10
  }
}
