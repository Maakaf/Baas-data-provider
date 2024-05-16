import { CoreRecordTypeName, ICoreRecord } from '@/types/core-records';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument } from 'mongoose';

export type CoreRecordDocument = HydratedDocument<CoreRecord>;

@Schema()
export class CoreRecord implements ICoreRecord {
  @Prop({ required: true, refPath: 'type' })
  recordId: string;

  @Prop({ required: true, enum: CoreRecordTypeName })
  type: CoreRecordTypeName;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ required: false })
  archivedAt: Date;

  @Prop({ required: false })
  archivedBy: string;
}

export type FilterCoreRecords = Partial<Record<keyof CoreRecord, string>>;
export const CoreRecordSchema = SchemaFactory.createForClass(CoreRecord);
