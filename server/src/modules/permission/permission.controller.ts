import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { CheckPermission } from '../../common/decorators/permission.decorator';
import { PermissionService } from './permission.service';
import { UserRole } from '../../common/entities/user.entity';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionGuard)
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all permissions for the family' })
  @CheckPermission('Admin', 'view')
  async findAll(@Request() req) {
    return this.permissionService.findAll(req.user.familyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new permission rule (Admin only)' })
  @CheckPermission('Admin', 'add')
  async create(@Request() req, @Body() data: any) {
    if (req.user.role !== UserRole.FAMILY_ADMIN && req.user.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException('Only administrators can manage permissions');
    }
    return this.permissionService.create(req.user.familyId, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a permission rule' })
  @CheckPermission('Admin', 'edit')
  async update(@Request() req, @Param('id') id: string, @Body() data: any) {
    if (req.user.role !== UserRole.FAMILY_ADMIN && req.user.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException('Only administrators can manage permissions');
    }
    return this.permissionService.update(id, req.user.familyId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a permission rule' })
  @CheckPermission('Admin', 'delete')
  async remove(@Request() req, @Param('id') id: string) {
    if (req.user.role !== UserRole.FAMILY_ADMIN && req.user.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException('Only administrators can manage permissions');
    }
    return this.permissionService.remove(id, req.user.familyId);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed default permissions for the family' })
  @CheckPermission('Admin', 'add')
  async seed(@Request() req) {
    return this.permissionService.seedDefaultPermissions(req.user.familyId);
  }
}
