import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum CategoryType {
  ASSET = 'ASSET',
  EXPENSE = 'EXPENSE',
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

  @Column({ nullable: true })
  parentId: string;

  @ManyToOne(() => Category, (category) => category.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];
}
