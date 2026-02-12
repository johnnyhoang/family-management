import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CategoryService } from './category.service';
import { Category, CategoryType } from '../../common/entities/category.entity';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { CheckPermission } from '../../common/decorators/permission.decorator';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @CheckPermission('Category', 'view')
  @ApiOperation({ summary: 'Get family categories' })
  findAll(@Req() req, @Query('type') type?: CategoryType) {
    return this.categoryService.findAll(req.user.familyId, type);
  }

  @Post()
  @CheckPermission('Category', 'add')
  @ApiOperation({ summary: 'Create new category' })
  create(@Req() req, @Body() data: Partial<Category>) {
    return this.categoryService.create(req.user.familyId, data);
  }

  @Delete(':id')
  @CheckPermission('Category', 'delete')
  @ApiOperation({ summary: 'Delete category' })
  remove(@Req() req, @Param('id') id: string) {
    return this.categoryService.delete(id, req.user.familyId);
  }
}
