import { Controller, Post, Get, Put, Delete, Body, Param, Query, Headers } from '@nestjs/common'
import { AdminService } from './admin.service'

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ===== Admin Auth =====
  @Post('login')
  async adminLogin(@Body() body: { username: string; password: string }) {
    console.log('[Admin] POST /api/admin/login')
    const result = await this.adminService.adminLogin(body)
    return { code: 200, msg: 'success', data: result }
  }

  @Get('check')
  async checkAdmin(@Query('user_id') userId: string) {
    console.log('[Admin] GET /api/admin/check', userId)
    const result = await this.adminService.checkAdmin(userId)
    return { code: 200, msg: 'success', data: result }
  }

  // ===== Circle Management =====
  @Get('circles')
  async listCircles(
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
  ) {
    console.log('[Admin] GET /api/admin/circles', { category, keyword })
    const result = await this.adminService.listCircles({ category, keyword })
    return { code: 200, msg: 'success', data: result }
  }

  @Post('circles')
  async createCircle(@Body() body: { name: string; description?: string; category: string; tags?: string[] }) {
    console.log('[Admin] POST /api/admin/circles', JSON.stringify(body))
    const result = await this.adminService.createCircle(body)
    return { code: 200, msg: 'success', data: result }
  }

  @Put('circles/:id')
  async updateCircle(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; category?: string; tags?: string[]; cover_url?: string },
  ) {
    console.log('[Admin] PUT /api/admin/circles/:id', id)
    const result = await this.adminService.updateCircle(id, body)
    return { code: 200, msg: 'success', data: result }
  }

  @Delete('circles/:id')
  async deleteCircle(@Param('id') id: string) {
    console.log('[Admin] DELETE /api/admin/circles/:id', id)
    const result = await this.adminService.deleteCircle(id)
    return { code: 200, msg: 'success', data: result }
  }

  // ===== Resource Template Management =====
  @Get('resources')
  async listResources(@Query('circle_id') circleId: string) {
    console.log('[Admin] GET /api/admin/resources', circleId)
    const result = await this.adminService.listResources(circleId)
    return { code: 200, msg: 'success', data: result }
  }

  @Post('resources')
  async createResource(@Body() body: {
    circle_id: string
    title: string
    template_type: string // ranking/gallery/list
    description?: string
    cover_url?: string
    template_data?: any
    sort_order?: number
  }) {
    console.log('[Admin] POST /api/admin/resources', JSON.stringify({ ...body, template_data: '(data)' }))
    const result = await this.adminService.createResource(body)
    return { code: 200, msg: 'success', data: result }
  }

  @Put('resources/:id')
  async updateResource(
    @Param('id') id: string,
    @Body() body: { title?: string; template_type?: string; description?: string; cover_url?: string; template_data?: any; sort_order?: number },
  ) {
    console.log('[Admin] PUT /api/admin/resources/:id', id)
    const result = await this.adminService.updateResource(id, body)
    return { code: 200, msg: 'success', data: result }
  }

  @Delete('resources/:id')
  async deleteResource(@Param('id') id: string) {
    console.log('[Admin] DELETE /api/admin/resources/:id', id)
    const result = await this.adminService.deleteResource(id)
    return { code: 200, msg: 'success', data: result }
  }

  // ===== Report Management =====
  @Get('reports')
  async listReports(@Query('status') status?: string) {
    console.log('[Admin] GET /api/admin/reports', status)
    const result = await this.adminService.listReports(status)
    return { code: 200, msg: 'success', data: result }
  }

  @Put('reports/:id')
  async handleReport(@Param('id') id: string, @Body() body: { status: string; review_note?: string }) {
    console.log('[Admin] PUT /api/admin/reports/:id', id)
    const result = await this.adminService.handleReport(id, body)
    return { code: 200, msg: 'success', data: result }
  }

  // ===== Keyword Management =====
  @Get('keywords')
  async listKeywords() {
    console.log('[Admin] GET /api/admin/keywords')
    const result = await this.adminService.listKeywords()
    return { code: 200, msg: 'success', data: result }
  }

  @Post('keywords')
  async addKeyword(@Body() body: { keyword: string; category?: string }) {
    console.log('[Admin] POST /api/admin/keywords', body.keyword)
    const result = await this.adminService.addKeyword(body)
    return { code: 200, msg: 'success', data: result }
  }

  @Delete('keywords/:id')
  async deleteKeyword(@Param('id') id: string) {
    console.log('[Admin] DELETE /api/admin/keywords/:id', id)
    const result = await this.adminService.deleteKeyword(id)
    return { code: 200, msg: 'success', data: result }
  }

  // ===== Circle Application Management =====
  @Get('applications')
  async listApplications(@Query('status') status?: string) {
    console.log('[Admin] GET /api/admin/applications', status)
    const result = await this.adminService.listCircleApplications(status)
    return { code: 200, msg: 'success', data: result }
  }

  @Put('applications/:id/approve')
  async approveApplication(@Param('id') id: string, @Body() body: { admin_id: string }) {
    console.log('[Admin] PUT /api/admin/applications/:id/approve', id)
    const result = await this.adminService.handleCircleApplication(id, { status: 'approved', admin_id: body.admin_id })
    return { code: 200, msg: 'success', data: result }
  }

  @Put('applications/:id/reject')
  async rejectApplication(@Param('id') id: string, @Body() body: { admin_id: string; reject_reason: string }) {
    console.log('[Admin] PUT /api/admin/applications/:id/reject', id, body.reject_reason)
    const result = await this.adminService.handleCircleApplication(id, { status: 'rejected', reject_reason: body.reject_reason, admin_id: body.admin_id })
    return { code: 200, msg: 'success', data: result }
  }

  // ===== Post Management =====
  @Delete('posts/:id')
  async deletePost(@Param('id') id: string) {
    console.log('[Admin] DELETE /api/admin/posts/:id', id)
    const result = await this.adminService.deletePost(id)
    return { code: 200, msg: 'success', data: result }
  }

  // ===== User Management =====
  @Get('users')
  async listUsers(@Query('keyword') keyword?: string) {
    console.log('[Admin] GET /api/admin/users', keyword)
    const result = await this.adminService.listUsers(keyword)
    return { code: 200, msg: 'success', data: result }
  }

  @Put('users/:id/role')
  async updateUserRole(@Param('id') id: string, @Body() body: { role: string }) {
    console.log('[Admin] PUT /api/admin/users/:id/role', id, body.role)
    const result = await this.adminService.updateUserRole(id, body.role)
    return { code: 200, msg: 'success', data: result }
  }

  // ===== Circle Application Management =====
  @Get('circle-applications')
  async listCircleApplications(@Query('status') status?: string) {
    console.log('[Admin] GET /api/admin/circle-applications', status)
    const result = await this.adminService.listCircleApplications(status)
    return { code: 200, msg: 'success', data: result }
  }

  @Put('circle-applications/:id')
  async handleCircleApplication(
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'rejected'; reject_reason?: string; admin_id: string },
  ) {
    console.log('[Admin] PUT /api/admin/circle-applications/:id', id, body.status)
    const result = await this.adminService.handleCircleApplication(id, body)
    return { code: 200, msg: 'success', data: result }
  }

  // ===== Stats =====
  @Get('stats')
  async getStats() {
    console.log('[Admin] GET /api/admin/stats')
    const result = await this.adminService.getStats()
    return { code: 200, msg: 'success', data: result }
  }
}
