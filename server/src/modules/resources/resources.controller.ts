import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common'
import { ResourcesService } from './resources.service'

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  // ===== Special routes first (before :id) =====

  @Get('submissions/list')
  async getSubmissions(@Query('resource_id') resourceId?: string) {
    console.log('[Resources] GET /api/resources/submissions/list')
    const result = await this.resourcesService.getItemSubmissions(resourceId)
    return { code: 200, msg: 'success', data: result }
  }

  @Get('item/:itemId')
  async getItem(@Param('itemId') itemId: string, @Query('user_id') userId?: string) {
    console.log('[Resources] GET /api/resources/item/:itemId', itemId)
    const result = await this.resourcesService.getItemById(itemId, userId)
    return { code: 200, msg: 'success', data: result }
  }

  @Get('item/:itemId/like-check')
  async checkLike(
    @Param('itemId') itemId: string,
    @Query('user_id') userId: string,
  ) {
    console.log('[Resources] GET /api/resources/item/:itemId/like-check', itemId, userId)
    const result = await this.resourcesService.checkLike(itemId, userId)
    return { code: 200, msg: 'success', data: result }
  }

  @Post('item/:itemId/like')
  async toggleLike(
    @Param('itemId') itemId: string,
    @Body() body: { user_id: string },
  ) {
    console.log('[Resources] POST /api/resources/item/:itemId/like', itemId)
    const result = await this.resourcesService.toggleLike(itemId, body.user_id)
    return { code: 200, msg: 'success', data: result }
  }

  @Put('item/:itemId')
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() body: { title?: string; subtitle?: string; image_url?: string; rich_content?: any; city?: string; tags?: string[] },
  ) {
    console.log('[Resources] PUT /api/resources/item/:itemId', itemId)
    const result = await this.resourcesService.updateItem(itemId, body)
    return { code: 200, msg: 'success', data: result }
  }

  @Post('item/submit')
  async submitItem(
    @Body() body: { resource_id: string; item_id?: string; submission_type: string; title: string; subtitle?: string; image_url?: string; rich_content?: any; city?: string; tags?: string[]; submitted_by: string },
  ) {
    console.log('[Resources] POST /api/resources/item/submit', body.title)
    const result = await this.resourcesService.submitItem(body)
    return { code: 200, msg: 'success', data: result }
  }

  @Put('submissions/:id/review')
  async reviewSubmission(
    @Param('id') id: string,
    @Body() body: { status: string; review_note: string; reviewer_id: string },
  ) {
    console.log('[Resources] PUT /api/resources/submissions/:id/review', id, body.status)
    const result = await this.resourcesService.reviewItemSubmission(id, body.status, body.review_note, body.reviewer_id)
    return { code: 200, msg: 'success', data: result }
  }

  // ===== Resource-level routes =====

  @Get('circle/:circleId')
  async listResources(
    @Param('circleId') circleId: string,
    @Query('template_type') templateType?: string,
  ) {
    console.log('[Resources] GET /api/resources/circle/:circleId', circleId, templateType)
    const result = await this.resourcesService.listResources(circleId, templateType)
    return { code: 200, msg: 'success', data: result }
  }

  @Get(':id/items')
  async getItems(
    @Param('id') id: string,
    @Query('city') city?: string,
    @Query('sort_by') sortBy?: string,
    @Query('user_id') userId?: string,
  ) {
    console.log('[Resources] GET /api/resources/:id/items', id, { city, sortBy, userId })
    const result = await this.resourcesService.getItemsByResource(id, city, sortBy, userId)
    return { code: 200, msg: 'success', data: result }
  }

  @Get(':id/cities')
  async getCities(@Param('id') id: string) {
    console.log('[Resources] GET /api/resources/:id/cities', id)
    const result = await this.resourcesService.getCitiesByResource(id)
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
