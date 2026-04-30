import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum CategoryType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum CategoryLevel {
  GROUP = 'GROUP',
  CATEGORY = 'CATEGORY',
}

@Entity('categories')
export class Category extends BaseEntity {
  @Column()
  familyId: string;

  @Column()
  name: string;

  @Column({ default: false })
  isDefault: boolean;

  @Column({
    type: 'enum',
    enum: CategoryType,
  })
  type: CategoryType;

  @Column({
    type: 'enum',
    enum: CategoryLevel,
    default: CategoryLevel.CATEGORY,
  })
  level: CategoryLevel;

  @Column({ nullable: true })
  parentId: string | null;

  @ManyToOne(() => Category, (category) => category.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Category | null;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];
}
