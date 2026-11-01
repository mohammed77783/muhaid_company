import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core-module/Auth/index.js';
import { NotEmptyBodyPipe } from '../../core-module/Validation/index.js';
import { AdminTemplatesService } from './admin-templates.service.js';
import { AssignTemplateDto } from './dto/assign-template.dto.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { ListTemplatesDto } from './dto/list-templates.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';

// Templates (نماذج) and which inspectors may fill them.
@Controller('admin/templates')
@Roles('admin')
export class AdminTemplatesController {
  constructor(private readonly templates: AdminTemplatesService) {}

  @Post()
  create(@Body() body: CreateTemplateDto) {
    return this.templates.create(body);
  }

  @Get()
  list(@Query() query: ListTemplatesDto) {
    return this.templates.list(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.templates.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(NotEmptyBodyPipe) body: UpdateTemplateDto,
  ) {
    return this.templates.update(id, body);
  }

  @Post(':id/assignments')
  assign(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AssignTemplateDto,
  ) {
    return this.templates.assign(actor, id, body);
  }

  @Delete(':id/assignments/:userId')
  @HttpCode(204)
  unassign(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.templates.unassign(id, userId);
  }
}
