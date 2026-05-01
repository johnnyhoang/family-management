import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { User, SystemRole, UserRole } from '../../common/entities/user.entity';
import { Family } from '../../common/entities/family.entity';
import { FamilyUser, FamilyUserStatus } from '../../common/entities/family-user.entity';
import { Invite, InviteStatus } from '../../common/entities/invite.entity';
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
    @InjectRepository(FamilyUser)
    private familyUserRepository: Repository<FamilyUser>,
    @InjectRepository(Invite)
    private inviteRepository: Repository<Invite>,
    private permissionService: PermissionService,
    private categoryService: CategoryService,
  ) {}

  async validateOAuthUser(profile: OAuthProfile) {
    this.logger.log(`Validating user ${profile.email}`);
    let user = await this.userRepository.findOne({
      where: { email: profile.email },
    });

    if (!user) {
      this.logger.log(`User ${profile.email} not found, creating new user`);
      user = await this.userRepository.save(this.userRepository.create({
        email: profile.email,
        fullName: profile.fullName,
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl ?? undefined,
        systemRole: SystemRole.USER,
      }));
    } else {
      let dirty = false;
      if (!user.googleId) { user.googleId = profile.googleId; dirty = true; }
      if (profile.avatarUrl && user.avatarUrl !== profile.avatarUrl) { user.avatarUrl = profile.avatarUrl; dirty = true; }
      if (profile.fullName && user.fullName !== profile.fullName) { user.fullName = profile.fullName; dirty = true; }
      if (dirty) {
        await this.userRepository.save(user);
      }
    }

    await this.permissionService.seedSystemPermissions();

    let memberships = await this.familyUserRepository.find({
      where: { userId: user.id, status: FamilyUserStatus.ACTIVE },
      relations: ['role', 'family'],
      order: { createdAt: 'ASC' },
    });

    if (memberships.length === 0 && user.systemRole !== SystemRole.APP_ADMIN) {
      await this.createDefaultFamilyForUser(user);
      memberships = await this.familyUserRepository.find({
        where: { userId: user.id, status: FamilyUserStatus.ACTIVE },
        relations: ['role', 'family'],
        order: { createdAt: 'ASC' },
      });
    }

    const activeFamilyId = user.systemRole === SystemRole.APP_ADMIN
      ? null
      : user.lastActiveFamilyId && memberships.some((membership) => membership.familyId === user.lastActiveFamilyId)
        ? user.lastActiveFamilyId
        : memberships[0]?.familyId ?? null;

    if (activeFamilyId !== user.lastActiveFamilyId) {
      user.lastActiveFamilyId = activeFamilyId;
      await this.userRepository.save(user);
    }

    return this.generateToken(user, memberships, activeFamilyId);
  }

  async getSessionProfile(userId: string, activeFamilyId?: string | null) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    const memberships = await this.familyUserRepository.find({
      where: { userId, status: FamilyUserStatus.ACTIVE },
      relations: ['role', 'family'],
      order: { createdAt: 'ASC' },
    });

    const nextFamilyId = user.systemRole === SystemRole.APP_ADMIN
      ? null
      : activeFamilyId && memberships.some((membership) => membership.familyId === activeFamilyId)
        ? activeFamilyId
        : user.lastActiveFamilyId && memberships.some((membership) => membership.familyId === user.lastActiveFamilyId)
          ? user.lastActiveFamilyId
          : memberships[0]?.familyId ?? null;

    if (nextFamilyId !== user.lastActiveFamilyId) {
      user.lastActiveFamilyId = nextFamilyId;
      await this.userRepository.save(user);
    }

    return this.generateToken(user, memberships, nextFamilyId);
  }

  async switchActiveFamily(userId: string, familyId: string) {
    const session = await this.getSessionProfile(userId, familyId);
    if (session.user.systemRole !== SystemRole.APP_ADMIN && session.user.familyId !== familyId) {
      throw new UnauthorizedException('User is not a member of the selected family');
    }
    return session;
  }

  async acceptInvite(userId: string, token: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }

    const invite = await this.inviteRepository.findOne({
      where: { token, status: InviteStatus.PENDING },
      relations: ['role', 'family'],
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new UnauthorizedException('Invite email does not match current user');
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      invite.status = InviteStatus.EXPIRED;
      await this.inviteRepository.save(invite);
      throw new UnauthorizedException('Invite has expired');
    }

    const existingMembership = await this.familyUserRepository.findOne({
      where: {
        userId,
        familyId: invite.familyId,
      },
    });

    if (!existingMembership) {
      await this.familyUserRepository.save(this.familyUserRepository.create({
        familyId: invite.familyId,
        userId,
        roleId: invite.roleId,
        status: FamilyUserStatus.ACTIVE,
        invitedByUserId: invite.invitedByUserId,
      }));
    } else if (existingMembership.status !== FamilyUserStatus.ACTIVE || existingMembership.roleId !== invite.roleId) {
      existingMembership.roleId = invite.roleId;
      existingMembership.status = FamilyUserStatus.ACTIVE;
      existingMembership.invitedByUserId = invite.invitedByUserId;
      await this.familyUserRepository.save(existingMembership);
    }

    invite.status = InviteStatus.ACCEPTED;
    invite.acceptedByUserId = userId;
    await this.inviteRepository.save(invite);

    user.lastActiveFamilyId = invite.familyId;
    await this.userRepository.save(user);
    await this.categoryService.ensureDefaultIncomeCategories(invite.familyId);

    return this.getSessionProfile(userId, invite.familyId);
  }

  async listUserFamilies(userId: string) {
    const memberships = await this.familyUserRepository.find({
      where: { userId, status: FamilyUserStatus.ACTIVE },
      relations: ['family', 'role'],
      order: { createdAt: 'ASC' },
    });

    return memberships.map((membership) => ({
      familyId: membership.familyId,
      familyName: membership.family?.name,
      role: membership.role?.code,
      status: membership.status,
    }));
  }

  private async createDefaultFamilyForUser(user: User) {
    const familyAdminRole = await this.permissionService.getRoleByCode(UserRole.FAMILY_ADMIN);

    const family = await this.familyRepository.save(this.familyRepository.create({
      name: user.fullName ? `${user.fullName}'s Family` : 'My Family',
    }));

    await this.familyUserRepository.save(this.familyUserRepository.create({
      familyId: family.id,
      userId: user.id,
      roleId: familyAdminRole.id,
      status: FamilyUserStatus.ACTIVE,
    }));

    user.lastActiveFamilyId = family.id;
    await this.userRepository.save(user);

    await this.categoryService.ensureDefaultIncomeCategories(family.id);
  }

  private generateToken(user: User, memberships: FamilyUser[], activeFamilyId: string | null) {
    const activeMembership = activeFamilyId
      ? memberships.find((membership) => membership.familyId === activeFamilyId)
      : undefined;

    const payload = {
      email: user.email,
      sub: user.id,
      systemRole: user.systemRole,
      activeFamilyId,
      activeRole: activeMembership?.role?.code ?? (user.systemRole === SystemRole.APP_ADMIN ? UserRole.APP_ADMIN : null),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        systemRole: user.systemRole,
        role: activeMembership?.role?.code ?? (user.systemRole === SystemRole.APP_ADMIN ? UserRole.APP_ADMIN : null),
        familyId: activeFamilyId,
        memberships: memberships.map((membership) => ({
          familyId: membership.familyId,
          familyName: membership.family?.name,
          role: membership.role?.code,
        })),
      },
    };
  }

  async updateMe(userId: string, data: { fullName?: string; otherNames?: string }) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (data.fullName !== undefined) user.fullName = data.fullName;
    if (data.otherNames !== undefined) user.otherNames = data.otherNames;
    await this.userRepository.save(user);
    return { id: user.id, email: user.email, fullName: user.fullName, avatarUrl: user.avatarUrl, otherNames: user.otherNames };
  }

  buildInviteToken() {
    return randomUUID();
  }
}
