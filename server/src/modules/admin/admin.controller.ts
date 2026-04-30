import { Controller, Get, Post, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { CheckPermission } from '../../common/decorators/permission.decorator';
import { AdminService } from './admin.service';
import { SystemRole, UserRole } from '../../common/entities/user.entity';

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

  @Get('users')
  @ApiOperation({ summary: 'Get all users and their memberships (APP_ADMIN only)' })
  @CheckPermission('Admin', 'view')
  async findAllUsers(@Req() req) {
    this.assertAppAdmin(req.user.systemRole);
    return this.adminService.findAllUsers();
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

  @Post('families/:familyId/members/:userId/role')
  @ApiOperation({ summary: 'Update a member role in any family (APP_ADMIN only)' })
  @CheckPermission('Admin', 'update')
  async updateFamilyMemberRole(
    @Req() req,
    @Param('familyId') familyId: string,
    @Param('userId') userId: string,
    @Body('role') role: UserRole,
  ) {
    this.assertAppAdmin(req.user.systemRole);
    return this.adminService.updateFamilyMemberRole(familyId, userId, role);
  }

  @Post('users/:userId/system-role')
  @ApiOperation({ summary: 'Update a user system role (APP_ADMIN only)' })
  @CheckPermission('Admin', 'update')
  async updateSystemRole(
    @Req() req,
    @Param('userId') userId: string,
    @Body('systemRole') systemRole: SystemRole,
  ) {
    this.assertAppAdmin(req.user.systemRole);
    return this.adminService.updateSystemRole(req.user.id, userId, systemRole);
  }

  private assertAppAdmin(systemRole: SystemRole) {
    if (systemRole !== SystemRole.APP_ADMIN) {
      throw new ForbiddenException('APP_ADMIN role is required');
    }
  }
}
