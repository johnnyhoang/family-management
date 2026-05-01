import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../../common/entities/asset.entity';
import { Category, CategoryType } from '../../common/entities/category.entity';
import { stringify } from 'csv-stringify/sync';

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll(familyId: string, filters: any = {}) {
    const query = this.assetRepository.createQueryBuilder('asset')
      .leftJoinAndSelect('asset.category', 'category')
      .where('asset.familyId = :familyId', { familyId });

    if (filters.categoryId) {
      query.andWhere('asset.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.status) {
      query.andWhere('asset.status = :status', { status: filters.status });
    }

    if (filters.search) {
      query.andWhere('(asset.name ILIKE :search OR asset.description ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    return query.getMany();
  }

  async findOne(id: string, familyId: string) {
    return this.assetRepository.findOne({
      where: { id, familyId },
      relations: ['category', 'assignedToUser'],
    });
  }

  async create(familyId: string, userId: string, data: Partial<Asset>) {
    await this.validateAssetCategory(familyId, data.categoryId);
    const asset = this.assetRepository.create({
      ...data,
      familyId,
      createdBy: userId,
    });
    return this.assetRepository.save(asset);
  }

  async update(id: string, familyId: string, userId: string, data: Partial<Asset>) {
    const existing = await this.findOne(id, familyId);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy tài sản');
    }
    await this.validateAssetCategory(familyId, data.categoryId);
    await this.assetRepository.update({ id, familyId }, { ...(data as any), updatedBy: userId });
    return this.findOne(id, familyId);
  }

  async delete(id: string, familyId: string) {
    const asset = await this.findOne(id, familyId);
    if (!asset) {
      throw new NotFoundException('Không tìm thấy tài sản');
    }
    return this.assetRepository.softRemove(asset);
  }

  async exportToCsv(familyId: string, filters: any = {}): Promise<string> {
    const assets = await this.findAll(familyId, filters);

    return stringify(assets, {
      header: true,
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Tên tài sản' },
        { key: 'description', header: 'Mô tả' },
        { key: 'purchasePrice', header: 'Giá mua' },
        { key: 'currentValue', header: 'Giá hiện tại' },
        { key: 'status', header: 'Trạng thái' },
        { key: 'purchaseDate', header: 'Ngày mua' },
        { key: 'warrantyExpiredAt', header: 'Hết hạn bảo hành' },
      ],
    });
  }

  private async validateAssetCategory(familyId: string, categoryId?: string) {
    if (!categoryId) {
      return;
    }

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, familyId },
    });

    if (!category) {
      throw new NotFoundException('Danh mục tài sản không tồn tại');
    }

    if (category.type !== CategoryType.ASSET) {
      throw new BadRequestException('Tài sản phải dùng danh mục thuộc nhóm tài sản');
    }
  }
}
