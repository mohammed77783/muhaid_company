import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AuthModule } from './Auth/auth.module.js';
import { DatabaseModule } from './Database/database.module.js';
import { PgExceptionFilter } from './Database/pg-exception.filter.js';
import { InspectionReaderModule } from './Inspections/inspection-reader.module.js';
import { StorageModule } from './Storage/storage.module.js';
import { AppValidationPipe } from './Validation/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development',
    }),
    DatabaseModule,
    AuthModule,
    StorageModule,
    InspectionReaderModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: PgExceptionFilter },
    { provide: APP_PIPE, useClass: AppValidationPipe },
  ],
})
export class CoreModule {}
