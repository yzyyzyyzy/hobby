import { Controller, Post, Get, Query, Body, Req, Res, Logger } from '@nestjs/common'
import { CustomerServiceService } from './customer-service.service'
import { Request, Response } from 'express'

@Controller('customer-service')
export class CustomerServiceController {
  private readonly logger = new Logger(CustomerServiceController.name)

  constructor(private readonly csService: CustomerServiceService) {}

  /**
   * 微信服务器验证接口（GET）
   * 微信服务器会发送验证请求到这个地址
   */
  @Get('callback')
  verifySignature(@Query('signature') signature: string, @Query('timestamp') timestamp: string, @Query('nonce') nonce: string, @Query('echostr') echostr: string, @Res() res: Response) {
    this.logger.log(`Received verification: signature=${signature}, timestamp=${timestamp}, nonce=${nonce}`)
    const isValid = this.csService.verifySignature(signature, timestamp, nonce)
    if (isValid) {
      this.logger.log('Signature verification passed')
      res.send(echostr)
    } else {
      this.logger.warn('Signature verification failed')
      res.status(403).send('Invalid signature')
    }
  }

  /**
   * 微信客服消息回调接口（POST）
   * 接收用户发送给客服的消息
   */
  @Post('callback')
  async handleMessage(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    this.logger.log(`Received customer service message: ${JSON.stringify(body)}`)

    try {
      const { MsgType, Content, FromUserName, ToUserName, CreateTime } = body

      if (MsgType === 'text') {
        // 文本消息 - 自动回复或转发给客服
        this.logger.log(`User ${FromUserName} sent: ${Content}`)

        // 保存消息到数据库
        await this.csService.saveMessage({
          openid: FromUserName,
          msg_type: 'text',
          content: Content,
          direction: 'inbound',
          created_at: new Date(CreateTime * 1000).toISOString(),
        })

        // 返回自动回复（XML格式）
        const replyXml = this.csService.buildTextReply(FromUserName, ToUserName, '感谢您的咨询！客服将尽快回复您，请耐心等待。')
        res.type('application/xml').send(replyXml)
      } else if (MsgType === 'image') {
        // 图片消息
        this.logger.log(`User ${FromUserName} sent an image`)

        await this.csService.saveMessage({
          openid: FromUserName,
          msg_type: 'image',
          content: body.PicUrl || '',
          direction: 'inbound',
          created_at: new Date(CreateTime * 1000).toISOString(),
        })

        const replyXml = this.csService.buildTextReply(FromUserName, ToUserName, '图片已收到，客服将尽快回复您。')
        res.type('application/xml').send(replyXml)
      } else if (MsgType === 'event') {
        // 事件消息（如用户进入客服会话）
        const event = body.Event
        if (event === 'user_enter_tempsession') {
          this.logger.log(`User ${FromUserName} entered customer service session`)
          const replyXml = this.csService.buildTextReply(FromUserName, ToUserName, '您好！欢迎咨询 Hobby 客服，请问有什么可以帮助您的？')
          res.type('application/xml').send(replyXml)
        } else {
          res.send('success')
        }
      } else {
        res.send('success')
      }
    } catch (error) {
      this.logger.error(`Error handling customer service message: ${error.message}`)
      res.send('success')
    }
  }

  /**
   * 获取客服消息记录
   */
  @Get('messages')
  async getMessages(@Query('openid') openid: string, @Query('limit') limit: string) {
    const messages = await this.csService.getMessages(openid, parseInt(limit) || 50)
    return { code: 200, msg: 'success', data: messages }
  }

  /**
   * 管理员：发送客服消息给用户
   */
  @Post('send')
  async sendMessage(@Body() body: { openid: string; msg_type: string; content: string }) {
    const result = await this.csService.sendCustomMessage(body.openid, body.msg_type, body.content)
    return { code: 200, msg: 'success', data: result }
  }

  /**
   * 管理员：获取客服消息列表
   */
  @Get('admin/messages')
  async getAdminMessages(@Query('page') page: string, @Query('limit') limit: string) {
    const result = await this.csService.getAdminMessages(parseInt(page) || 1, parseInt(limit) || 20)
    return { code: 200, msg: 'success', data: result }
  }
}
