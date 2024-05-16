import { Test, TestingModule } from '@nestjs/testing';
import { CoreRecordsController } from './core-records.controller';
import { CoreRecordsService } from './core-records.service';

describe('CoreRecordsController', () => {
  let controller: CoreRecordsController;
  let mockCoreRecordsService: Partial<CoreRecordsService>;

  beforeEach(async () => {
    mockCoreRecordsService = {
      getAllRecords: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoreRecordsController],
      providers: [
        {
          provide: CoreRecordsService,
          useValue: mockCoreRecordsService,
        },
      ],
    }).compile();

    controller = module.get<CoreRecordsController>(CoreRecordsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getAllRecords should call service with correct parameters', async () => {
    const filter = {
      type: 'type',
    };
    await controller.getAllRecords({
      page: 1,
      limit: 10,
      filter,
    });

    expect(mockCoreRecordsService.getAllRecords).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      filter,
    });
  });
});
