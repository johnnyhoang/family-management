import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Notification } from './notification.entity';
import { NotificationService } from './notification.service';
import { NotificationProcessor } from './notification.processor';
import { getQueueToken } from '@nestjs/bullmq';

const redisEnabled = process.env.REDIS_ENABLED !== 'false';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    ...(redisEnabled ? [
      BullModule.registerQueue({
        name: 'notifications',
      }),
    ] : []),
  ],
  controllers: [],
  providers: [
    NotificationService,
    ...(redisEnabled ? [NotificationProcessor] : [
      {
        provide: getQueueToken('notifications'),
        useValue: {
          add: () => Promise.resolve(),
        },
      }
    ]),
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
