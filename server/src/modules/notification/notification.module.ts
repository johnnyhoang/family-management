import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationService } from './notification.service';
import { MaintenanceScheduler } from './maintenance.scheduler';
import { Asset } from '../../common/entities/asset.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, Asset])],
  controllers: [],
  providers: [NotificationService, MaintenanceScheduler],
  exports: [NotificationService],
})
export class NotificationModule {}
