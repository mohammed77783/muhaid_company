import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core-module/Auth/index.js';
import { WebTemplatesService } from './web-templates.service.js';

@Controller('web/templates')
@Roles('inspector')
export class WebTemplatesController {
  constructor(private readonly templates: WebTemplatesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.templates.listActive(user.id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.templates.findAssigned(user.id, id);
  }
}
