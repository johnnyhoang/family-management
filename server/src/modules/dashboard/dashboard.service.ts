import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../../common/entities/asset.entity';
import { Expense } from '../../common/entities/expense.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  async getStats(familyId: string) {
    const totalAssets = await this.assetRepository.count({ where: { familyId } });
    
    // Total monthly expenses
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const monthlyExpenses = await this.expenseRepository.createQueryBuilder('expense')
      .where('expense.familyId = :familyId', { familyId })
      .andWhere('expense.expenseDate >= :startOfMonth', { startOfMonth })
      .select('SUM(expense.amount)', 'total')
      .getRawOne();

    // Expenses by category
    const expensesByCategory = await this.expenseRepository.createQueryBuilder('expense')
      .leftJoin('expense.asset', 'asset')
      .leftJoin('asset.category', 'category')
      .where('expense.familyId = :familyId', { familyId })
      .select('category.name', 'category')
      .addSelect('SUM(expense.amount)', 'amount')
      .groupBy('category.name')
      .getRawMany();

    // Upcoming warranty expirations (next 30 days)
    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);
    const expiringAssets = await this.assetRepository.createQueryBuilder('asset')
      .where('asset.familyId = :familyId', { familyId })
      .andWhere('asset.warrantyExpiredAt BETWEEN :now AND :next30Days', {
        now: new Date(),
        next30Days,
      })
      .getMany();

    return {
      totalAssets,
      monthlyExpenses: parseFloat(monthlyExpenses.total || 0),
      expensesByCategory,
      expiringAssets,
    };
  }
}
