import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common'
import { ActivitiesService } from './activities.service'

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get(':id')
  async getActivity(@Param('id') id: string, @Query('user_id') userId?: string) {
    console.log('[Activities] GET /api/activities/:id', id)
    const result = await this.activitiesService.getActivity(id, userId)
    return { code: 200, msg: 'success', data: result }
  }

  @Post()
  async createActivity(@Body() body: {
    circle_id: string; user_id: string; title: string; description?: string;
    activity_time: string; location?: string; location_lat?: string; location_lng?: string;
    level_requirement?: string; max_participants?: number; fee_description?: string;
    auto_approve?: boolean; safety_agreed: boolean; emergency_contact?: string;
  }) {
    console.log('[Activities] POST /api/activities', JSON.stringify({ ...body, description: body.description?.slice(0, 50) }))
    const result = await this.activitiesService.createActivity(body)
    return { code: 200, msg: 'success', data: result }
  }

  @Post('register')
  async registerActivity(@Body() body: { activity_id: string; user_id: string; emergency_contact?: string }) {
    console.log('[Activities] POST /api/activities/register', JSON.stringify(body))
    const result = await this.activitiesService.registerActivity(body)
    return { code: 200, msg: 'success', data: result }
  }

  @Post(':id/approve')
  async approveRegistration(@Param('id') id: string, @Body() body: { registration_id: string; approved: boolean }) {
    console.log('[Activities] POST /api/activities/:id/approve', id)
    const result = await this.activitiesService.approveRegistration(body)
    return { code: 200, msg: 'success', data: result }
  }
}

@Controller('circles')
export class CircleActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get(':circleId/activities')
  async getCircleActivities(@Param('circleId') circleId: string) {
    console.log('[CircleActivities] GET /api/circles/:circleId/activities', circleId)
    const result = await this.activitiesService.listActivities(circleId)
    return { code: 200, msg: 'success', data: result }
  }
}
