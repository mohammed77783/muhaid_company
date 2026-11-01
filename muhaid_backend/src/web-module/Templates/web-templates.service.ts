import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, gte, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { type Database, InjectDb } from '../../core-module/Database/index.js';
import {
  inspectionTemplates,
  projects,
  templateAssignments,
  templateItems,
} from '../../core-module/Database/schema/index.js';

@Injectable()
export class WebTemplatesService {
  constructor(@InjectDb() private readonly db: Database) {}

  // callers add the where clause; it must filter on templateAssignments.userId
  private assignedQuery() {
    return this.db
      .select({
        id: inspectionTemplates.id,
        name: inspectionTemplates.name,
        validFrom: inspectionTemplates.validFrom,
        validTo: inspectionTemplates.validTo,
        workOrderNumber: templateAssignments.workOrderNumber,
        completedAt: templateAssignments.completedAt,
        project: { id: projects.id, code: projects.code, name: projects.name },
      })
      .from(templateAssignments)
      .innerJoin(
        inspectionTemplates,
        eq(inspectionTemplates.id, templateAssignments.templateId),
      )
      .innerJoin(projects, eq(projects.id, inspectionTemplates.projectId))
      .$dynamic();
  }

  private async withItems<T extends { id: string }>(templates: T[]) {
    if (!templates.length) return [];
    const items = await this.db
      .select({
        id: templateItems.id,
        templateId: templateItems.templateId,
        position: templateItems.position,
        label: templateItems.label,
      })
      .from(templateItems)
      .where(
        inArray(
          templateItems.templateId,
          templates.map((t) => t.id),
        ),
      )
      .orderBy(asc(templateItems.position));

    return templates.map((t) => ({
      ...t,
      items: items
        .filter((i) => i.templateId === t.id)
        .map((i) => ({ id: i.id, position: i.position, label: i.label })),
    }));
  }

  // Templates assigned to me that are valid today and not yet submitted. The app caches these so
  // the form can be filled offline.
  async listActive(userId: string) {
    const today = sql`current_date`;
    const templates = await this.assignedQuery()
      .where(
        and(
          eq(templateAssignments.userId, userId),
          isNull(templateAssignments.completedAt),
          lte(inspectionTemplates.validFrom, today),
          or(
            isNull(inspectionTemplates.validTo),
            gte(inspectionTemplates.validTo, today),
          ),
        ),
      )
      .orderBy(asc(projects.code), asc(inspectionTemplates.name));
    return this.withItems(templates);
  }

  async findAssigned(userId: string, templateId: string) {
    const templates = await this.assignedQuery()
      .where(
        and(
          eq(templateAssignments.userId, userId),
          eq(templateAssignments.templateId, templateId),
        ),
      )
      .limit(1);
    const [template] = await this.withItems(templates);
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }
}
