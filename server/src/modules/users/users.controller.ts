import { Controller, Get, Put, Body, Query } from '@nestjs/common'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getUserProfile(@Query('user_id') userId: string) {
    console.log('[Users] GET /api/users/profile', userId)
    const result = await this.usersService.getUserProfile(userId)
    return { code: 200, msg: 'success', data: result }
  }

  @Get('circles')
  async getUserCircles(@Query('user_id') userId: string) {
    console.log('[Users] GET /api/users/circles', userId)
    const result = await this.usersService.getUserCircles(userId)
    return { code: 200, msg: 'success', data: result }
  }

  @Get('posts')
  async getUserPosts(@Query('user_id') userId: string) {
    console.log('[Users] GET /api/users/posts', userId)
    const result = await this.usersService.getUserPosts(userId)
    return { code: 200, msg: 'success', data: result }
  }

  @Put('profile')
  async updateProfile(@Body() body: { user_id: string; nickname?: string; interest_tags?: string[] }) {
    console.log('[Users] PUT /api/users/profile', JSON.stringify(body))
    const result = await this.usersService.updateProfile(body)
    return { code: 200, msg: 'success', data: result }
  }
}
