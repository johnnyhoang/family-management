import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { CheckPermission } from '../../common/decorators/permission.decorator';
import { UserService } from './user.service';
import { UserRole } from '../../common/entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'List all family members' })
  @CheckPermission('User', 'view')
  async findAll(@Request() req) {
    return this.userService.findAll(req.user.familyId);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new member to the family' })
  @CheckPermission('User', 'add')
  async invite(@Request() req, @Body() data: { email: string; fullName: string; role: UserRole }) {
    return this.userService.invite(req.user.familyId, req.user.id, data);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update member role (Admin only)' })
  @CheckPermission('User', 'edit')
  async updateRole(@Request() req, @Param('id') id: string, @Body('role') role: UserRole) {
    // Standard RBAC: Only Admin can change roles
    if (req.user.role !== UserRole.FAMILY_ADMIN && req.user.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException('Only administrators can change roles');
    }
    return this.userService.updateRole(req.user.familyId, id, role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove member from family' })
  @CheckPermission('User', 'delete')
  async remove(@Request() req, @Param('id') id: string) {
    return this.userService.remove(req.user.familyId, id);
  }
}

// Helper for type safety in this file
import { ForbiddenException } from '@nestjs/common';
