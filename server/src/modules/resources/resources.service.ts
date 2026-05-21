import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class ResourcesService {
  async listResources(circleId: string, type?: string) {
    const client = getSupabaseClient()
    let query = client
      .from('resources')
      .select('*')
      .eq('circle_id', circleId)

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
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

  async createResource(circleId: string, body: { title: string; type: string; template_data?: any; user_id: string }) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('resources')
      .insert({
        circle_id: circleId,
        title: body.title,
        type: body.type,
        template_data: body.template_data || {},
        created_by: body.user_id,
      })
      .select()
      .maybeSingle()
    if (error) throw new Error(`Create resource failed: ${error.message}`)
    return data
  }

  async updateResource(id: string, body: { title?: string; template_data?: any; user_id: string }) {
    const client = getSupabaseClient()

    // Check if user is circle owner/admin
    const { data: resource } = await client
      .from('resources')
      .select('circle_id')
      .eq('id', id)
      .maybeSingle()
    if (!resource) throw new Error('资源不存在')

    const { data: member } = await client
      .from('circle_members')
      .select('role')
      .eq('circle_id', resource.circle_id)
      .eq('user_id', body.user_id)
      .maybeSingle()

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      throw new Error('仅主理人或管理员可编辑资料库')
    }

    const updates: Record<string, unknown> = {}
    if (body.title) updates.title = body.title
    if (body.template_data) updates.template_data = body.template_data

    const { data, error } = await client
      .from('resources')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw new Error(`Update resource failed: ${error.message}`)
    return data
  }

  async submitCorrection(resourceId: string, body: { user_id: string; content: string; type: string }) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('resource_submissions')
      .insert({
        resource_id: resourceId,
        user_id: body.user_id,
        content: body.content,
        type: body.type,
        status: 'pending',
      })
      .select()
      .maybeSingle()
    if (error) throw new Error(`Submit correction failed: ${error.message}`)
    return data
  }

  async approveSubmission(submissionId: string, approved: boolean) {
    const client = getSupabaseClient()
    const status = approved ? 'approved' : 'rejected'

    const { data: submission } = await client
      .from('resource_submissions')
      .select('*')
      .eq('id', submissionId)
      .maybeSingle()
    if (!submission) throw new Error('提交记录不存在')

    const { data, error } = await client
      .from('resource_submissions')
      .update({ status })
      .eq('id', submissionId)
      .select()
      .maybeSingle()
    if (error) throw new Error(`Approve submission failed: ${error.message}`)

    // If approved, apply the correction to the resource
    if (approved && submission.type === 'correction') {
      await client
        .from('resources')
        .update({ template_data: submission.content })
        .eq('id', submission.resource_id)
    }

    return data
  }
}
