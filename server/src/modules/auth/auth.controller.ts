import { Controller, Post, Body } from '@nestjs/common'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { code: string; nickname?: string; avatar_url?: string }) {
    console.log('[Auth] POST /api/auth/login', JSON.stringify(body))
    const result = await this.authService.login(body)
    return { code: 200, msg: 'success', data: result }
  }
}
