export enum CoreRecordTypeName {
  Member = 'Member',
  Project = 'Project',
  Mentor = 'Mentor',
}

export interface ICoreRecord {
  recordId: string;
  type: CoreRecordTypeName;
  createdAt: Date;
  createdBy: string;
}

export interface IMemberRecord {
  name: string;
  discordUser: string;
  links: {
    github: string;
    linkedIn: string;
  };
  description: string;
}

export interface IProjectRecord {
  githubLink: string;
  discordLink: string;
}

export interface IMentorRecord {
  stud: string;
}
