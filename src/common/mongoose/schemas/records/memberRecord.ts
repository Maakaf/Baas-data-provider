import { IMemberRecord } from '@/types/core-records';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument } from 'mongoose';

export type MemberRecordDocument = HydratedDocument<MemberRecord>;

@Schema()
export class MemberRecord implements IMemberRecord {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  discordUser: string;

  @Prop({
    required: true,
    type: {
      github: String,
      linkedIn: String,
    },
  })
  links: {
    github: string;
    linkedIn: string;
  };

  @Prop({ required: true })
  description: string;
}

export const MemberRecordSchema = SchemaFactory.createForClass(MemberRecord);
