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
    console.log(`AuthService: Validating user ${profile.email}`);
    let user = await this.userRepository.findOne({
      where: { email: profile.email },
    });

    if (!user) {
      console.log(`AuthService: User ${profile.email} not found, creating new...`);
      const familyCount = await this.familyRepository.count();
      let family = await this.familyRepository.findOne({ where: { name: 'Default Family' } });
      let isNewFamily = false;

      if (!family) {
        console.log('AuthService: Creating Default Family');
        family = this.familyRepository.create({ name: 'Default Family' });
        await this.familyRepository.save(family);
        isNewFamily = true;
      }

      // If it's the first user or a new family, make them FAMILY_ADMIN
      const userCountInFamily = await this.userRepository.count({ where: { familyId: family.id } });
      const role = userCountInFamily === 0 ? UserRole.FAMILY_ADMIN : UserRole.MEMBER;
      console.log(`AuthService: Users in family: ${userCountInFamily}, assigned role: ${role}`);

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
      console.log(`AuthService: User ${profile.email} found with role: ${user.role}`);
      // Promotion logic: if they are the only user in the family and still a MEMBER, make them ADMIN
      if (user.role === UserRole.MEMBER) {
        const usersInFamily = await this.userRepository.find({ where: { familyId: user.familyId } });
        const userCount = usersInFamily.length;
        console.log(`AuthService: Family ${user.familyId} has ${userCount} users: ${usersInFamily.map(u => u.email).join(', ')}`);
        
        if (userCount === 1) {
          console.log(`AuthService: Promoting ${user.email} to FAMILY_ADMIN`);
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
