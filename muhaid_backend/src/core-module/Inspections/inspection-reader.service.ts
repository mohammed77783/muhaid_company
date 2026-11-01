import { Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import { type Database, InjectDb } from '../Database/index.js';
import {
  inspectionAnswers,
  inspections,
  inspectionTemplates,
  projects,
  templateItems,
  users,
} from '../Database/schema/index.js';
import {
  offsetOf,
  type Paginated,
  type Pagination,
} from '../Validation/index.js';

export interface InspectionScope {
  // set for inspectors: they only ever see their own submissions
  inspectorId?: string;
}

export interface InspectionListFilter extends InspectionScope, Pagination {
  workOrder?: string;
  projectId?: string;
  templateId?: string;
  from?: Date;
  to?: Date;
}

const summaryColumns = {
  id: inspections.id,
  workOrderNumber: inspections.workOrderNumber,
  filledAt: inspections.filledAt,
  receivedAt: inspections.receivedAt,
  template: { id: inspectionTemplates.id, name: inspectionTemplates.name },
  project: { id: projects.id, code: projects.code, name: projects.name },
  inspector: { id: users.id, name: users.name },
};

// Read side of inspections, shared by the inspector app and the admin dashboard.
// Inspections are immutable, so there is no write method here.
@Injectable()
export class InspectionReader {
  constructor(@InjectDb() private readonly db: Database) {}

  private summaryQuery() {
    return this.db
      .select(summaryColumns)
      .from(inspections)
      .innerJoin(
        inspectionTemplates,
        eq(inspectionTemplates.id, inspections.templateId),
      )
      .innerJoin(projects, eq(projects.id, inspectionTemplates.projectId))
      .innerJoin(users, eq(users.id, inspections.inspectorId));
  }

  private scoped(id: string, scope: InspectionScope): SQL | undefined {
    return and(
      eq(inspections.id, id),
      scope.inspectorId
        ? eq(inspections.inspectorId, scope.inspectorId)
        : undefined,
    );
  }

  // `photoBase` is the route prefix of the caller, e.g. '/web/inspections'.
  async findById(id: string, photoBase: string, scope: InspectionScope = {}) {
    const [row] = await this.summaryQuery()
      .where(this.scoped(id, scope))
      .limit(1);
    if (!row) return null;

    // item_label is the question text as it was at submission time
    const answers = await this.db
      .select({
        itemId: inspectionAnswers.itemId,
        position: templateItems.position,
        label: inspectionAnswers.itemLabel,
        answer: inspectionAnswers.answer,
        note: inspectionAnswers.note,
      })
      .from(inspectionAnswers)
      .innerJoin(templateItems, eq(templateItems.id, inspectionAnswers.itemId))
      .where(eq(inspectionAnswers.inspectionId, id))
      .orderBy(asc(templateItems.position));

    return { ...row, photoUrl: `${photoBase}/${id}/photo`, answers };
  }

  async findPhotoPath(id: string, scope: InspectionScope = {}) {
    const [row] = await this.db
      .select({ photoPath: inspections.photoPath })
      .from(inspections)
      .where(this.scoped(id, scope))
      .limit(1);
    return row?.photoPath ?? null;
  }

  async list(filter: InspectionListFilter) {
    const where = and(
      filter.workOrder
        ? eq(inspections.workOrderNumber, filter.workOrder)
        : undefined,
      filter.inspectorId
        ? eq(inspections.inspectorId, filter.inspectorId)
        : undefined,
      filter.projectId
        ? eq(inspectionTemplates.projectId, filter.projectId)
        : undefined,
      filter.templateId
        ? eq(inspections.templateId, filter.templateId)
        : undefined,
      filter.from ? gte(inspections.filledAt, filter.from) : undefined,
      filter.to ? lte(inspections.filledAt, filter.to) : undefined,
    );

    const [items, [{ total }]] = await Promise.all([
      this.summaryQuery()
        .where(where)
        .orderBy(desc(inspections.filledAt), desc(inspections.id))
        .limit(filter.limit)
        .offset(offsetOf(filter)),
      this.db
        .select({ total: count() })
        .from(inspections)
        .innerJoin(
          inspectionTemplates,
          eq(inspectionTemplates.id, inspections.templateId),
        )
        .where(where),
    ]);

    return {
      items,
      page: filter.page,
      limit: filter.limit,
      total,
    } satisfies Paginated<(typeof items)[number]>;
  }
}

export type InspectionDetail = NonNullable<
  Awaited<ReturnType<InspectionReader['findById']>>
>;
