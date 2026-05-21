import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class MessagesService {
  async listMessages(userId: string, type?: string) {
    const client = getSupabaseClient()
    let query = client
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query.limit(50)
    if (error) throw new Error(`List messages failed: ${error.message}`)
    return data
  }

  async markRead(id: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('messages')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw new Error(`Mark read failed: ${error.message}`)
    return data
  }

  async markAllRead(userId: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('messages')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    if (error) throw new Error(`Mark all read failed: ${error.message}`)
    return { success: true }
  }

  async getUnreadCount(userId: string) {
    const client = getSupabaseClient()
    const { count, error } = await client
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    if (error) throw new Error(`Get unread count failed: ${error.message}`)
    return count || 0
  }

  async getNotificationSettings(userId: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
    if (error) throw new Error(`Get notification settings failed: ${error.message}`)
    return data
  }

  async updateNotificationSettings(body: { user_id: string; circle_id?: string; type?: string; muted: boolean }) {
    const client = getSupabaseClient()

    // Upsert notification setting
    const conditions: Record<string, unknown> = { user_id: body.user_id }
    if (body.circle_id) conditions.circle_id = body.circle_id
    if (body.type) conditions.type = body.type

    // Check existing
    let query = client
      .from('notification_settings')
      .select('id')
      .eq('user_id', body.user_id)

    if (body.circle_id) {
      query = query.eq('circle_id', body.circle_id)
    }
    if (body.type) {
      query = query.eq('type', body.type)
    }

    const { data: existing } = await query.maybeSingle()

    if (existing) {
      const { data, error } = await client
        .from('notification_settings')
        .update({ muted: body.muted })
        .eq('id', existing.id)
        .select()
        .maybeSingle()
      if (error) throw new Error(`Update notification settings failed: ${error.message}`)
      return data
    }

    const { data, error } = await client
      .from('notification_settings')
      .insert({
        user_id: body.user_id,
        circle_id: body.circle_id || null,
        type: body.type || 'all',
        muted: body.muted,
      })
      .select()
      .maybeSingle()
    if (error) throw new Error(`Create notification settings failed: ${error.message}`)
    return data
  }
}
