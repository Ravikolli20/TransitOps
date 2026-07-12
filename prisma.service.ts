import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const BCRYPT_ROUNDS = 12;
// Self-registration is intentionally limited to the lowest-privilege role.
// Elevating a user to ADMIN/FLEET_MANAGER/etc. is done via the (future)
// user-management endpoints by an existing Admin, never by self-registration.
const DEFAULT_SELF_REGISTER_ROLE = 'DISPATCHER' as const;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const role = await this.prisma.role.findUnique({
      where: { name: DEFAULT_SELF_REGISTER_ROLE },
    });
    if (!role) throw new Error('Default role not seeded — run prisma:seed');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleId: role.id,
      },
      include: { role: true },
    });

    return this.issueTokenPair(user.id, user.email, user.role.name);
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    // Same error for "no such user" and "wrong password" — avoids
    // leaking which emails are registered.
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokenPair(user.id, user.email, user.role.name);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!user || !user.refreshTokenHash) throw new UnauthorizedException('Session expired');

    // Refresh tokens are hashed at rest — a leaked DB dump alone can't be
    // replayed as a valid refresh token.
    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) throw new UnauthorizedException('Refresh token has been revoked');

    // Rotate on every use: old token is invalidated the moment a new one is issued.
    return this.issueTokenPair(user.id, user.email, user.role.name);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Always return the same response whether or not the email exists,
    // to prevent user enumeration.
    if (user) {
      const resetToken = this.jwt.sign(
        { sub: user.id, purpose: 'password_reset' },
        { secret: this.config.get<string>('JWT_REFRESH_SECRET'), expiresIn: '15m' },
      );
      // TODO(reports/notifications module): send via email provider.
      // Logged here only as a dev-mode placeholder — never log tokens in prod.
      if (this.config.get('NODE_ENV') !== 'production') {
        console.log(`[dev] Password reset token for ${user.email}: ${resetToken}`);
      }
    }
    return { message: 'If that email is registered, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    let payload: { sub: string; purpose: string };
    try {
      payload = this.jwt.verify(dto.token, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    if (payload.purpose !== 'password_reset') {
      throw new UnauthorizedException('Invalid token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: payload.sub },
      // Invalidate all existing sessions on password reset.
      data: { passwordHash, refreshTokenHash: null },
    });

    return { message: 'Password has been reset. Please log in again.' };
  }

  private async issueTokenPair(userId: string, email: string, role: string): Promise<TokenPair> {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN'),
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash } });

    return { accessToken, refreshToken };
  }
}
