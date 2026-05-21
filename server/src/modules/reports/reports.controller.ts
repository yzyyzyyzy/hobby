import { Controller, Post, Body, Get } from '@nestjs/common'
import { ReportsService } from './reports.service'

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async createReport(@Body() body: { reporter_id: string; target_type: string; target_id: string; reason: string; description?: string }) {
    console.log('[Reports] POST /api/reports', JSON.stringify({ ...body, description: body.description?.slice(0, 50) }))
    const result = await this.reportsService.createReport(body)
    return { code: 200, msg: 'success', data: result }
  }
}

@Controller('admin')
export class AdminController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('reports')
  async listReports() {
    console.log('[Admin] GET /api/admin/reports')
    const result = await this.reportsService.listReports()
    return { code: 200, msg: 'success', data: result }
  }

  @Post('reports/:id/handle')
  async handleReport(@Body() body: { id: string; status: string; action?: string }) {
    console.log('[Admin] POST /api/admin/reports/:id/handle')
    const result = await this.reportsService.handleReport(body)
    return { code: 200, msg: 'success', data: result }
  }

  @Post('keywords')
  async addBlockedKeyword(@Body() body: { keyword: string }) {
    console.log('[Admin] POST /api/admin/keywords')
    const result = await this.reportsService.addBlockedKeyword(body.keyword)
    return { code: 200, msg: 'success', data: result }
  }

  @Get('keywords')
  async listBlockedKeywords() {
    console.log('[Admin] GET /api/admin/keywords')
    const result = await this.reportsService.listBlockedKeywords()
    return { code: 200, msg: 'success', data: result }
  }

  @Post('content-check')
  async checkContentSafety(@Body() body: { content: string }) {
    console.log('[Admin] POST /api/admin/content-check')
    const result = await this.reportsService.checkContentSafety(body.content)
    return { code: 200, msg: 'success', data: { safe: result } }
  }
}
