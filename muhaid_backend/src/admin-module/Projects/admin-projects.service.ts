import { Injectable, NotFoundException } from '@nestjs/common';
import { asc, count, desc, eq } from 'drizzle-orm';
import { type Database, InjectDb } from '../../core-module/Database/index.js';
import {
  inspectionTemplates,
  projects,
} from '../../core-module/Database/schema/index.js';
import { offsetOf } from '../../core-module/Validation/index.js';
import type { CreateProjectDto } from './dto/create-project.dto.js';
import type { ListProjectsDto } from './dto/list-projects.dto.js';
import type { UpdateProjectDto } from './dto/update-project.dto.js';

@Injectable()
export class AdminProjectsService {
  constructor(@InjectDb() private readonly db: Database) {}

  // A duplicate code is a 409 via PgExceptionFilter.
  async create(input: CreateProjectDto) {
    const [project] = await this.db.insert(projects).values(input).returning();
    return project;
  }

  async list(query: ListProjectsDto) {
    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(projects)
        .orderBy(desc(projects.createdAt))
        .limit(query.limit)
        .offset(offsetOf(query)),
      this.db.select({ total: count() }).from(projects),
    ]);
    return { items, page: query.page, limit: query.limit, total };
  }

  async findOne(id: string) {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    if (!project) throw new NotFoundException('Project not found');

    const templates = await this.db
      .select({
        id: inspectionTemplates.id,
        name: inspectionTemplates.name,
        validFrom: inspectionTemplates.validFrom,
        validTo: inspectionTemplates.validTo,
      })
      .from(inspectionTemplates)
      .where(eq(inspectionTemplates.projectId, id))
      .orderBy(asc(inspectionTemplates.name));

    return { ...project, templates };
  }

  // Changing the code doesn't move existing photos: their paths are stored per row.
  async update(id: string, input: UpdateProjectDto) {
    const [project] = await this.db
      .update(projects)
      .set(input)
      .where(eq(projects.id, id))
      .returning();
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
