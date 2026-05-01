import { Controller, Get, Patch, UseGuards, Req, Res, Post, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Login with Google' })
  async googleAuth() {
    return;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const result = await this.authService.validateOAuthUser(req.user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    res.redirect(`${frontendUrl}/login-success?token=${result.access_token}`);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req) {
    return this.authService.getSessionProfile(req.user.id, req.user.familyId ?? null);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own profile (fullName, otherNames)' })
  async updateMe(@Req() req, @Body() data: { fullName?: string; otherNames?: string }) {
    return this.authService.updateMe(req.user.id, data);
  }

  @Get('families')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List families available to current user' })
  async listFamilies(@Req() req) {
    return this.authService.listUserFamilies(req.user.id);
  }

  @Post('switch-family')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Switch active family for the current session' })
  async switchFamily(@Req() req, @Body('familyId') familyId: string) {
    return this.authService.switchActiveFamily(req.user.id, familyId);
  }

  @Post('accept-invite')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a family invite token' })
  async acceptInvite(@Req() req, @Body('token') token: string) {
    return this.authService.acceptInvite(req.user.id, token);
  }
}
