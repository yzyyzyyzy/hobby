import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class ResourcesService {
  async listResources(circleId: string, templateType?: string) {
    const client = getSupabaseClient()
    let query = client
      .from('resources')
      .select('*')
      .eq('circle_id', circleId)

    if (templateType) {
      query = query.eq('template_type', templateType)
    }

    const { data, error } = await query.order('sort_order', { ascending: true })
    if (error) throw new Error(`List resources failed: ${error.message}`)
    return data
  }

  async getResource(id: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('resources')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`Get resource failed: ${error.message}`)
    return data
  }

  async submitCorrection(resourceId: string, body: { user_id: string; content: any; type: string }) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('resource_submissions')
      .insert({
        resource_id: resourceId,
        user_id: body.user_id,
        content: body.content,
        submission_type: body.type,
        status: 'pending',
      })
      .select()
      .maybeSingle()
    if (error) throw new Error(`Submit correction failed: ${error.message}`)
    return data
  }

  // ===== Resource Items =====

  async getItemsByResource(resourceId: string, city?: string, sortBy?: string, userId?: string) {
    const supabase = getSupabaseClient()
    let query = supabase
      .from('resource_items')
      .select('*')
      .eq('resource_id', resourceId)
      .eq('status', 'approved')

    if (city) query = query.eq('city', city)
    if (sortBy === 'likes') {
      query = query.order('like_count', { ascending: false })
    } else {
      query = query.order('sort_order', { ascending: true })
    }

    const { data, error } = await query
    if (error) throw new Error(`Get items failed: ${error.message}`)

    // Check which items the user has liked
    if (userId && data && data.length > 0) {
      const itemIds = data.map((item: any) => item.id)
      const { data: likes } = await supabase
        .from('resource_item_likes')
        .select('item_id')
        .eq('user_id', userId)
        .in('item_id', itemIds)
      const likedIds = new Set((likes || []).map((l: any) => l.item_id))
      data.forEach((item: any) => { item.is_liked = likedIds.has(item.id) })
    } else if (data) {
      data.forEach((item: any) => { item.is_liked = false })
    }

    return data
  }

  async getItemById(itemId: string, userId?: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('resource_items')
      .select('*')
      .eq('id', itemId)
      .single()
    if (error) throw new Error(`Get item failed: ${error.message}`)

    if (userId && data) {
      const { data: like } = await supabase
        .from('resource_item_likes')
        .select('id')
        .eq('item_id', itemId)
        .eq('user_id', userId)
        .maybeSingle()
      data.is_liked = !!like
    } else if (data) {
      data.is_liked = false
    }
    return data
  }

  async checkLike(itemId: string, userId: string) {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from('resource_item_likes')
      .select('id')
      .eq('item_id', itemId)
      .eq('user_id', userId)
      .maybeSingle()
    return { is_liked: !!data }
  }

  async toggleLike(itemId: string, userId: string) {
    const supabase = getSupabaseClient()
    const { data: existing } = await supabase
      .from('resource_item_likes')
      .select('id')
      .eq('item_id', itemId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      await supabase.from('resource_item_likes').delete().eq('id', existing.id)
      await supabase.rpc('increment_item_like_count', { item_id_input: itemId, count_input: -1 })
      return { liked: false }
    } else {
      const { error } = await supabase.from('resource_item_likes').insert({ item_id: itemId, user_id: userId })
      if (error) throw new Error(`Like failed: ${error.message}`)
      await supabase.rpc('increment_item_like_count', { item_id_input: itemId, count_input: 1 })
      return { liked: true }
    }
  }

  async getCitiesByResource(resourceId: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('resource_items')
      .select('city')
      .eq('resource_id', resourceId)
      .eq('status', 'approved')
      .not('city', 'is', null)
    if (error) throw new Error(`Get cities failed: ${error.message}`)
    const cities = [...new Set((data || []).map((d: any) => d.city).filter(Boolean))]
    return cities
  }

  async createItem(dto: { resource_id: string; title: string; subtitle?: string; image_url?: string; rich_content?: any; city?: string; tags?: string[]; sort_order?: number }) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from('resource_items').insert({
      resource_id: dto.resource_id,
      title: dto.title,
      subtitle: dto.subtitle || null,
      image_url: dto.image_url || null,
      rich_content: dto.rich_content || {},
      city: dto.city || null,
      tags: dto.tags || [],
      sort_order: dto.sort_order || 0,
      status: 'approved',
    }).select().single()
    if (error) throw new Error(`Create item failed: ${error.message}`)
    return data
  }

  async updateItem(itemId: string, dto: { title?: string; subtitle?: string; image_url?: string; rich_content?: any; city?: string; tags?: string[] }) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from('resource_items').update({
      ...dto,
      updated_at: new Date().toISOString(),
    }).eq('id', itemId).select().single()
    if (error) throw new Error(`Update item failed: ${error.message}`)
    return data
  }

  async deleteItem(itemId: string) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('resource_items').delete().eq('id', itemId)
    if (error) throw new Error(`Delete item failed: ${error.message}`)
    return { success: true }
  }

  // ===== Item Submissions (user submit new/correction) =====

  async submitItem(dto: { resource_id: string; item_id?: string; submission_type: string; title: string; subtitle?: string; image_url?: string; rich_content?: any; city?: string; tags?: string[]; submitted_by: string }) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from('resource_item_submissions').insert({
      resource_id: dto.resource_id,
      item_id: dto.item_id || null,
      submission_type: dto.submission_type,
      title: dto.title,
      subtitle: dto.subtitle || null,
      image_url: dto.image_url || null,
      rich_content: dto.rich_content || {},
      city: dto.city || null,
      tags: dto.tags || [],
      submitted_by: dto.submitted_by,
      status: 'pending',
    }).select().single()
    if (error) throw new Error(`Submit item failed: ${error.message}`)
    return data
  }

  async getItemSubmissions(resourceId?: string) {
    const supabase = getSupabaseClient()
    let query = supabase.from('resource_item_submissions').select('*, users!resource_item_submissions_submitted_by_fkey(nickname)').order('created_at', { ascending: false })
    if (resourceId) query = query.eq('resource_id', resourceId)
    const { data, error } = await query
    if (error) throw new Error(`Get submissions failed: ${error.message}`)
    return data
  }

  async reviewItemSubmission(submissionId: string, status: string, reviewNote: string, reviewerId: string) {
    const supabase = getSupabaseClient()
    const { data: sub } = await supabase.from('resource_item_submissions').select('*').eq('id', submissionId).single()
    if (!sub) throw new Error('Submission not found')

    await supabase.from('resource_item_submissions').update({
      status,
      reviewed_by: reviewerId,
      review_note: reviewNote || null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', submissionId)

    if (status === 'approved') {
      if (sub.submission_type === 'new') {
        await this.createItem({
          resource_id: sub.resource_id,
          title: sub.title,
          subtitle: sub.subtitle,
          image_url: sub.image_url,
          rich_content: sub.rich_content,
          city: sub.city,
          tags: sub.tags,
        })
      } else if (sub.submission_type === 'correction' && sub.item_id) {
        await this.updateItem(sub.item_id, {
          title: sub.title,
          subtitle: sub.subtitle,
          image_url: sub.image_url,
          rich_content: sub.rich_content,
          city: sub.city,
          tags: sub.tags,
        })
      }
    }
    return { success: true }
  }
}
