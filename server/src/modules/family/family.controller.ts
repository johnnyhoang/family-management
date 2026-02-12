import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { CheckPermission } from '../../common/decorators/permission.decorator';
import { FamilyService } from './family.service';
import { UserRole } from '../../common/entities/user.entity';
import { FamilyStatus } from '../../common/entities/family.entity';
import { ForbiddenException } from '@nestjs/common';

@ApiTags('Family')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionGuard)
@Controller('family')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Get()
  @ApiOperation({ summary: 'Get family profile' })
  @CheckPermission('Family', 'view')
  async findOne(@Request() req) {
    return this.familyService.findOne(req.user.familyId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update family profile (Admin only)' })
  @CheckPermission('Family', 'edit')
  async update(@Request() req, @Body() data: { name?: string; status?: FamilyStatus }) {
    // Only Admin can update family settings
    if (req.user.role !== UserRole.FAMILY_ADMIN && req.user.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException('Only administrators can update family settings');
    }
    return this.familyService.update(req.user.familyId, data);
  }
}
