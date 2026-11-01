import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../../core-module/Auth/index.js';
import { NotEmptyBodyPipe } from '../../core-module/Validation/index.js';
import { AdminProjectsService } from './admin-projects.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { ListProjectsDto } from './dto/list-projects.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';

@Controller('admin/projects')
@Roles('admin')
export class AdminProjectsController {
  constructor(private readonly projects: AdminProjectsService) {}

  @Post()
  create(@Body() body: CreateProjectDto) {
    return this.projects.create(body);
  }

  @Get()
  list(@Query() query: ListProjectsDto) {
    return this.projects.list(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projects.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(NotEmptyBodyPipe) body: UpdateProjectDto,
  ) {
    return this.projects.update(id, body);
  }
}
