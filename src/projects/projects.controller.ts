import { Body, Controller, Post } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  ProjectPaginationRequestBodyDto,
} from '@/common/dto/project';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('/')
  async getMostRecentDataPaginated(
    @Body() paginationRequest: ProjectPaginationRequestBodyDto,
  ) {
    return this.projectsService.getMostrecentDataPaginated(paginationRequest);
  }

  @Post('/add')
  async create(@Body() createProjectDto: CreateProjectDto) {
    return await this.projectsService.create(createProjectDto);
  }
}
