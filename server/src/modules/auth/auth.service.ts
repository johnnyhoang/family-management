import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../../common/entities/user.entity';
import { Family } from '../../common/entities/family.entity';

import { PermissionService } from '../permission/permission.service';
import { CategoryService } from '../category/category.service';

interface OAuthProfile {
  email: string;
  fullName: string;
  googleId: string;
  avatarUrl?: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private dataSource: DataSource,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Family)
    private familyRepository: Repository<Family>,
    private permissionService: PermissionService,
    private categoryService: CategoryService,
  ) {}

  async validateOAuthUser(profile: OAuthProfile) {
    this.logger.log(`Validating user ${profile.email}`);
    let user = await this.userRepository.findOne({
      where: { email: profile.email },
    });

    if (!user) {
      this.logger.log(`User ${profile.email} not found, creating new user + family`);

      user = await this.dataSource.transaction(async (manager) => {
        // Each new user gets their own family; invitations handled separately
        const family = manager.create(Family, {
          name: profile.fullName ? `${profile.fullName}'s Family` : 'My Family',
        });
        await manager.save(family);

        const newUser = manager.create(User, {
          email: profile.email,
          fullName: profile.fullName,
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl ?? undefined,
          role: UserRole.FAMILY_ADMIN,
          familyId: family.id,
        });
        return manager.save(newUser);
      });

      await this.permissionService.seedDefaultPermissions(user.familyId);
      await this.categoryService.ensureDefaultIncomeCategories(user.familyId);
    } else {
      this.logger.log(`User ${profile.email} found with role: ${user.role}`);

      let dirty = false;
      if (!user.googleId) { user.googleId = profile.googleId; dirty = true; }
      if (profile.avatarUrl && user.avatarUrl !== profile.avatarUrl) { user.avatarUrl = profile.avatarUrl; dirty = true; }
      if (dirty) await this.userRepository.save(user);

      // Idempotent seeds in case they were missed
      await this.permissionService.seedDefaultPermissions(user.familyId);
      await this.categoryService.ensureDefaultIncomeCategories(user.familyId);
    }

    return this.generateToken(user);
  }

  generateToken(user: User) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      familyId: user.familyId,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        familyId: user.familyId,
      },
    };
  }
}
