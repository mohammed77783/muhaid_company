import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import type { AuthUser } from '../../core-module/Auth/index.js';
import { type Database, InjectDb } from '../../core-module/Database/index.js';
import {
  inspectionAnswers,
  inspections,
  inspectionTemplates,
  projects,
  templateAssignments,
  templateItems,
} from '../../core-module/Database/schema/index.js';
import {
  type InspectionDetail,
  InspectionReader,
} from '../../core-module/Inspections/index.js';
import {
  detectImageType,
  FileStorageService,
} from '../../core-module/Storage/index.js';
import { answerMismatch } from './answer-mismatch.js';
import type { SubmitInspectionDto } from './dto/submit-inspection.dto.js';

export const WEB_INSPECTIONS_PATH = '/web/inspections';

export interface SubmitResult {
  // false when this id was already synced: the request was a retry
  created: boolean;
  inspection: InspectionDetail;
}

@Injectable()
export class WebInspectionsService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly reader: InspectionReader,
    private readonly storage: FileStorageService,
  ) {}

  async submit(
    user: AuthUser,
    input: SubmitInspectionDto,
    photo: Express.Multer.File | undefined,
  ): Promise<SubmitResult> {
    // A retry after reconnect: return what was stored and leave it untouched.
    const replay = await this.replay(user, input.id);
    if (replay) return replay;

    if (!photo) throw new BadRequestException('photo is required');
    const ext = detectImageType(photo.buffer);
    if (!ext) {
      throw new BadRequestException('photo must be a JPEG, PNG or WebP image');
    }

    // Validity is checked against filledAt, not now: a form filled offline
    // while the template was valid still syncs after the template ends.
    const filledOn = sql`(${input.filledAt.toISOString()}::timestamptz)::date`;
    const [template] = await this.db
      .select({
        projectCode: projects.code,
        workOrderNumber: templateAssignments.workOrderNumber,
        completedAt: templateAssignments.completedAt,
        validOnFilledAt: sql<boolean>`${inspectionTemplates.validFrom} <= ${filledOn}
          AND (${inspectionTemplates.validTo} IS NULL OR ${inspectionTemplates.validTo} >= ${filledOn})`,
      })
      .from(templateAssignments)
      .innerJoin(
        inspectionTemplates,
        eq(inspectionTemplates.id, templateAssignments.templateId),
      )
      .innerJoin(projects, eq(projects.id, inspectionTemplates.projectId))
      .where(
        and(
          eq(templateAssignments.userId, user.id),
          eq(templateAssignments.templateId, input.templateId),
        ),
      )
      .limit(1);
    if (!template) {
      throw new ForbiddenException('This template is not assigned to you');
    }
    if (template.completedAt) {
      throw new ConflictException(
        'This work order was already submitted for this template',
      );
    }
    if (!template.validOnFilledAt) {
      throw new UnprocessableEntityException(
        'The template was not valid on the date the form was filled',
      );
    }

    const items = await this.db
      .select({ id: templateItems.id, label: templateItems.label })
      .from(templateItems)
      .where(eq(templateItems.templateId, input.templateId));
    const mismatch = answerMismatch(
      input.answers.map((a) => a.itemId),
      items.map((i) => i.id),
    );
    if (mismatch) {
      throw new BadRequestException({
        message: 'Every template item must be answered exactly once',
        ...mismatch,
      });
    }

    const labels = new Map(items.map((i) => [i.id, i.label]));
    const photoPath = `${this.storage.folderFor(template.projectCode, user.id)}/${input.id}.${ext}`;

    const created = await this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(inspections)
        .values({
          id: input.id,
          templateId: input.templateId,
          workOrderNumber: template.workOrderNumber,
          inspectorId: user.id,
          photoPath,
          filledAt: input.filledAt,
        })
        .onConflictDoNothing({ target: inspections.id })
        .returning({ id: inspections.id });
      // A concurrent request with the same id committed first.
      if (!inserted.length) return false;

      // One-time job: the first submission completes the work order. The
      // conditional update also catches two different ids racing.
      const completed = await tx
        .update(templateAssignments)
        .set({ completedAt: new Date() })
        .where(
          and(
            eq(templateAssignments.templateId, input.templateId),
            eq(templateAssignments.userId, user.id),
            isNull(templateAssignments.completedAt),
          ),
        )
        .returning({ userId: templateAssignments.userId });
      if (!completed.length) {
        throw new ConflictException(
          'This work order was already submitted for this template',
        );
      }

      await tx.insert(inspectionAnswers).values(
        input.answers.map((a) => ({
          inspectionId: input.id,
          templateId: input.templateId,
          itemId: a.itemId,
          itemLabel: labels.get(a.itemId)!,
          answer: a.answer,
          note: a.note,
        })),
      );

      // Last step: if the write fails the rows roll back. If the commit fails
      // instead, the retry uses the same id and path and overwrites this file.
      await this.storage.save(photoPath, photo.buffer);
      return true;
    });

    if (!created) {
      const winner = await this.replay(user, input.id);
      if (winner) return winner;
    }
    return { created: true, inspection: await this.detail(user, input.id) };
  }

  private async replay(
    user: AuthUser,
    id: string,
  ): Promise<SubmitResult | null> {
    const [existing] = await this.db
      .select({ inspectorId: inspections.inspectorId })
      .from(inspections)
      .where(eq(inspections.id, id))
      .limit(1);
    if (!existing) return null;
    if (existing.inspectorId !== user.id) {
      throw new ConflictException('An inspection with this id already exists');
    }
    return { created: false, inspection: await this.detail(user, id) };
  }

  private async detail(user: AuthUser, id: string) {
    const inspection = await this.reader.findById(id, WEB_INSPECTIONS_PATH, {
      inspectorId: user.id,
    });
    if (!inspection) throw new Error(`Inspection ${id} vanished after insert`);
    return inspection;
  }
}
