import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../common/entities/user.entity';
import { Family } from '../../common/entities/family.entity';
import { FamilyUser } from '../../common/entities/family-user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Family, FamilyUser]),
    PermissionModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
