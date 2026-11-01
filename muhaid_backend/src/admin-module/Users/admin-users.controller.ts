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
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core-module/Auth/index.js';
import { NotEmptyBodyPipe } from '../../core-module/Validation/index.js';
import { AdminUsersService } from './admin-users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { ListUsersDto } from './dto/list-users.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

// Users are deactivated (isActive: false), never deleted: their inspections reference them.
@Controller('admin/users')
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.users.create(body);
  }

  @Get()
  list(@Query() query: ListUsersDto) {
    return this.users.list(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.findOne(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(NotEmptyBodyPipe) body: UpdateUserDto,
  ) {
    return this.users.update(actor, id, body);
  }
}
