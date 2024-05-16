import { IMentorRecord } from '@/types/core-records';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument } from 'mongoose';

export type MentorRecordDocument = HydratedDocument<MentorRecord>;

@Schema()
export class MentorRecord implements IMentorRecord {
  @Prop({ required: true })
  stud: string;
}

export const MentorRecordSchema = SchemaFactory.createForClass(MentorRecord);
