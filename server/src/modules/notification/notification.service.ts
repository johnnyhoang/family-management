import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  async create(familyId: string, userId: string, title: string, message: string, metadata?: any) {
    const notification = this.notificationRepository.create({
      familyId,
      userId,
      title,
      message,
      metadata,
    });
    return this.notificationRepository.save(notification);
  }

  async findAll(userId: string) {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string, userId: string) {
    await this.notificationRepository.update({ id, userId }, { isRead: true });
    return this.notificationRepository.findOne({ where: { id, userId } });
  }

  async scheduleNotification(data: any, delay: number) {
    await this.notificationQueue.add('send-notification', data, { delay });
  }
}
