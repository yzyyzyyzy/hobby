import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common'
import { MessagesService } from './messages.service'

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async getMessages(@Query('user_id') userId: string, @Query('type') type?: string) {
    console.log('[Messages] GET /api/messages', { userId, type })
    const result = await this.messagesService.listMessages(userId, type)
    return { code: 200, msg: 'success', data: result }
  }

  @Put(':id/read')
  async markRead(@Param('id') id: string) {
    console.log('[Messages] PUT /api/messages/:id/read', id)
    const result = await this.messagesService.markRead(id)
    return { code: 200, msg: 'success', data: result }
  }

  @Put('read-all')
  async markAllRead(@Body() body: { user_id: string }) {
    console.log('[Messages] PUT /api/messages/read-all')
    const result = await this.messagesService.markAllRead(body.user_id)
    return { code: 200, msg: 'success', data: result }
  }

  @Get('unread-count')
  async getUnreadCount(@Query('user_id') userId: string) {
    console.log('[Messages] GET /api/messages/unread-count', userId)
    const result = await this.messagesService.getUnreadCount(userId)
    return { code: 200, msg: 'success', data: { count: result } }
  }

  @Get('settings')
  async getNotificationSettings(@Query('user_id') userId: string) {
    console.log('[Messages] GET /api/messages/settings', userId)
    const result = await this.messagesService.getNotificationSettings(userId)
    return { code: 200, msg: 'success', data: result }
  }

  @Post('settings')
  async updateNotificationSettings(@Body() body: { user_id: string; circle_id?: string; type?: string; muted: boolean }) {
    console.log('[Messages] POST /api/messages/settings')
    const result = await this.messagesService.updateNotificationSettings(body)
    return { code: 200, msg: 'success', data: result }
  }
}
