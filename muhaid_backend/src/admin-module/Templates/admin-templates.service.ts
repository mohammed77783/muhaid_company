import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm';
import type { AuthUser } from '../../core-module/Auth/index.js';
import { type Database, InjectDb } from '../../core-module/Database/index.js';
import {
  inspections,
  inspectionTemplates,
  projects,
  templateAssignments,
  templateItems,
  users,
} from '../../core-module/Database/schema/index.js';
import { offsetOf } from '../../core-module/Validation/index.js';
import type { AssignTemplateDto } from './dto/assign-template.dto.js';
import type { CreateTemplateDto } from './dto/create-template.dto.js';
import type { ListTemplatesDto } from './dto/list-templates.dto.js';
import type { UpdateTemplateDto } from './dto/update-template.dto.js';

type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];

const toItemRows = (templateId: string, labels: string[]) =>
  labels.map((label, i) => ({ templateId, position: i + 1, label }));

@Injectable()
export class AdminTemplatesService {
  constructor(@InjectDb() private readonly db: Database) {}

  async create({ items, ...input }: CreateTemplateDto) {
    const [project] = await this.db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, input.projectId))
      .limit(1);
    if (!project) throw new NotFoundException('Project not found');

    const id = await this.db.transaction(async (tx) => {
      const [template] = await tx
        .insert(inspectionTemplates)
        .values(input)
        .returning({ id: inspectionTemplates.id });
      await tx.insert(templateItems).values(toItemRows(template.id, items));
      return template.id;
    });
    return this.findOne(id);
  }

  async list(query: ListTemplatesDto) {
    const where = query.projectId
      ? eq(inspectionTemplates.projectId, query.projectId)
      : undefined;
    const [items, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: inspectionTemplates.id,
          name: inspectionTemplates.name,
          validFrom: inspectionTemplates.validFrom,
          validTo: inspectionTemplates.validTo,
          createdAt: inspectionTemplates.createdAt,
          project: {
            id: projects.id,
            code: projects.code,
            name: projects.name,
          },
        })
        .from(inspectionTemplates)
        .innerJoin(projects, eq(projects.id, inspectionTemplates.projectId))
        .where(where)
        .orderBy(desc(inspectionTemplates.createdAt))
        .limit(query.limit)
        .offset(offsetOf(query)),
      this.db.select({ total: count() }).from(inspectionTemplates).where(where),
    ]);
    return { items, page: query.page, limit: query.limit, total };
  }

  async findOne(id: string) {
    const [template] = await this.db
      .select({
        id: inspectionTemplates.id,
        name: inspectionTemplates.name,
        validFrom: inspectionTemplates.validFrom,
        validTo: inspectionTemplates.validTo,
        createdAt: inspectionTemplates.createdAt,
        project: { id: projects.id, code: projects.code, name: projects.name },
      })
      .from(inspectionTemplates)
      .innerJoin(projects, eq(projects.id, inspectionTemplates.projectId))
      .where(eq(inspectionTemplates.id, id))
      .limit(1);
    if (!template) throw new NotFoundException('Template not found');

    const [items, assignees, inspectionCount] = await Promise.all([
      this.db
        .select({
          id: templateItems.id,
          position: templateItems.position,
          label: templateItems.label,
        })
        .from(templateItems)
        .where(eq(templateItems.templateId, id))
        .orderBy(asc(templateItems.position)),
      this.assignees(id),
      this.inspectionCount(this.db, id),
    ]);
    return { ...template, items, assignees, inspectionCount };
  }

  async update(id: string, { items, ...fields }: UpdateTemplateDto) {
    await this.db.transaction(async (tx) => {
      // FOR UPDATE also blocks new inspections (their FK takes a KEY SHARE
      // lock on this row) until we commit, so the count below stays true.
      const [locked] = await tx
        .select({ id: inspectionTemplates.id })
        .from(inspectionTemplates)
        .where(eq(inspectionTemplates.id, id))
        .for('update');
      if (!locked) throw new NotFoundException('Template not found');

      // a reversed date range left by a partial update is a 400 from the CHECK
      if (Object.keys(fields).length) {
        await tx
          .update(inspectionTemplates)
          .set(fields)
          .where(eq(inspectionTemplates.id, id));
      }

      if (items) {
        // Old answers point at these items (FK RESTRICT), so they're frozen
        // once the template has been used. Create a new template instead.
        if ((await this.inspectionCount(tx, id)) > 0) {
          throw new ConflictException(
            'Items cannot change after inspections were submitted; create a new template',
          );
        }
        await tx.delete(templateItems).where(eq(templateItems.templateId, id));
        await tx.insert(templateItems).values(toItemRows(id, items));
      }
    });
    return this.findOne(id);
  }

  // Only active inspectors can be assigned. Re-assigning is a no-op.
  async assign(actor: AuthUser, id: string, { userIds }: AssignTemplateDto) {
    await this.ensureExists(id);
    const unique = [...new Set(userIds)];
    const valid = await this.db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          inArray(users.id, unique),
          eq(users.role, 'inspector'),
          eq(users.isActive, true),
        ),
      );
    if (valid.length !== unique.length) {
      const ok = new Set(valid.map((u) => u.id));
      throw new BadRequestException({
        message: 'Only active inspectors can be assigned',
        invalidUserIds: unique.filter((u) => !ok.has(u)),
      });
    }

    await this.db
      .insert(templateAssignments)
      .values(
        unique.map((userId) => ({
          templateId: id,
          userId,
          assignedBy: actor.id,
        })),
      )
      .onConflictDoNothing();
    return this.assignees(id);
  }

  async unassign(id: string, userId: string) {
    const removed = await this.db
      .delete(templateAssignments)
      .where(
        and(
          eq(templateAssignments.templateId, id),
          eq(templateAssignments.userId, userId),
        ),
      )
      .returning({ userId: templateAssignments.userId });
    if (!removed.length) throw new NotFoundException('Assignment not found');
  }

  private assignees(templateId: string) {
    return this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        isActive: users.isActive,
        workOrderNumber: templateAssignments.workOrderNumber,
        completedAt: templateAssignments.completedAt,
        assignedAt: templateAssignments.assignedAt,
      })
      .from(templateAssignments)
      .innerJoin(users, eq(users.id, templateAssignments.userId))
      .where(eq(templateAssignments.templateId, templateId))
      .orderBy(asc(users.name));
  }

  private async inspectionCount(db: Database | Tx, templateId: string) {
    const [{ n }] = await db
      .select({ n: count() })
      .from(inspections)
      .where(eq(inspections.templateId, templateId));
    return n;
  }

  private async ensureExists(id: string) {
    const [row] = await this.db
      .select({ id: inspectionTemplates.id })
      .from(inspectionTemplates)
      .where(eq(inspectionTemplates.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Template not found');
  }
}
