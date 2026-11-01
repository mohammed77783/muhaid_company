import { randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { sql } from 'drizzle-orm';
import { type Database, InjectDb } from '../Database/index.js';
import { users } from '../Database/schema/index.js';
import type { JwtPayload } from './auth.types.js';
import type { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  private dummyHash?: Promise<string>;

  constructor(
    @InjectDb() private readonly db: Database,
    private readonly jwt: JwtService,
  ) {}

  async login({ email, password }: LoginDto) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);

    // Verify even for unknown emails so response time doesn't reveal which exist.
    this.dummyHash ??= argon2.hash(randomUUID());
    const hash = user?.passwordHash ?? (await this.dummyHash);
    const valid = await argon2.verify(hash, password);
    if (!user || !valid || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = { sub: user.id, role: user.role };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
