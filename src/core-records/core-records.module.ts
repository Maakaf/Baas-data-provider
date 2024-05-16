import { Module } from '@nestjs/common';
import { CoreRecordsService } from './core-records.service';
import { CoreRecordsController } from './core-records.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CoreRecord,
  CoreRecordSchema,
} from '@/common/mongoose/schemas/core-records';

@Module({
  providers: [CoreRecordsService],
  controllers: [CoreRecordsController],
  imports: [
    MongooseModule.forFeature([
      { name: CoreRecord.name, schema: CoreRecordSchema },
    ]),
  ],
})
export class CoreRecordsModule {}
