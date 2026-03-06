import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../../common/entities/expense.entity';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  async findAll(familyId: string, filters: any = {}) {
    const query = this.expenseRepository.createQueryBuilder('expense')
      .leftJoinAndSelect('expense.asset', 'asset')
      .leftJoinAndSelect('expense.category', 'category')
      .where('expense.familyId = :familyId', { familyId });

    if (filters.assetId) {
      query.andWhere('expense.assetId = :assetId', { assetId: filters.assetId });
    }

    if (filters.categoryId) {
      query.andWhere('expense.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.direction) {
      query.andWhere('category.type = :direction', { direction: filters.direction });
    }

    if (filters.startDate && filters.endDate) {
      query.andWhere('expense.expenseDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    return query.orderBy('expense.expenseDate', 'DESC').getMany();
  }

  async create(familyId: string, userId: string, data: Partial<Expense>) {
    const expense = this.expenseRepository.create({
      ...data,
      familyId,
      createdBy: userId,
    });

    if (expense.isRecurring && expense.recurringCycle && expense.expenseDate) {
      const nextDate = new Date(expense.expenseDate);
      switch (expense.recurringCycle) {
        case 'DAILY' as any: nextDate.setDate(nextDate.getDate() + 1); break;
        case 'WEEKLY' as any: nextDate.setDate(nextDate.getDate() + 7); break;
        case 'MONTHLY' as any: nextDate.setMonth(nextDate.getMonth() + 1); break;
        case 'YEARLY' as any: nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      }
      expense.nextOccurrenceDate = nextDate;
    }

    return this.expenseRepository.save(expense);
  }

  async findOne(id: string, familyId: string) {
    return this.expenseRepository.findOne({
      where: { id, familyId },
      relations: ['asset', 'category'],
    });
  }

  async delete(id: string, familyId: string) {
    const expense = await this.findOne(id, familyId);
    if (expense) {
      return this.expenseRepository.softRemove(expense);
    }
    return null;
  }

  async exportToCsv(familyId: string, filters: any = {}): Promise<string> {
    const expenses = await this.findAll(familyId, filters);
    const { stringify } = await import('csv-stringify/sync');

    return stringify(expenses, {
      header: true,
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'amount', header: 'Số tiền' },
        { key: ['category', 'name'], header: 'Danh mục' },
        { key: 'description', header: 'Mô tả' },
        { key: 'expenseDate', header: 'Ngày chi' },
        { key: 'assetId', header: 'ID Tài sản' },
      ],
    });
  }
}
