import {
  Body,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core-module/Auth/index.js';
import { InspectionReader } from '../../core-module/Inspections/index.js';
import {
  FileStorageService,
  PhotoInterceptor,
} from '../../core-module/Storage/index.js';
import { ListMyInspectionsDto } from './dto/list-my-inspections.dto.js';
import { SubmitInspectionDto } from './dto/submit-inspection.dto.js';
import {
  WEB_INSPECTIONS_PATH,
  WebInspectionsService,
} from './web-inspections.service.js';

// No PUT/PATCH/DELETE on purpose: a submitted inspection is final.
@Controller('web/inspections')
@Roles('inspector')
export class WebInspectionsController {
  constructor(
    private readonly inspections: WebInspectionsService,
    private readonly reader: InspectionReader,
    private readonly storage: FileStorageService,
  ) {}

  // multipart/form-data: id, templateId, filledAt,
  // answers (JSON text) and the `photo` file. The work order number comes
  // from the inspector's assignment, not from the client.
  // 201 when stored, 200 when this id was already synced (safe to retry).
  @Post()
  @UseInterceptors(PhotoInterceptor)
  async submit(
    @CurrentUser() user: AuthUser,
    @Body() body: SubmitInspectionDto,
    @UploadedFile() photo: Express.Multer.File | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { created, inspection } = await this.inspections.submit(
      user,
      body,
      photo,
    );
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return inspection;
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListMyInspectionsDto) {
    return this.reader.list({ ...query, inspectorId: user.id });
  }

  // Someone else's inspection is a 404, not a 403, so ids don't leak.
  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const inspection = await this.reader.findById(id, WEB_INSPECTIONS_PATH, {
      inspectorId: user.id,
    });
    if (!inspection) throw new NotFoundException('Inspection not found');
    return inspection;
  }

  @Get(':id/photo')
  async photo(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const photoPath = await this.reader.findPhotoPath(id, {
      inspectorId: user.id,
    });
    if (!photoPath) throw new NotFoundException('Inspection not found');
    return this.storage.stream(photoPath);
  }
}
