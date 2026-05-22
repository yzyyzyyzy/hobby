import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common'
import { ResourcesService } from './resources.service'

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get('circle/:circleId')
  async listResources(
    @Param('circleId') circleId: string,
    @Query('template_type') templateType?: string,
  ) {
    console.log('[Resources] GET /api/resources/circle/:circleId', circleId, templateType)
    const result = await this.resourcesService.listResources(circleId, templateType)
    return { code: 200, msg: 'success', data: result }
  }

  @Get(':id')
  async getResource(@Param('id') id: string) {
    console.log('[Resources] GET /api/resources/:id', id)
    const result = await this.resourcesService.getResource(id)
    return { code: 200, msg: 'success', data: result }
  }

  @Post(':id/submit')
  async submitCorrection(
    @Param('id') id: string,
    @Body() body: { user_id: string; content: any; type: string },
  ) {
    console.log('[Resources] POST /api/resources/:id/submit', id)
    const result = await this.resourcesService.submitCorrection(id, body)
    return { code: 200, msg: 'success', data: result }
  }
}
