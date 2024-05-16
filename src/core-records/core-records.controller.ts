import { Controller } from '@nestjs/common';
import { CoreRecordsService } from './core-records.service';
import { FilterCoreRecords } from '@/common/mongoose/schemas/core-records';
import { CoreRecordTypeName } from '@/types/core-records';

@Controller('core-records')
export class CoreRecordsController {
  constructor(private readonly coreRecordsService: CoreRecordsService) {}

  // Add controller methods here
  // get all records paginated and filtered
  async getAllRecords({
    page,
    limit,
    filter,
  }: {
    page: number;
    limit: number;
    filter: FilterCoreRecords;
  }) {
    return this.coreRecordsService.getAllRecords({ page, limit, filter });
  }

  // get a single record by id
  async getRecordById(id: string) {
    return this.coreRecordsService.getRecordById(id);
  }

  // create a new record
  async createRecord(
    recordId: string,
    recordType: CoreRecordTypeName,
    createdBy: string,
  ) {
    return this.coreRecordsService.createRecord(
      recordId,
      recordType,
      createdBy,
    );
  }
}
