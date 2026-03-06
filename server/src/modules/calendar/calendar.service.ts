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
    const event = this.calendarEventRepository.create({
      ...createDto,
      familyId,
      createdBy,
    });
    return this.calendarEventRepository.save(event);
  }

  async findAll(familyId: string, startDate?: Date, endDate?: Date) {
    const queryBuilder = this.calendarEventRepository.createQueryBuilder('event')
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
    });
    if (!event) {
      throw new NotFoundException(`Calendar event with ID ${id} not found`);
    }
    return event;
  }

  async update(id: string, familyId: string, updateDto: UpdateCalendarEventDto) {
    const event = await this.findOne(id, familyId);
    Object.assign(event, updateDto);
    return this.calendarEventRepository.save(event);
  }

  async remove(id: string, familyId: string) {
    const event = await this.findOne(id, familyId);
    return this.calendarEventRepository.remove(event);
  }
}
