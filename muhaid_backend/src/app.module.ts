import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CoreModule } from './core-module/core.module.js';
import { WebModule } from './web-module/web.module.js';
import { AdminModule } from './admin-module/admin.module.js';

@Module({
  imports: [CoreModule, WebModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
