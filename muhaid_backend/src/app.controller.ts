import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Public } from './core-module/Auth/index.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
