import {
  ProjectPaginationFilter,
  ProjectPaginationRequest,
} from '@/types/project';
import { IsEnum, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

// create a DTO for the request body
export class ProjectPaginationRequestBodyDto
  implements ProjectPaginationRequest
{
  constructor(page: number, limit: number, filter: ProjectPaginationFilter) {
    this.page = page;
    this.limit = limit;
    this.filter = filter;
  }

  @IsInt()
  @Min(1)
  page: number;

  @IsInt()
  @Max(200)
  limit: number;

  @IsEnum(ProjectPaginationFilter)
  filter: ProjectPaginationFilter;
}

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  githubLink: string;

  @IsNotEmpty()
  @IsString()
  discordLink: string;
}
