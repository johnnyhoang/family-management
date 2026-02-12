import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../common/entities/user.entity';
import { Family } from '../../common/entities/family.entity';

import { PermissionService } from '../permission/permission.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Family)
    private familyRepository: Repository<Family>,
    private permissionService: PermissionService,
  ) {}

  async validateOAuthUser(profile: any) {
    let user = await this.userRepository.findOne({
      where: { email: profile.email },
    });

    if (!user) {
      const familyCount = await this.familyRepository.count();
      let family = await this.familyRepository.findOne({ where: { name: 'Default Family' } });
      let isNewFamily = false;

      if (!family) {
        family = this.familyRepository.create({ name: 'Default Family' });
        await this.familyRepository.save(family);
        isNewFamily = true;
      }

      // If it's the first user or a new family, make them FAMILY_ADMIN
      const userCountInFamily = await this.userRepository.count({ where: { familyId: family.id } });
      const role = userCountInFamily === 0 ? UserRole.FAMILY_ADMIN : UserRole.MEMBER;

      user = this.userRepository.create({
        email: profile.email,
        fullName: profile.fullName,
        googleId: profile.googleId,
        role: role,
        familyId: family.id,
      });
      await this.userRepository.save(user);

      // Seed permissions for the family
      await this.permissionService.seedDefaultPermissions(family.id);
    } else {
      // Promotion logic: if they are the only user in the family and still a MEMBER, make them ADMIN
      if (user.role === UserRole.MEMBER) {
        const userCount = await this.userRepository.count({ where: { familyId: user.familyId } });
        if (userCount === 1) {
          user.role = UserRole.FAMILY_ADMIN;
          await this.userRepository.save(user);
        }
      }

      if (!user.googleId) {
        user.googleId = profile.googleId;
        await this.userRepository.save(user);
      }
      
      // Ensure permissions are seeded even for existing families (idempotent)
      await this.permissionService.seedDefaultPermissions(user.familyId);
    }

    return this.generateToken(user);
  }

  generateToken(user: User) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role, 
      familyId: user.familyId 
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        familyId: user.familyId,
      },
    };
  }
}
