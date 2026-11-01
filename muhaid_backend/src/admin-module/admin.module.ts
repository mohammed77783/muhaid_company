import { Module } from '@nestjs/common';
import { AdminInspectionsController } from './Inspections/admin-inspections.controller.js';
import { AdminProjectsController } from './Projects/admin-projects.controller.js';
import { AdminProjectsService } from './Projects/admin-projects.service.js';
import { AdminTemplatesController } from './Templates/admin-templates.controller.js';
import { AdminTemplatesService } from './Templates/admin-templates.service.js';
import { AdminUsersController } from './Users/admin-users.controller.js';
import { AdminUsersService } from './Users/admin-users.service.js';

// API for the admin dashboard. Every route requires role `admin`.
@Module({
  controllers: [
    AdminUsersController,
    AdminProjectsController,
    AdminTemplatesController,
    AdminInspectionsController,
  ],
  providers: [AdminUsersService, AdminProjectsService, AdminTemplatesService],
})
export class AdminModule {}
