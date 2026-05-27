import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class CirclesService {
  async listCircles(params: { category?: string; keyword?: string; userId?: string }) {
    const client = getSupabaseClient()
    let query = client.from('circles').select('*')
    if (params.category) query = query.eq('category', params.category)
    if (params.keyword) query = query.or(`name.ilike.%${params.keyword}%,tags::text.ilike.%${params.keyword}%`)
    const { data, error } = await query.order('activity_score', { ascending: false })
    if (error) throw new Error(`List circles failed: ${error.message}`)

    // Check join status for each circle if userId provided
    if (params.userId && data && data.length > 0) {
      const circleIds = data.map((c: any) => c.id)
      const { data: memberships } = await client
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', params.userId)
        .in('circle_id', circleIds)
      const joinedSet = new Set((memberships || []).map((m: any) => m.circle_id))
      data.forEach((c: any) => { c.is_joined = joinedSet.has(c.id) })
    } else if (data) {
      data.forEach((c: any) => { c.is_joined = false })
    }
    return data
  }

  async createCircle(body: { name: string; description?: string; category: string; tags?: string[]; creator_id: string }) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('circles')
      .insert({
        name: body.name,
        description: body.description,
        category: body.category,
        tags: body.tags || [],
      })
      .select()
      .maybeSingle()
    if (error) throw new Error(`Create circle failed: ${error.message}`)
    return data
  }

  async getCircle(id: string, userId?: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('circles')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`Get circle failed: ${error.message}`)
    if (!data) throw new Error('圈子不存在')

    if (userId) {
      const { data: member } = await client
        .from('circle_members')
        .select('id')
        .eq('circle_id', id)
        .eq('user_id', userId)
        .maybeSingle()
      data.is_joined = !!member
    } else {
      data.is_joined = false
    }
    return data
  }

  async joinCircle(body: { circle_id: string; user_id: string }) {
    const client = getSupabaseClient()
    // Check already joined
    const { data: existing } = await client
      .from('circle_members')
      .select('id')
      .eq('circle_id', body.circle_id)
      .eq('user_id', body.user_id)
      .maybeSingle()
    if (existing) return { message: '已加入该圈子', already_joined: true }

    const { data, error } = await client
      .from('circle_members')
      .insert({ circle_id: body.circle_id, user_id: body.user_id })
      .select()
      .maybeSingle()
    if (error) throw new Error(`Join circle failed: ${error.message}`)

    // Update member count
    await client.rpc('increment_member_count', { circle_id_input: body.circle_id, count_input: 1 })
    return data
  }

  async leaveCircle(body: { circle_id: string; user_id: string }) {
    const client = getSupabaseClient()
    const { error } = await client
      .from('circle_members')
      .delete()
      .eq('circle_id', body.circle_id)
      .eq('user_id', body.user_id)
    if (error) throw new Error(`Leave circle failed: ${error.message}`)

    // Update member count
    await client.rpc('increment_member_count', { circle_id_input: body.circle_id, count_input: -1 })
    return { success: true }
  }

  async applyToCreateCircle(body: { applicant_id: string; name: string; description?: string; category: string; tags?: string[] }) {
    const client = getSupabaseClient()
    // Check if circle name already exists
    const { data: existing } = await client
      .from('circles')
      .select('id')
      .eq('name', body.name)
      .maybeSingle()
    if (existing) throw new Error('该圈子名称已存在')

    // Check if user has pending application
    const { data: pendingApp } = await client
      .from('circle_applications')
      .select('id')
      .eq('applicant_id', body.applicant_id)
      .eq('status', 'pending')
      .maybeSingle()
    if (pendingApp) throw new Error('您有待审批的申请，请耐心等待')

    const { data, error } = await client
      .from('circle_applications')
      .insert({
        applicant_id: body.applicant_id,
        name: body.name,
        description: body.description,
        category: body.category,
        tags: body.tags || [],
        status: 'pending',
      })
      .select()
      .maybeSingle()
    if (error) throw new Error(`Apply to create circle failed: ${error.message}`)
    return data
  }

  async getMyApplications(userId: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('circle_applications')
      .select('*')
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(`Get applications failed: ${error.message}`)
    return data
  }
}
