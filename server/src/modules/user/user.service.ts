import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../common/entities/user.entity';
import { Family } from '../../common/entities/family.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Family)
    private familyRepository: Repository<Family>,
  ) {}

  async findAll(familyId: string) {
    return this.userRepository.find({
      where: { familyId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string, familyId: string) {
    const user = await this.userRepository.findOne({
      where: { id, familyId },
    });
    if (!user) {
      throw new NotFoundException('User not found in this family');
    }
    return user;
  }

  async invite(familyId: string, inviterId: string, data: { email: string; fullName: string; role: UserRole }) {
    // Check if user already exists in this family
    const existingUser = await this.userRepository.findOne({
      where: { email: data.email, familyId },
    });

    if (existingUser) {
      throw new ForbiddenException('User is already a member of this family');
    }

    // Check if user exists in another family (Limit for MVP: One user, one family)
    const globalUser = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (globalUser) {
      throw new ForbiddenException('User is already registered in another family');
    }

    const newUser = this.userRepository.create({
      ...data,
      familyId,
      // Internal logic: In a real app, this would trigger an email invitation
    });

    return this.userRepository.save(newUser);
  }

  async updateRole(familyId: string, id: string, newRole: UserRole) {
    const user = await this.findOne(id, familyId);
    user.role = newRole;
    return this.userRepository.save(user);
  }

  async remove(familyId: string, id: string) {
    const user = await this.findOne(id, familyId);
    // Prevent self-removal or removing the last admin could be added here
    return this.userRepository.softRemove(user);
  }
}
