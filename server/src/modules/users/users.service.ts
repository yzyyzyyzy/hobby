import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class UsersService {
  async getUserProfile(userId: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw new Error(`Get user profile failed: ${error.message}`)
    return data
  }

  async getUserCircles(userId: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('circle_members')
      .select('circle_id, circles(id, name, category)')
      .eq('user_id', userId)
    if (error) throw new Error(`Get user circles failed: ${error.message}`)
    return (data || []).map((item: any) => ({
      id: item.circles?.id,
      name: item.circles?.name,
      category: item.circles?.category,
    })).filter((c: any) => c.id)
  }

  async getUserPosts(userId: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('posts')
      .select('id, content, circle_id, created_at')
      .eq('user_id', userId)
      .eq('is_draft', false)
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) throw new Error(`Get user posts failed: ${error.message}`)
    return data || []
  }

  async updateProfile(body: { user_id: string; nickname?: string; interest_tags?: string[] }) {
    const client = getSupabaseClient()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.nickname) updates.nickname = body.nickname
    if (body.interest_tags) updates.interest_tags = body.interest_tags

    const { data, error } = await client
      .from('users')
      .update(updates)
      .eq('id', body.user_id)
      .select()
      .maybeSingle()
    if (error) throw new Error(`Update profile failed: ${error.message}`)
    return data
  }
}
