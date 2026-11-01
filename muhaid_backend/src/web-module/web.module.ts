import { Module } from '@nestjs/common';
import { WebInspectionsController } from './Inspections/web-inspections.controller.js';
import { WebInspectionsService } from './Inspections/web-inspections.service.js';
import { WebTemplatesController } from './Templates/web-templates.controller.js';
import { WebTemplatesService } from './Templates/web-templates.service.js';

// API for the inspector app (React). Every route requires role `inspector`.
@Module({
  controllers: [WebTemplatesController, WebInspectionsController],
  providers: [WebTemplatesService, WebInspectionsService],
})
export class WebModule {}
