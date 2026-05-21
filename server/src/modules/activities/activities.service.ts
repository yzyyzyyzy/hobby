import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class ActivitiesService {
  async listActivities(circleId: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('activities')
      .select('*')
      .eq('circle_id', circleId)
      .neq('status', 'cancelled')
      .order('activity_time', { ascending: true })
    if (error) throw new Error(`List activities failed: ${error.message}`)

    const activities = data || []
    if (activities.length > 0) {
      const userIds = [...new Set(activities.map((a: any) => a.user_id))]
      const { data: users } = await client
        .from('users')
        .select('id, nickname, avatar_url')
        .in('id', userIds)
      const userMap = new Map((users || []).map((u: any) => [u.id, u]))

      return activities.map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        activity_time: a.activity_time,
        location: a.location,
        level_requirement: a.level_requirement,
        max_participants: a.max_participants,
        current_participants: a.current_participants,
        fee_description: a.fee_description,
        status: a.status,
        auto_approve: a.auto_approve,
        user_nickname: userMap.get(a.user_id)?.nickname || '未知用户',
        user_avatar: userMap.get(a.user_id)?.avatar_url || '',
      }))
    }
    return activities
  }

  async getActivity(id: string, userId?: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('activities')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`Get activity failed: ${error.message}`)
    if (!data) return null

    // Get organizer info
    const { data: user } = await client
      .from('users')
      .select('nickname, avatar_url')
      .eq('id', data.user_id)
      .maybeSingle()

    // Check if current user has registered
    let registration = null
    if (userId) {
      const { data: reg } = await client
        .from('activity_registrations')
        .select('*')
        .eq('activity_id', id)
        .eq('user_id', userId)
        .maybeSingle()
      registration = reg
    }

    return {
      ...data,
      user_nickname: user?.nickname || '未知用户',
      user_avatar: user?.avatar_url || '',
      registration,
    }
  }

  async createActivity(body: {
    circle_id: string; user_id: string; title: string; description?: string;
    activity_time: string; location?: string; location_lat?: string; location_lng?: string;
    level_requirement?: string; max_participants?: number; fee_description?: string;
    auto_approve?: boolean; safety_agreed: boolean; emergency_contact?: string;
  }) {
    const client = getSupabaseClient()

    if (!body.safety_agreed) {
      throw new Error('发布活动前必须阅读安全须知并勾选同意')
    }

    const { data, error } = await client
      .from('activities')
      .insert({
        circle_id: body.circle_id,
        user_id: body.user_id,
        title: body.title,
        description: body.description,
        activity_time: body.activity_time,
        location: body.location,
        location_lat: body.location_lat,
        location_lng: body.location_lng,
        level_requirement: body.level_requirement,
        max_participants: body.max_participants || 10,
        current_participants: 0,
        fee_description: body.fee_description,
        auto_approve: body.auto_approve || false,
        status: 'recruiting',
        emergency_contact: body.emergency_contact,
      })
      .select()
      .maybeSingle()
    if (error) throw new Error(`Create activity failed: ${error.message}`)
    return data
  }

  async registerActivity(body: { activity_id: string; user_id: string; emergency_contact?: string }) {
    const client = getSupabaseClient()

    // Check activity exists and is recruiting
    const { data: activity } = await client
      .from('activities')
      .select('*')
      .eq('id', body.activity_id)
      .maybeSingle()
    if (!activity) throw new Error('活动不存在')
    if (activity.status !== 'recruiting') throw new Error('活动已停止招募')

    // Check if already registered
    const { data: existing } = await client
      .from('activity_registrations')
      .select('id')
      .eq('activity_id', body.activity_id)
      .eq('user_id', body.user_id)
      .maybeSingle()
    if (existing) throw new Error('您已报名该活动')

    const status = activity.auto_approve ? 'approved' : 'pending'

    const { data, error } = await client
      .from('activity_registrations')
      .insert({
        activity_id: body.activity_id,
        user_id: body.user_id,
        status,
        emergency_contact: body.emergency_contact,
      })
      .select()
      .maybeSingle()
    if (error) throw new Error(`Register activity failed: ${error.message}`)

    // If auto-approved, increment participant count
    if (status === 'approved') {
      await client
        .from('activities')
        .update({ current_participants: activity.current_participants + 1 })
        .eq('id', body.activity_id)

      // Check if full
      if (activity.current_participants + 1 >= activity.max_participants) {
        await client
          .from('activities')
          .update({ status: 'full' })
          .eq('id', body.activity_id)
      }
    }

    // Notify organizer
    await client.from('messages').insert({
      user_id: activity.user_id,
      type: 'registration',
      title: '新活动报名',
      content: `用户报名了您发布的活动「${activity.title}」`,
      related_id: body.activity_id,
    })

    return { ...data, status }
  }

  async approveRegistration(body: { registration_id: string; approved: boolean }) {
    const client = getSupabaseClient()

    const { data: registration } = await client
      .from('activity_registrations')
      .select('*')
      .eq('id', body.registration_id)
      .maybeSingle()
    if (!registration) throw new Error('报名记录不存在')

    const newStatus = body.approved ? 'approved' : 'rejected'
    const { data, error } = await client
      .from('activity_registrations')
      .update({ status: newStatus })
      .eq('id', body.registration_id)
      .select()
      .maybeSingle()
    if (error) throw new Error(`Approve registration failed: ${error.message}`)

    if (body.approved) {
      const { data: activity } = await client
        .from('activities')
        .select('current_participants, max_participants, title')
        .eq('id', registration.activity_id)
        .maybeSingle()
      if (activity) {
        const newCount = activity.current_participants + 1
        const updates: Record<string, unknown> = { current_participants: newCount }
        if (newCount >= activity.max_participants) {
          updates.status = 'full'
        }
        await client.from('activities').update(updates).eq('id', registration.activity_id)
      }
    }

    // Notify the user
    await client.from('messages').insert({
      user_id: registration.user_id,
      type: 'registration_result',
      title: body.approved ? '报名已通过' : '报名未通过',
      content: body.approved ? '您报名的活动已通过审核' : '您报名的活动未通过审核',
      related_id: registration.activity_id,
    })

    return data
  }
}
