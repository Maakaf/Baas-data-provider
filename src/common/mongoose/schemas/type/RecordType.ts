import { MemberRecordSchema } from '@/common/mongoose/schemas/records/memberRecord';
import { ProjectRecordSchema } from '../records/projectRecord';
import { MentorRecordSchema } from '../records/mentorRecord';

export const AllowedRecordDocumentSchemas = [
  MemberRecordSchema,
  ProjectRecordSchema,
  MentorRecordSchema,
] as const;

export type RecordDocumentType = (typeof AllowedRecordDocumentSchemas)[number];
