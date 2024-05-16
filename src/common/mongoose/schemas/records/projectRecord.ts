import { IProjectRecord } from '@/types/core-records';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument } from 'mongoose';

export type ProjectRecordDocument = HydratedDocument<ProjectRecord>;

@Schema()
export class ProjectRecord implements IProjectRecord {
  @Prop({ required: true })
  githubLink: string;

  @Prop({ required: true })
  discordLink: string;
}

export const ProjectRecordSchema = SchemaFactory.createForClass(ProjectRecord);
