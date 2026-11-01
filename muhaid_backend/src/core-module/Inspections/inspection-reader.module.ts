import { Global, Module } from '@nestjs/common';
import { InspectionReader } from './inspection-reader.service.js';

@Global()
@Module({
  providers: [InspectionReader],
  exports: [InspectionReader],
})
export class InspectionReaderModule {}
