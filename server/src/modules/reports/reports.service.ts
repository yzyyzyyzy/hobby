import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class ReportsService {
  async createReport(body: { reporter_id: string; target_type: string; target_id: string; reason: string; description?: string }) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('reports')
      .insert({
        reporter_id: body.reporter_id,
        target_type: body.target_type,
        target_id: body.target_id,
        reason: body.reason,
        description: body.description,
        status: 'pending',
      })
      .select()
      .maybeSingle()
    if (error) throw new Error(`Create report failed: ${error.message}`)
    return data
  }

  async listReports() {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('reports')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (error) throw new Error(`List reports failed: ${error.message}`)
    return data
  }

  async handleReport(body: { id: string; status: string; action?: string }) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('reports')
      .update({ status: body.status })
      .eq('id', body.id)
      .select()
      .maybeSingle()
    if (error) throw new Error(`Handle report failed: ${error.message}`)

    // If action is delete, remove the target content
    if (body.action === 'delete' && data) {
      if (data.target_type === 'post') {
        await client.from('posts').delete().eq('id', data.target_id)
      } else if (data.target_type === 'comment') {
        await client.from('comments').delete().eq('id', data.target_id)
      }
    }

    return data
  }

  async addBlockedKeyword(keyword: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('blocked_keywords')
      .insert({ keyword })
      .select()
      .maybeSingle()
    if (error) throw new Error(`Add keyword failed: ${error.message}`)
    return data
  }

  async listBlockedKeywords() {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('blocked_keywords')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw new Error(`List keywords failed: ${error.message}`)
    return data
  }

  async checkContentSafety(content: string): Promise<boolean> {
    const client = getSupabaseClient()
    const { data: keywords } = await client
      .from('blocked_keywords')
      .select('keyword')
    if (keywords && keywords.length > 0) {
      for (const kw of keywords) {
        if (content.includes(kw.keyword)) {
          return false
        }
      }
    }
    return true
  }
}
