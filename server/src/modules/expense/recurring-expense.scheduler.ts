import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Expense, RecurringCycle } from '../../common/entities/expense.entity';

@Injectable()
export class RecurringExpenseScheduler {
  private readonly logger = new Logger(RecurringExpenseScheduler.name);

  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleRecurringExpenses() {
    this.logger.log('Checking for recurring expenses to generate...');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const pendingExpenses = await this.expenseRepository.find({
      where: {
        isRecurring: true,
        nextOccurrenceDate: LessThanOrEqual(today),
      },
    });

    for (const source of pendingExpenses) {
      await this.generateNextExpense(source);
    }
  }

  private async generateNextExpense(source: Expense) {
    try {
      // Create new expense
      const nextDate = new Date(source.nextOccurrenceDate);
      
      const newExpense = this.expenseRepository.create({
        ...source,
        id: undefined, // Let DB generate new ID
        expenseDate: nextDate,
        isRecurring: true, // New one is also recurring
        // nextOccurrenceDate will be set below
      });

      // Calculate the next date after this one
      const followingDate = this.calculateNextDate(nextDate, source.recurringCycle);
      newExpense.nextOccurrenceDate = followingDate;

      await this.expenseRepository.save(newExpense);

      // Disable recurring on the source to avoid double generation, 
      // or update it? Actually, in this "chain" model, the source's job is done.
      source.isRecurring = false;
      await this.expenseRepository.save(source);

      this.logger.log(`Generated recurring expense "${source.note || 'Unnamed'}" for date ${nextDate.toISOString().split('T')[0]}`);
    } catch (error) {
      this.logger.error(`Error generating recurring expense for source ${source.id}:`, error);
    }
  }

  private calculateNextDate(current: Date, cycle: RecurringCycle): Date {
    const next = new Date(current);
    switch (cycle) {
      case RecurringCycle.DAILY:
        next.setDate(next.getDate() + 1);
        break;
      case RecurringCycle.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case RecurringCycle.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      case RecurringCycle.YEARLY:
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }
}
