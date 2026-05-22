import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'hobby2025'

@Injectable()
export class AdminService {
  // ===== Auth =====
  async adminLogin(body: { username: string; password: string }) {
    if (body.username !== ADMIN_USERNAME || body.password !== ADMIN_PASSWORD) {
      throw new Error('管理员账号或密码错误')
    }
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .maybeSingle()
    if (error || !data) throw new Error('管理员账户不存在')
    return data
  }

  async checkAdmin(userId: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw new Error('查询用户失败')
    return { is_admin: data?.role === 'admin' }
  }

  // ===== Circle Management =====
  async listCircles(params: { category?: string; keyword?: string }) {
    const client = getSupabaseClient()
    let query = client.from('circles').select('*')
    if (params.category) query = query.eq('category', params.category)
    if (params.keyword) query = query.or(`name.ilike.%${params.keyword}%,description.ilike.%${params.keyword}%`)
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw new Error(`List circles failed: ${error.message}`)
    return data
  }

  async createCircle(body: { name: string; description?: string; category: string; tags?: string[] }) {
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

  async updateCircle(id: string, body: Record<string, unknown>) {
    const client = getSupabaseClient()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.name !== undefined) updates.name = body.name
    if (body.description !== undefined) updates.description = body.description
    if (body.category !== undefined) updates.category = body.category
    if (body.tags !== undefined) updates.tags = body.tags
    if (body.cover_url !== undefined) updates.cover_url = body.cover_url
    const { data, error } = await client
      .from('circles')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw new Error(`Update circle failed: ${error.message}`)
    return data
  }

  async deleteCircle(id: string) {
    const client = getSupabaseClient()
    const { error } = await client.from('circles').delete().eq('id', id)
    if (error) throw new Error(`Delete circle failed: ${error.message}`)
    return { success: true }
  }

  // ===== Resource Template Management =====
  async listResources(circleId: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('resources')
      .select('*')
      .eq('circle_id', circleId)
      .order('sort_order', { ascending: true })
    if (error) throw new Error(`List resources failed: ${error.message}`)
    return data
  }

  async createResource(body: {
    circle_id: string; title: string; template_type: string;
    description?: string; cover_url?: string; template_data?: any; sort_order?: number
  }) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('resources')
      .insert({
        circle_id: body.circle_id,
        title: body.title,
        template_type: body.template_type,
        description: body.description,
        cover_url: body.cover_url,
        template_data: body.template_data || {},
        sort_order: body.sort_order || 0,
      })
      .select()
      .maybeSingle()
    if (error) throw new Error(`Create resource failed: ${error.message}`)
    return data
  }

  async updateResource(id: string, body: Record<string, unknown>) {
    const client = getSupabaseClient()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.title !== undefined) updates.title = body.title
    if (body.template_type !== undefined) updates.template_type = body.template_type
    if (body.description !== undefined) updates.description = body.description
    if (body.cover_url !== undefined) updates.cover_url = body.cover_url
    if (body.template_data !== undefined) updates.template_data = body.template_data
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order
    const { data, error } = await client
      .from('resources')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw new Error(`Update resource failed: ${error.message}`)
    return data
  }

  async deleteResource(id: string) {
    const client = getSupabaseClient()
    const { error } = await client.from('resources').delete().eq('id', id)
    if (error) throw new Error(`Delete resource failed: ${error.message}`)
    return { success: true }
  }

  // ===== Report Management =====
  async listReports(status?: string) {
    const client = getSupabaseClient()
    let query = client
      .from('reports')
      .select('*, reporter:users!reports_reporter_id_fkey(nickname, avatar_url)')
      .order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) throw new Error(`List reports failed: ${error.message}`)
    return data
  }

  async handleReport(id: string, body: { status: string; review_note?: string }) {
    const client = getSupabaseClient()
    const updates: Record<string, unknown> = { status: body.status }
    if (body.review_note) updates.review_note = body.review_note
    const { data, error } = await client
      .from('reports')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw new Error(`Handle report failed: ${error.message}`)
    return data
  }

  // ===== Keyword Management =====
  async listKeywords() {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('blocked_keywords')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw new Error(`List keywords failed: ${error.message}`)
    return data
  }

  async addKeyword(body: { keyword: string; category?: string }) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('blocked_keywords')
      .insert({ keyword: body.keyword, category: body.category })
      .select()
      .maybeSingle()
    if (error) throw new Error(`Add keyword failed: ${error.message}`)
    return data
  }

  async deleteKeyword(id: string) {
    const client = getSupabaseClient()
    const { error } = await client.from('blocked_keywords').delete().eq('id', id)
    if (error) throw new Error(`Delete keyword failed: ${error.message}`)
    return { success: true }
  }

  // ===== Post Management =====
  async deletePost(id: string) {
    const client = getSupabaseClient()
    const { error } = await client.from('posts').delete().eq('id', id)
    if (error) throw new Error(`Delete post failed: ${error.message}`)
    return { success: true }
  }

  // ===== User Management =====
  async listUsers(keyword?: string) {
    const client = getSupabaseClient()
    let query = client.from('users').select('id, nickname, avatar_url, role, created_at').order('created_at', { ascending: false })
    if (keyword) query = query.or(`nickname.ilike.%${keyword}%,openid.ilike.%${keyword}%`)
    const { data, error } = await query.limit(100)
    if (error) throw new Error(`List users failed: ${error.message}`)
    return data
  }

  async updateUserRole(id: string, role: string) {
    if (role !== 'user' && role !== 'admin') throw new Error('无效的角色')
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw new Error(`Update user role failed: ${error.message}`)
    return data
  }

  // ===== Stats =====
  async getStats() {
    const client = getSupabaseClient()
    const [circles, users, posts, reports, resources] = await Promise.all([
      client.from('circles').select('id', { count: 'exact', head: true }),
      client.from('users').select('id', { count: 'exact', head: true }),
      client.from('posts').select('id', { count: 'exact', head: true }),
      client.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      client.from('resources').select('id', { count: 'exact', head: true }),
    ])
    return {
      circle_count: circles.count || 0,
      user_count: users.count || 0,
      post_count: posts.count || 0,
      pending_report_count: reports.count || 0,
      resource_count: resources.count || 0,
    }
  }
}
