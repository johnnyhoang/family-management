import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { CheckPermission } from '../../common/decorators/permission.decorator';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('families')
  @ApiOperation({ summary: 'Get all families (System Admin only)' })
  @CheckPermission('Admin', 'view')
  async findAllFamilies() {
    return this.adminService.findAllFamilies();
  }

  @Post('families/:id/status')
  @ApiOperation({ summary: 'Update family status' })
  @CheckPermission('Admin', 'edit')
  async updateFamilyStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateFamilyStatus(id, status);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get system stats' })
  @CheckPermission('Admin', 'view')
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }
}
