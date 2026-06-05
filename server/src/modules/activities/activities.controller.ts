import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common'
import { ActivitiesService } from './activities.service'

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async listActivities(@Query('circle_id') circleId: string) {
    console.log('[Activities] GET /api/activities', { circleId })
    const result = await this.activitiesService.listActivities(circleId)
    return { code: 200, msg: 'success', data: result }
  }

  @Get(':id')
  async getActivity(@Param('id') id: string, @Query('user_id') userId?: string) {
    console.log('[Activities] GET /api/activities/:id', id)
    const result = await this.activitiesService.getActivity(id, userId)
    return { code: 200, msg: 'success', data: result }
  }

  @Get(':id/my-status')
  async getMyStatus(@Param('id') id: string, @Query('user_id') userId: string) {
    console.log('[Activities] GET my-status', id, userId)
    const result = await this.activitiesService.getUserRegistrationStatus(id, userId)
    return { code: 200, msg: 'success', data: result }
  }

  @Get(':id/participants')
  async getParticipants(@Param('id') id: string) {
    console.log('[Activities] GET participants', id)
    const result = await this.activitiesService.getRegistrations(id)
    return { code: 200, msg: 'success', data: result }
  }

  @Get(':id/registrations')
  async getRegistrations(@Param('id') id: string) {
    console.log('[Activities] GET /api/activities/:id/registrations', id)
    const result = await this.activitiesService.getRegistrations(id)
    return { code: 200, msg: 'success', data: result }
  }

  @Post()
  async createActivity(@Body() body: {
    circle_id: string; user_id: string; title: string; description?: string;
    activity_time: string; location?: string; location_lat?: string; location_lng?: string;
    level_requirement?: string; max_participants?: number; fee_description?: string;
    auto_approve?: boolean; safety_agreed: boolean;
    emergency_contact_name?: string; emergency_contact_phone?: string;
  }) {
    console.log('[Activities] POST /api/activities', JSON.stringify({ ...body, description: body.description?.slice(0, 50) }))
    const result = await this.activitiesService.createActivity(body)
    return { code: 200, msg: 'success', data: result }
  }

  @Post('register')
  async registerActivity(@Body() body: { activity_id: string; user_id: string; emergency_contact_name?: string; emergency_contact_phone?: string; safety_agreed: boolean }) {
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

  @Post(':id/cancel')
  async cancelActivity(@Param('id') id: string, @Body() body: { user_id: string }) {
    console.log('[Activities] POST cancel', id)
    const result = await this.activitiesService.cancelActivity(id, body.user_id)
    return { code: 200, msg: 'success', data: result }
  }

  @Post(':id/complete')
  async completeActivity(@Param('id') id: string, @Body() body: { user_id: string }) {
    console.log('[Activities] POST complete', id)
    const result = await this.activitiesService.completeActivity(id, body.user_id)
    return { code: 200, msg: 'success', data: result }
  }

  @Put(':id/status')
  async updateActivityStatus(@Param('id') id: string, @Body() body: { user_id: string; status: string }) {
    console.log('[Activities] PUT /api/activities/:id/status', id, body.status)
    const result = await this.activitiesService.updateActivityStatus(id, body.user_id, body.status)
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
