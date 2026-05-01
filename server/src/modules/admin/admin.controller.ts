import { Controller, Get, Post, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { CheckPermission } from '../../common/decorators/permission.decorator';
import { AdminService } from './admin.service';
import { SystemRole } from '../../common/entities/user.entity';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('families')
  @ApiOperation({ summary: 'Get all families and membership structures (APP_ADMIN only)' })
  @CheckPermission('Admin', 'view')
  async findAllFamilies(@Req() req) {
    this.assertAppAdmin(req.user.systemRole);
    return this.adminService.findAllFamilies();
  }

  @Post('families/:id/status')
  @ApiOperation({ summary: 'Update family status' })
  @CheckPermission('Admin', 'update')
  async updateFamilyStatus(@Req() req, @Param('id') id: string, @Body('status') status: string) {
    this.assertAppAdmin(req.user.systemRole);
    return this.adminService.updateFamilyStatus(id, status as any);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get system stats' })
  @CheckPermission('Admin', 'view')
  async getSystemStats(@Req() req) {
    this.assertAppAdmin(req.user.systemRole);
    return this.adminService.getSystemStats();
  }

  private assertAppAdmin(systemRole: SystemRole) {
    if (systemRole !== SystemRole.APP_ADMIN) {
      throw new ForbiddenException('APP_ADMIN role is required');
    }
  }
}
