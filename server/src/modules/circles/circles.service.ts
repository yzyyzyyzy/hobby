import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class CirclesService {
  async createCircle(body: { name: string; description?: string; category: string; tags?: string[]; creator_id: string }) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('circles')
      .insert({
        name: body.name,
        description: body.description,
        category: body.category,
        tags: body.tags || [],
        owner_id: body.creator_id,
        activity_score: 0,
      })
      .select()
      .maybeSingle()
    if (error) throw new Error(`Create circle failed: ${error.message}`)

    // Auto-join the creator as owner
    if (data) {
      await client.from('circle_members').insert({
        circle_id: data.id,
        user_id: body.creator_id,
        role: 'owner',
      })
    }
    return data
  }

  async listCircles(params: { category?: string; keyword?: string; userId?: string }) {
    const client = getSupabaseClient()
    let query = client.from('circles').select('*').order('activity_score', { ascending: false })

    if (params.category) query = query.eq('category', params.category)
    if (params.keyword) query = query.ilike('name', `%${params.keyword}%`)

    const { data, error } = await query.limit(50)
    if (error) throw new Error(`List circles failed: ${error.message}`)

    // Check join status for each circle
    let joinedCircleIds: Set<string> = new Set()
    if (params.userId && data && data.length > 0) {
      const circleIds = data.map((c: any) => c.id)
      const { data: memberships } = await client
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', params.userId)
        .in('circle_id', circleIds)
      joinedCircleIds = new Set((memberships || []).map((m: any) => m.circle_id))
    }

    return (data || []).map((c: any) => ({
      ...c,
      is_joined: joinedCircleIds.has(c.id),
    }))
  }

  async getCircle(id: string, userId?: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('circles')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`Get circle failed: ${error.message}`)
    if (!data) return null

    let isJoined = false
    if (userId) {
      const { data: membership } = await client
        .from('circle_members')
        .select('id')
        .eq('circle_id', id)
        .eq('user_id', userId)
        .maybeSingle()
      isJoined = !!membership
    }

    return { ...data, is_joined: isJoined }
  }

  async joinCircle(body: { circle_id: string; user_id: string }) {
    const client = getSupabaseClient()

    // Check if already joined
    const { data: existing } = await client
      .from('circle_members')
      .select('id')
      .eq('circle_id', body.circle_id)
      .eq('user_id', body.user_id)
      .maybeSingle()
    if (existing) return { joined: true }

    // Add membership
    const { error: joinError } = await client
      .from('circle_members')
      .insert({ circle_id: body.circle_id, user_id: body.user_id, role: 'member' })
    if (joinError) throw new Error(`Join circle failed: ${joinError.message}`)

    // Update member count
    const { data: circle } = await client
      .from('circles')
      .select('member_count')
      .eq('id', body.circle_id)
      .maybeSingle()
    if (circle) {
      await client
        .from('circles')
        .update({ member_count: circle.member_count + 1 })
        .eq('id', body.circle_id)
    }

    return { joined: true }
  }

  async leaveCircle(body: { circle_id: string; user_id: string }) {
    const client = getSupabaseClient()

    const { error: leaveError } = await client
      .from('circle_members')
      .delete()
      .eq('circle_id', body.circle_id)
      .eq('user_id', body.user_id)
    if (leaveError) throw new Error(`Leave circle failed: ${leaveError.message}`)

    // Update member count
    const { data: circle } = await client
      .from('circles')
      .select('member_count')
      .eq('id', body.circle_id)
      .maybeSingle()
    if (circle) {
      await client
        .from('circles')
        .update({ member_count: Math.max(0, circle.member_count - 1) })
        .eq('id', body.circle_id)
    }

    return { left: true }
  }
}
