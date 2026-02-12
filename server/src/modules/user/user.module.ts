import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../common/entities/user.entity';
import { Family } from '../../common/entities/family.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Family]),
    PermissionModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
