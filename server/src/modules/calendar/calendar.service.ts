import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CalendarEvent } from '../../common/entities/calendar-event.entity';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEvent)
    private calendarEventRepository: Repository<CalendarEvent>,
  ) {}

  async create(familyId: string, createdBy: string, createDto: CreateCalendarEventDto) {
    const { participantIds, ...data } = createDto;
    const event = this.calendarEventRepository.create({
      ...data,
      familyId,
      createdBy,
    });
    
    if (participantIds?.length) {
      event.participants = participantIds.map(id => ({ id } as any));
    }
    
    return this.calendarEventRepository.save(event);
  }

  async findAll(familyId: string, startDate?: Date, endDate?: Date) {
    const queryBuilder = this.calendarEventRepository.createQueryBuilder('event')
      .leftJoinAndSelect('event.participants', 'participants')
      .where('event.familyId = :familyId', { familyId });

    if (startDate && endDate) {
      queryBuilder.andWhere('event.startDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return queryBuilder.orderBy('event.startDate', 'ASC').getMany();
  }

  async findOne(id: string, familyId: string) {
    const event = await this.calendarEventRepository.findOne({
      where: { id, familyId },
      relations: ['participants'],
    });
    if (!event) {
      throw new NotFoundException(`Calendar event with ID ${id} not found`);
    }
    return event;
  }

  async update(id: string, familyId: string, userId: string, updateDto: UpdateCalendarEventDto) {
    const event = await this.findOne(id, familyId);
    const { participantIds, ...data } = updateDto;
    
    Object.assign(event, data);
    event.updatedBy = userId;
    
    if (participantIds !== undefined) {
      event.participants = participantIds.map(pid => ({ id: pid } as any));
    }
    
    return this.calendarEventRepository.save(event);
  }

  async remove(id: string, familyId: string) {
    const event = await this.findOne(id, familyId);
    return this.calendarEventRepository.remove(event);
  }
}
