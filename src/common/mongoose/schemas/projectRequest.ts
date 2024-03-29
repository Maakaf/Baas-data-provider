import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument } from 'mongoose';

export type ProjectRequestDocument = HydratedDocument<ProjectRequest>;

@Schema()
export class ProjectRequest {
  // @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true })
  githubLink: string;

  @Prop({ required: true })
  discordLink: string;
}

export const ProjectRequestSchema =
  SchemaFactory.createForClass(ProjectRequest);
