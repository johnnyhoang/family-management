import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../common/entities/user.entity';
import { Family } from '../../common/entities/family.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Family)
    private familyRepository: Repository<Family>,
  ) {}

  async validateOAuthUser(profile: any) {
    let user = await this.userRepository.findOne({
      where: { email: profile.email },
    });

    if (!user) {
      // Logic for new user: In real app, might need invite or create new family
      // For now, let's create a placeholder family if it doesn't exist for the first user
      // or throw error if invitations are required.
      // We'll create a default family for the first user of the system.
      
      let family = await this.familyRepository.findOne({ where: { name: 'Default Family' } });
      if (!family) {
        family = this.familyRepository.create({ name: 'Default Family' });
        await this.familyRepository.save(family);
      }

      user = this.userRepository.create({
        email: profile.email,
        fullName: profile.fullName,
        googleId: profile.googleId,
        role: UserRole.MEMBER, // Default role
        familyId: family.id,
      });
      await this.userRepository.save(user);
    } else if (!user.googleId) {
      user.googleId = profile.googleId;
      await this.userRepository.save(user);
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
