import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { Roles } from '../../core-module/Auth/index.js';
import { InspectionReader } from '../../core-module/Inspections/index.js';
import { FileStorageService } from '../../core-module/Storage/index.js';
import { ListInspectionsDto } from './dto/list-inspections.dto.js';

const ADMIN_INSPECTIONS_PATH = '/admin/inspections';

// Read-only: submitted inspections are final, for admins too.
@Controller('admin/inspections')
@Roles('admin')
export class AdminInspectionsController {
  constructor(
    private readonly reader: InspectionReader,
    private readonly storage: FileStorageService,
  ) {}

  @Get()
  list(@Query() query: ListInspectionsDto) {
    return this.reader.list(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const inspection = await this.reader.findById(id, ADMIN_INSPECTIONS_PATH);
    if (!inspection) throw new NotFoundException('Inspection not found');
    return inspection;
  }

  @Get(':id/photo')
  async photo(@Param('id', ParseUUIDPipe) id: string) {
    const photoPath = await this.reader.findPhotoPath(id);
    if (!photoPath) throw new NotFoundException('Inspection not found');
    return this.storage.stream(photoPath);
  }
}
