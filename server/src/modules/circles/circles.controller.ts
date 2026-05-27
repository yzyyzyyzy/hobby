import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common'
import { CirclesService } from './circles.service'

@Controller('circles')
export class CirclesController {
  constructor(private readonly circlesService: CirclesService) {}

  @Get()
  async listCircles(
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
    @Query('user_id') userId?: string,
  ) {
    console.log('[Circles] GET /api/circles', { category, keyword, userId })
    const result = await this.circlesService.listCircles({ category, keyword, userId })
    return { code: 200, msg: 'success', data: result }
  }

  @Post()
  async createCircle(@Body() body: { name: string; description?: string; category: string; tags?: string[]; creator_id: string }) {
    console.log('[Circles] POST /api/circles', JSON.stringify({ ...body, description: body.description?.slice(0, 50) }))
    const result = await this.circlesService.createCircle(body)
    return { code: 200, msg: 'success', data: result }
  }

  @Get(':id')
  async getCircle(@Param('id') id: string, @Query('user_id') userId?: string) {
    console.log('[Circles] GET /api/circles/:id', id)
    const result = await this.circlesService.getCircle(id, userId)
    return { code: 200, msg: 'success', data: result }
  }

  @Post('join')
  async joinCircle(@Body() body: { circle_id: string; user_id: string }) {
    console.log('[Circles] POST /api/circles/join', JSON.stringify(body))
    const result = await this.circlesService.joinCircle(body)
    return { code: 200, msg: 'success', data: result }
  }

  @Post('leave')
  async leaveCircle(@Body() body: { circle_id: string; user_id: string }) {
    console.log('[Circles] POST /api/circles/leave', JSON.stringify(body))
    const result = await this.circlesService.leaveCircle(body)
    return { code: 200, msg: 'success', data: result }
  }

  @Post('apply')
  async applyToCreateCircle(
    @Body() body: { applicant_id: string; name: string; description?: string; category: string; tags?: string[] },
  ) {
    console.log('[Circles] POST /api/circles/apply', JSON.stringify(body))
    const result = await this.circlesService.applyToCreateCircle(body)
    return { code: 200, msg: 'success', data: result }
  }

  @Get('applications')
  async getMyApplications(@Query('user_id') userId: string) {
    console.log('[Circles] GET /api/circles/applications', userId)
    const result = await this.circlesService.getMyApplications(userId)
    return { code: 200, msg: 'success', data: result }
  }
}
