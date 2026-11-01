import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import argon2 from 'argon2';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import {
  type AuthUser,
  publicUserColumns,
} from '../../core-module/Auth/index.js';
import { type Database, InjectDb } from '../../core-module/Database/index.js';
import {
  inspectionTemplates,
  projects,
  templateAssignments,
  users,
} from '../../core-module/Database/schema/index.js';
import { offsetOf } from '../../core-module/Validation/index.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { ListUsersDto } from './dto/list-users.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class AdminUsersService {
  constructor(@InjectDb() private readonly db: Database) {}

  // A duplicate email (any letter case) is a 409 via PgExceptionFilter.
  async create({ password, ...input }: CreateUserDto) {
    const [user] = await this.db
      .insert(users)
      .values({ ...input, passwordHash: await argon2.hash(password) })
      .returning(publicUserColumns);
    return user;
  }

  async list(query: ListUsersDto) {
    const where = and(
      query.role ? eq(users.role, query.role) : undefined,
      query.isActive !== undefined
        ? eq(users.isActive, query.isActive)
        : undefined,
    );
    const [items, [{ total }]] = await Promise.all([
      this.db
        .select(publicUserColumns)
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(query.limit)
        .offset(offsetOf(query)),
      this.db.select({ total: count() }).from(users).where(where),
    ]);
    return { items, page: query.page, limit: query.limit, total };
  }

  async findOne(id: string) {
    const [user] = await this.db
      .select(publicUserColumns)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!user) throw new NotFoundException('User not found');

    const templates = await this.db
      .select({
        id: inspectionTemplates.id,
        name: inspectionTemplates.name,
        validFrom: inspectionTemplates.validFrom,
        validTo: inspectionTemplates.validTo,
        project: { id: projects.id, code: projects.code, name: projects.name },
        assignedAt: templateAssignments.assignedAt,
      })
      .from(templateAssignments)
      .innerJoin(
        inspectionTemplates,
        eq(inspectionTemplates.id, templateAssignments.templateId),
      )
      .innerJoin(projects, eq(projects.id, inspectionTemplates.projectId))
      .where(eq(templateAssignments.userId, id))
      .orderBy(asc(projects.code), asc(inspectionTemplates.name));

    return { ...user, templates };
  }

  async update(actor: AuthUser, id: string, input: UpdateUserDto) {
    // An admin can't lock themselves out.
    if (
      id === actor.id &&
      (input.isActive === false || (input.role && input.role !== 'admin'))
    ) {
      throw new BadRequestException(
        'You cannot deactivate yourself or remove your own admin role',
      );
    }

    const { password, ...fields } = input;
    const [user] = await this.db
      .update(users)
      .set({
        ...fields,
        ...(password ? { passwordHash: await argon2.hash(password) } : {}),
      })
      .where(eq(users.id, id))
      .returning(publicUserColumns);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
