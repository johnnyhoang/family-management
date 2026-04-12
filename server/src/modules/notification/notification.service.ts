import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
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

  /**
   * Lên lịch tạo notification sau `delay` ms (bộ nhớ process).
   * Mất job nếu process restart trước khi hết delay — chấp nhận được cho dev/single instance.
   */
  async scheduleNotification(
    data: { familyId: string; userId: string; title: string; message: string; metadata?: any },
    delay: number,
  ): Promise<void> {
    setTimeout(async () => {
      try {
        await this.create(data.familyId, data.userId, data.title, data.message, data.metadata);
      } catch (err) {
        console.error('scheduleNotification failed', err);
      }
    }, delay);
  }
}
