import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common'
import { ResourcesService } from './resources.service'

@Controller('circles')
export class CircleResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get(':circleId/resources')
  async getCircleResources(@Param('circleId') circleId: string, @Query('type') type?: string) {
    console.log('[CircleResources] GET /api/circles/:circleId/resources', circleId)
    const result = await this.resourcesService.listResources(circleId, type)
    return { code: 200, msg: 'success', data: result }
  }

  @Post(':circleId/resources')
  async createResource(@Param('circleId') circleId: string, @Body() body: {
    title: string; type: string; template_data?: any; user_id: string;
  }) {
    console.log('[CircleResources] POST /api/circles/:circleId/resources', circleId)
    const result = await this.resourcesService.createResource(circleId, body)
    return { code: 200, msg: 'success', data: result }
  }
}

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get(':id')
  async getResource(@Param('id') id: string) {
    console.log('[Resources] GET /api/resources/:id', id)
    const result = await this.resourcesService.getResource(id)
    return { code: 200, msg: 'success', data: result }
  }

  @Put(':id')
  async updateResource(@Param('id') id: string, @Body() body: { title?: string; template_data?: any; user_id: string }) {
    console.log('[Resources] PUT /api/resources/:id', id)
    const result = await this.resourcesService.updateResource(id, body)
    return { code: 200, msg: 'success', data: result }
  }

  @Post(':id/submissions')
  async submitCorrection(@Param('id') id: string, @Body() body: { user_id: string; content: string; type: string }) {
    console.log('[Resources] POST /api/resources/:id/submissions', id)
    const result = await this.resourcesService.submitCorrection(id, body)
    return { code: 200, msg: 'success', data: result }
  }

  @Post('submissions/:submissionId/approve')
  async approveSubmission(@Param('submissionId') submissionId: string, @Body() body: { approved: boolean }) {
    console.log('[Resources] POST /api/resources/submissions/:id/approve', submissionId)
    const result = await this.resourcesService.approveSubmission(submissionId, body.approved)
    return { code: 200, msg: 'success', data: result }
  }
}
