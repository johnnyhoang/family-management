import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Asset, AssetStatus } from '../../common/entities/asset.entity';
import { Expense, ExpenseEntryType } from '../../common/entities/expense.entity';
import { CalendarEvent } from '../../common/entities/calendar-event.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(CalendarEvent)
    private calendarRepository: Repository<CalendarEvent>,
  ) {}

  async getStats(
    familyId: string,
    filters: { startDate?: string; endDate?: string; categoryId?: string } = {},
  ) {
    const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const startOf6MonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);
    const next30Days = new Date(today);
    next30Days.setDate(next30Days.getDate() + 30);

    // ===== Asset / wealth summary =====
    const activeAssets = await this.assetRepository.find({
      where: { familyId, status: AssetStatus.ACTIVE },
    });
    const totalAssetValue = activeAssets.reduce(
      (sum, a) => sum + Number(a.currentValue || 0),
      0,
    );
    const totalAssetCount = activeAssets.length;

    const liabilitiesResult = await this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.familyId = :familyId', { familyId })
      .andWhere('expense.isTransfer = false')
      .andWhere('expense.entryType = :entryType', {
        entryType: ExpenseEntryType.LIABILITY,
      })
      .select('SUM(expense.amount)', 'total')
      .getRawOne();
    const totalLiabilities = Number(liabilitiesResult?.total || 0);
    const netWorth = totalAssetValue - totalLiabilities;

    // ===== Monthly summaries =====
    const sumExpensesInRange = async (
      start: Date,
      end: Date,
      type: ExpenseEntryType,
    ) => {
      const result = await this.expenseRepository
        .createQueryBuilder('expense')
        .where('expense.familyId = :familyId', { familyId })
        .andWhere('expense.isTransfer = false')
        .andWhere('expense.entryType = :type', { type })
        .andWhere('expense.expenseDate BETWEEN :start AND :end', {
          start: fmtDate(start),
          end: fmtDate(end),
        })
        .select('SUM(expense.amount)', 'total')
        .getRawOne();
      return Number(result?.total || 0);
    };

    const monthlyIncome = await sumExpensesInRange(
      startOfMonth,
      endOfMonth,
      ExpenseEntryType.INCOME,
    );
    const monthlyExpenses = await sumExpensesInRange(
      startOfMonth,
      endOfMonth,
      ExpenseEntryType.EXPENSE,
    );
    const monthlyNet = monthlyIncome - monthlyExpenses;
    const savingsRate =
      monthlyIncome > 0 ? Math.round((monthlyNet / monthlyIncome) * 100) : 0;

    const prevMonthIncome = await sumExpensesInRange(
      startOfPrevMonth,
      endOfPrevMonth,
      ExpenseEntryType.INCOME,
    );
    const prevMonthExpenses = await sumExpensesInRange(
      startOfPrevMonth,
      endOfPrevMonth,
      ExpenseEntryType.EXPENSE,
    );

    // ===== 6-month trend =====
    const trendRows = await this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.familyId = :familyId', { familyId })
      .andWhere('expense.isTransfer = false')
      .andWhere('expense.expenseDate >= :start', {
        start: fmtDate(startOf6MonthsAgo),
      })
      .andWhere('expense.entryType IN (:...types)', {
        types: [ExpenseEntryType.INCOME, ExpenseEntryType.EXPENSE],
      })
      .select(`TO_CHAR(expense."expenseDate", 'YYYY-MM')`, 'month')
      .addSelect('expense.entryType', 'type')
      .addSelect('SUM(expense.amount)', 'amount')
      .groupBy(`TO_CHAR(expense."expenseDate", 'YYYY-MM')`)
      .addGroupBy('expense.entryType')
      .orderBy(`TO_CHAR(expense."expenseDate", 'YYYY-MM')`, 'ASC')
      .getRawMany();

    const monthlyTrendMap = new Map<
      string,
      { income: number; expenses: number }
    >();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrendMap.set(key, { income: 0, expenses: 0 });
    }
    for (const row of trendRows) {
      const entry = monthlyTrendMap.get(row.month);
      if (!entry) continue;
      const amount = Number(row.amount);
      if (row.type === ExpenseEntryType.INCOME) entry.income = amount;
      else if (row.type === ExpenseEntryType.EXPENSE) entry.expenses = amount;
    }
    const monthlyTrend = Array.from(monthlyTrendMap.entries()).map(
      ([month, { income, expenses }]) => ({
        month,
        income,
        expenses,
        net: income - expenses,
      }),
    );

    // ===== Expenses by category (filterable range) =====
    const expensesByCategoryQuery = this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoin('expense.category', 'category')
      .where('expense.familyId = :familyId', { familyId })
      .andWhere('expense.isTransfer = false')
      .andWhere('expense.entryType = :entryType', {
        entryType: ExpenseEntryType.EXPENSE,
      })
      .andWhere('expense.expenseDate >= :startDate', {
        startDate: filters.startDate || fmtDate(startOfMonth),
      });

    if (filters.endDate) {
      expensesByCategoryQuery.andWhere('expense.expenseDate <= :endDate', {
        endDate: filters.endDate,
      });
    }
    if (filters.categoryId) {
      expensesByCategoryQuery.andWhere('expense.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    const rawExpensesByCategory = await expensesByCategoryQuery
      .select('category.name', 'category')
      .addSelect('SUM(expense.amount)', 'amount')
      .groupBy('category.name')
      .getRawMany();

    const expensesByCategory = rawExpensesByCategory
      .filter((row) => !!row.category)
      .map((row) => ({
        category: row.category,
        amount: Number(row.amount) || 0,
      }))
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    // ===== Assets by category =====
    const assetsByCatRaw = await this.assetRepository
      .createQueryBuilder('asset')
      .leftJoin('asset.category', 'category')
      .where('asset.familyId = :familyId', { familyId })
      .andWhere('asset.status = :status', { status: AssetStatus.ACTIVE })
      .select('category.name', 'category')
      .addSelect('SUM(asset.currentValue)', 'value')
      .addSelect('COUNT(asset.id)', 'count')
      .groupBy('category.name')
      .getRawMany();

    const assetsByCategory = assetsByCatRaw
      .filter((row) => !!row.category)
      .map((row) => ({
        category: row.category,
        value: Number(row.value || 0),
        count: Number(row.count || 0),
      }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value);

    // ===== Category breakdown by entryType (for filterable date range) =====
    const breakdownStartDate = filters.startDate || fmtDate(startOfMonth);
    const breakdownEndDate = filters.endDate || fmtDate(endOfMonth);

    const categoryBreakdownRaw = await this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoin('expense.category', 'category')
      .leftJoin('category.parent', 'parent')
      .where('expense.familyId = :familyId', { familyId })
      .andWhere('expense.isTransfer = false')
      .andWhere('expense.expenseDate BETWEEN :start AND :end', {
        start: breakdownStartDate,
        end: breakdownEndDate,
      })
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'categoryName')
      .addSelect('parent.name', 'parentName')
      .addSelect('expense.entryType', 'entryType')
      .addSelect('SUM(expense.amount)', 'amount')
      .addSelect('COUNT(expense.id)', 'count')
      .groupBy('category.id')
      .addGroupBy('category.name')
      .addGroupBy('parent.name')
      .addGroupBy('expense.entryType')
      .getRawMany();

    const categoryBreakdown = categoryBreakdownRaw
      .filter((row) => !!row.categoryId)
      .map((row) => ({
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        parentName: row.parentName,
        entryType: row.entryType,
        amount: Number(row.amount || 0),
        count: Number(row.count || 0),
      }))
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    // ===== Top 5 expenses this month =====
    const topExpenses = await this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category')
      .where('expense.familyId = :familyId', { familyId })
      .andWhere('expense.isTransfer = false')
      .andWhere('expense.entryType = :entryType', {
        entryType: ExpenseEntryType.EXPENSE,
      })
      .andWhere('expense.expenseDate BETWEEN :start AND :end', {
        start: fmtDate(startOfMonth),
        end: fmtDate(endOfMonth),
      })
      .orderBy('expense.amount', 'DESC')
      .limit(5)
      .getMany();

    // ===== Upcoming warranty expirations (next 30 days) =====
    const expiringAssets = await this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.familyId = :familyId', { familyId })
      .andWhere('asset.status = :status', { status: AssetStatus.ACTIVE })
      .andWhere('asset.warrantyExpiredAt BETWEEN :now AND :next30Days', {
        now: today,
        next30Days,
      })
      .orderBy('asset.warrantyExpiredAt', 'ASC')
      .limit(10)
      .getMany();

    // ===== Upcoming maintenance (next 30 days) =====
    const upcomingMaintenance = await this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.familyId = :familyId', { familyId })
      .andWhere('asset.status = :status', { status: AssetStatus.ACTIVE })
      .andWhere('asset.nextMaintenanceDate BETWEEN :now AND :next30Days', {
        now: today,
        next30Days,
      })
      .orderBy('asset.nextMaintenanceDate', 'ASC')
      .limit(10)
      .getMany();

    // ===== Upcoming calendar events (next 7 days) =====
    const upcomingEvents = await this.calendarRepository.find({
      where: {
        familyId,
        startDate: Between(today, next7Days),
      },
      order: { startDate: 'ASC' },
      take: 10,
    });

    return {
      // Asset / wealth
      totalAssetValue,
      totalAssetCount,
      totalLiabilities,
      netWorth,

      // Current month
      monthlyIncome,
      monthlyExpenses,
      monthlyNet,
      savingsRate,

      // Previous month (for delta)
      prevMonthIncome,
      prevMonthExpenses,

      // Trends
      monthlyTrend,

      // Distributions
      expensesByCategory,
      assetsByCategory,
      categoryBreakdown,

      // Top transactions
      topExpenses,

      // Action items
      expiringAssets,
      upcomingMaintenance,
      upcomingEvents,

      // Backwards-compat with old dashboard payload
      totalAssets: totalAssetCount,
    };
  }
}
