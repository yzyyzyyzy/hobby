import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class AuthService {
  async login(body: { code: string; nickname?: string; avatar_url?: string }) {
    const client = getSupabaseClient()

    // In production, exchange code for openid via WeChat API
    // For development, use code as openid
    const openid = `dev_${body.code}_${Date.now()}`

    // Check if user exists
    const { data: existingUser, error: findError } = await client
      .from('users')
      .select('*')
      .eq('openid', openid)
      .maybeSingle()

    if (findError) throw new Error(`Find user failed: ${findError.message}`)

    if (existingUser) {
      // Update nickname/avatar if provided
      const updates: Record<string, unknown> = {}
      if (body.nickname && body.nickname !== 'Hobby用户') updates.nickname = body.nickname
      if (body.avatar_url) updates.avatar_url = body.avatar_url
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString()
        const { data: updated, error: updateError } = await client
          .from('users')
          .update(updates)
          .eq('id', existingUser.id)
          .select()
          .maybeSingle()
        if (updateError) throw new Error(`Update user failed: ${updateError.message}`)
        return updated || existingUser
      }
      return existingUser
    }

    // Create new user
    const { data: newUser, error: createError } = await client
      .from('users')
      .insert({
        openid,
        nickname: body.nickname || 'Hobby用户',
        avatar_url: body.avatar_url || null,
        interest_tags: [],
      })
      .select()
      .maybeSingle()

    if (createError) throw new Error(`Create user failed: ${createError.message}`)
    return newUser
  }
}
