import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../../common/entities/asset.entity';

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
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
      query.andWhere('(asset.name LIKE :search OR asset.description LIKE :search)', {
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
    const asset = this.assetRepository.create({
      ...data,
      familyId,
      createdBy: userId,
    });
    return this.assetRepository.save(asset);
  }

  async update(id: string, familyId: string, data: Partial<Asset>) {
    await this.assetRepository.update({ id, familyId }, data);
    return this.findOne(id, familyId);
  }

  async delete(id: string, familyId: string) {
    const asset = await this.findOne(id, familyId);
    if (asset) {
      return this.assetRepository.softRemove(asset);
    }
    return null;
  }

  async exportToCsv(familyId: string, filters: any = {}): Promise<string> {
    const assets = await this.findAll(familyId, filters);
    const { stringify } = await import('csv-stringify/sync');
    
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
}
