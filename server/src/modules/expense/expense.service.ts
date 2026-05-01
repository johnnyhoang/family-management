import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, ExpenseEntryType, RecurringCycle } from '../../common/entities/expense.entity';
import { Category, CategoryLevel, CategoryType } from '../../common/entities/category.entity';
import { stringify } from 'csv-stringify/sync';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
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
      query.andWhere('expense.entryType = :entryType', { entryType: filters.direction });
    }

    if (filters.isTransfer !== undefined) {
      query.andWhere('expense.isTransfer = :isTransfer', {
        isTransfer: filters.isTransfer === true || filters.isTransfer === 'true',
      });
    }

    if (filters.createdBy) {
      query.andWhere('expense.createdBy = :createdBy', { createdBy: filters.createdBy });
    }

    if (filters.amount) {
      query.andWhere('expense.amount = :amount', { amount: Number(filters.amount) });
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
    const entryType = await this.resolveEntryType(familyId, data);
    const expense = this.expenseRepository.create({
      ...data,
      familyId,
      createdBy: userId,
      entryType,
      isTransfer: data.isTransfer ?? false,
    });

    if (expense.isRecurring && expense.recurringCycle && expense.expenseDate) {
      expense.nextOccurrenceDate = this.computeNextOccurrence(expense.recurringCycle, expense.expenseDate);
    } else {
      expense.nextOccurrenceDate = null;
    }

    return this.expenseRepository.save(expense);
  }

  async findOne(id: string, familyId: string) {
    return this.expenseRepository.findOne({
      where: { id, familyId },
      relations: ['asset', 'category'],
    });
  }

  async update(id: string, familyId: string, userId: string, data: Partial<Expense>) {
    const expense = await this.findOne(id, familyId);
    if (!expense) {
      throw new NotFoundException('Không tìm thấy giao dịch');
    }

    const entryType = await this.resolveEntryType(familyId, data, expense);
    Object.assign(expense, data);
    expense.updatedBy = userId;
    expense.entryType = entryType;
    expense.isTransfer = data.isTransfer ?? expense.isTransfer ?? false;

    if (expense.isRecurring && expense.recurringCycle && expense.expenseDate) {
      expense.nextOccurrenceDate = this.computeNextOccurrence(expense.recurringCycle, expense.expenseDate);
    } else {
      expense.nextOccurrenceDate = null;
    }

    return this.expenseRepository.save(expense);
  }

  async delete(id: string, familyId: string) {
    const expense = await this.findOne(id, familyId);
    if (!expense) {
      throw new NotFoundException('Không tìm thấy giao dịch');
    }
    return this.expenseRepository.softRemove(expense);
  }

  async exportToCsv(familyId: string, filters: any = {}): Promise<string> {
    const expenses = await this.findAll(familyId, filters);
    const flattenedData = expenses.map(e => ({
      id: e.id,
      amount: e.amount,
      category: e.category?.name || '',
      entryType: e.entryType,
      isTransfer: e.isTransfer ? 'Có' : 'Không',
      description: e.note || '',
      expenseDate: e.expenseDate,
      asset: e.asset?.name || '',
    }));

    return stringify(flattenedData, {
      header: true,
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'amount', header: 'Số tiền' },
        { key: 'category', header: 'Danh mục' },
        { key: 'entryType', header: 'Loại giao dịch' },
        { key: 'isTransfer', header: 'Chuyển nội bộ' },
        { key: 'description', header: 'Mô tả' },
        { key: 'expenseDate', header: 'Ngày' },
        { key: 'asset', header: 'Tài sản' },
      ],
    });
  }

  private computeNextOccurrence(cycle: RecurringCycle, from: Date): Date {
    const next = new Date(from);
    switch (cycle) {
      case RecurringCycle.DAILY:   next.setDate(next.getDate() + 1); break;
      case RecurringCycle.WEEKLY:  next.setDate(next.getDate() + 7); break;
      case RecurringCycle.MONTHLY: next.setMonth(next.getMonth() + 1); break;
      case RecurringCycle.YEARLY:  next.setFullYear(next.getFullYear() + 1); break;
    }
    return next;
  }

  private async resolveEntryType(
    familyId: string,
    data: Partial<Expense>,
    currentExpense?: Expense,
  ): Promise<ExpenseEntryType> {
    const categoryId = data.categoryId ?? currentExpense?.categoryId;
    const entryType = (data.entryType ?? currentExpense?.entryType) as ExpenseEntryType | undefined;
    const isTransfer = data.isTransfer ?? currentExpense?.isTransfer ?? false;

    if (!entryType) {
      throw new BadRequestException('Loại giao dịch là bắt buộc');
    }

    if (!categoryId) {
      return entryType;
    }

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, familyId },
    });

    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    if (category.level !== CategoryLevel.CATEGORY) {
      throw new BadRequestException('Chỉ được chọn danh mục ở cấp cuối');
    }

    if (isTransfer) {
      if (![CategoryType.ASSET, CategoryType.LIABILITY].includes(category.type)) {
        throw new BadRequestException('Giao dịch chuyển nội bộ chỉ được gắn với danh mục tài sản hoặc công nợ');
      }
      return entryType;
    }

    if (category.type !== this.mapEntryTypeToCategoryType(entryType)) {
      throw new BadRequestException('Danh mục không khớp với loại giao dịch đã chọn');
    }

    return entryType;
  }

  private mapEntryTypeToCategoryType(entryType: ExpenseEntryType): CategoryType {
    switch (entryType) {
      case ExpenseEntryType.INCOME:
        return CategoryType.INCOME;
      case ExpenseEntryType.LIABILITY:
        return CategoryType.LIABILITY;
      case ExpenseEntryType.EXPENSE:
      default:
        return CategoryType.EXPENSE;
    }
  }
}
