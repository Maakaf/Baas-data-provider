import { Test, TestingModule } from '@nestjs/testing';
import { CoreRecordsService } from './core-records.service';
import {
  TestDbModule,
  closeInMongodConnection,
} from '../../test/mocks/module/mongo-in-memory';
import { MongooseModule } from '@nestjs/mongoose';
import { CoreRecordSchema } from '@/common/mongoose/schemas/core-records';

describe('CoreRecordsService', () => {
  let service: CoreRecordsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoreRecordsService],
      imports: [
        TestDbModule,
        MongooseModule.forFeature([
          { name: 'CoreRecord', schema: CoreRecordSchema },
        ]),
        // Include any setup for in-memory MongoDB here
      ],
    }).compile();

    service = module.get<CoreRecordsService>(CoreRecordsService);
  });

  afterAll(async () => {
    await closeInMongodConnection(); // Close the database connection after all tests
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
