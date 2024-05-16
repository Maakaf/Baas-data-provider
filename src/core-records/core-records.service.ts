import {
  CoreRecord,
  CoreRecordDocument,
  FilterCoreRecords,
} from '@/common/mongoose/schemas/core-records';
import { CoreRecordTypeName } from '@/types/core-records';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class CoreRecordsService {
  constructor(
    @InjectModel(CoreRecord.name)
    private readonly coreRecordModel: Model<CoreRecordDocument>,
  ) {}
  // Get all records paginated and filtered
  async getAllRecords({
    page,
    limit,
    filter,
  }: {
    page: number;
    limit: number;
    filter: FilterCoreRecords;
  }) {
    try {
      filter.archivedAt = undefined;
      const query = this.coreRecordModel.find(filter);

      const total = await this.coreRecordModel.countDocuments(filter).exec();
      const data = await query
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      return { data, total };
    } catch (error) {
      Logger.error('Error getting all records', { filter, error });
      return null;
    }
  }

  // get a single record by id
  async getRecordById(id: string) {
    try {
      const record = await this.coreRecordModel
        .find({
          _id: id,
          archivedAt: null,
        })
        .exec();
      return record;
    } catch (error) {
      Logger.error('Error getting record by id', { id, error });
      return null;
    }
  }

  async createRecord(
    recordId: string,
    recordType: CoreRecordTypeName,
    createdBy: string,
  ) {
    try {
      const newRecord = new this.coreRecordModel({
        recordId,
        type: recordType,
        createdAt: new Date(),
        createdBy,
        updatedAt: new Date(),
        updatedBy: createdBy,
      });
      await newRecord.save();
      return newRecord;
    } catch (error) {
      Logger.error('Error saving record', {
        recordId,
        createdBy,
        recordType,
        error,
      });
    }
  }

  //update a record by id
  async updateRecord(
    id: string,
    recordId: string,
    updatedBy: string,
  ): Promise<CoreRecordDocument | null> {
    try {
      const updatedRecord = await this.coreRecordModel
        .findByIdAndUpdate(
          id,
          {
            recordId,
            updatedAt: new Date(),
            updatedBy,
          },
          { new: true },
        )
        .exec();
      return updatedRecord;
    } catch (error) {
      Logger.error('Error updating record', { id, recordId, updatedBy, error });
      return null;
    }
  }

  // delete a record by id
  async deleteRecord(id: string, deletedBy: string) {
    try {
      const deletedRecord = await this.coreRecordModel
        .findByIdAndUpdate(
          id,
          {
            archivedAt: new Date(),
            archivedBy: deletedBy,
          },
          { new: true },
        )
        .exec();
      return deletedRecord;
    } catch (error) {
      Logger.error('Error deleting record', { id, deletedBy, error });
      return null;
    }
  }
}
