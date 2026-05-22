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
}
