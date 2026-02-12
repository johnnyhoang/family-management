import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationService } from './notification.service';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'send-notification':
        const { familyId, userId, title, message, metadata } = job.data;
        await this.notificationService.create(familyId, userId, title, message, metadata);
        // Integrate with Push Notification service here (e.g., Firebase)
        break;
      default:
        break;
    }
  }
}
