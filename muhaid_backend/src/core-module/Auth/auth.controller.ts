import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import type { AuthUser } from './auth.types.js';
import { CurrentUser, Public } from './decorators.js';

// Shared by both clients: the inspector app and the admin dashboard.
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() body: LoginDto) {
    return this.auth.login(body);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
