import { Injectable, Logger } from '@nestjs/common'
import { getSupabaseClient } from '../../storage/database/supabase-client'
import * as crypto from 'crypto'

@Injectable()
export class CustomerServiceService {
  private readonly logger = new Logger(CustomerServiceService.name)
  private supabase = getSupabaseClient()

  // 微信小程序的 Token（需要在微信公众平台配置一致）
  private readonly WX_CS_TOKEN = process.env.WX_CS_TOKEN || 'hobby_cs_token_2025'
  // 微信小程序的 EncodingAESKey（用于消息加解密，可选）
  private readonly WX_CS_AES_KEY = process.env.WX_CS_AES_KEY || ''

  /**
   * 验证微信服务器签名
   */
  verifySignature(signature: string, timestamp: string, nonce: string): boolean {
    const tmpArr = [this.WX_CS_TOKEN, timestamp, nonce]
    tmpArr.sort()
    const tmpStr = tmpArr.join('')
    const hash = crypto.createHash('sha1').update(tmpStr).digest('hex')
    return hash === signature
  }

  /**
   * 构建文本回复 XML
   */
  buildTextReply(toUser: string, fromUser: string, content: string): string {
    const timestamp = Math.floor(Date.now() / 1000)
    return `<xml>
  <ToUserName><![CDATA[${toUser}]]></ToUserName>
  <FromUserName><![CDATA[${fromUser}]]></FromUserName>
  <CreateTime>${timestamp}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[${content}]]></Content>
</xml>`
  }

  /**
   * 保存消息到数据库
   */
  async saveMessage(msg: { openid: string; msg_type: string; content: string; direction: string; created_at: string }) {
    console.log(`[CustomerService] saveMessage: openid=${msg.openid}, type=${msg.msg_type}, direction=${msg.direction}`)

    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        user_id: msg.openid,
        type: `cs_${msg.msg_type}`,
        content: msg.content,
        is_read: msg.direction === 'outbound',
      })
      .select()
      .single()

    if (error) {
      console.error(`[CustomerService] saveMessage error: ${error.message}`)
    }

    return data
  }

  /**
   * 获取用户的客服消息记录
   */
  async getMessages(openid: string, limit: number) {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('user_id', openid)
      .like('type', 'cs_%')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error(`[CustomerService] getMessages error: ${error.message}`)
      return []
    }

    return data
  }

  /**
   * 发送客服消息给用户（调用微信API）
   * 注意：需要在微信后台获取 access_token
   */
  async sendCustomMessage(openid: string, msgType: string, content: string): Promise<any> {
    const accessToken = await this.getAccessToken()
    if (!accessToken) {
      this.logger.warn('Access token not available, message not sent')
      return { success: false, message: 'Access token not configured' }
    }

    const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`

    let body: any = {
      touser: openid,
      msgtype: msgType,
    }

    if (msgType === 'text') {
      body.text = { content }
    } else if (msgType === 'image') {
      body.image = { media_id: content }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await response.json()
      console.log(`[CustomerService] sendCustomMessage result:`, result)

      // 保存发送的消息
      await this.saveMessage({
        openid,
        msg_type: msgType,
        content,
        direction: 'outbound',
        created_at: new Date().toISOString(),
      })

      return result
    } catch (err) {
      console.error(`[CustomerService] sendCustomMessage error: ${err.message}`)
      return { success: false, message: err.message }
    }
  }

  /**
   * 管理员：获取所有客服消息列表
   */
  async getAdminMessages(page: number, limit: number) {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const [countResult, dataResult] = await Promise.all([
      this.supabase.from('messages').select('id', { count: 'exact', head: true }).like('type', 'cs_%'),
      this.supabase
        .from('messages')
        .select('*')
        .like('type', 'cs_%')
        .order('created_at', { ascending: false })
        .range(from, to),
    ])

    return {
      total: countResult.count || 0,
      page,
      limit,
      items: dataResult.data || [],
    }
  }

  /**
   * 获取微信 access_token
   * 实际项目中应该缓存 token（有效期2小时）
   */
  private async getAccessToken(): Promise<string | null> {
    const appId = process.env.WX_APPID
    const appSecret = process.env.WX_APP_SECRET

    if (!appId || !appSecret) {
      this.logger.warn('WX_APPID or WX_APP_SECRET not configured')
      return null
    }

    try {
      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`
      const response = await fetch(url)
      const data = await response.json()
      return data.access_token || null
    } catch (err) {
      this.logger.error(`Failed to get access token: ${err.message}`)
      return null
    }
  }
}
