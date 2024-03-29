import { CreateProjectDto } from '@/common/dto/project';
import {
  Language,
  LanguageDocument,
} from '@/common/mongoose/schemas/languages';
import { Project, ProjectDocument } from '@/common/mongoose/schemas/project';
import {
  ProjectRequest,
  ProjectRequestDocument,
} from '@/common/mongoose/schemas/projectRequest';
import { GithubGqlService } from '@/github-gql/github-gql.service';
import { IGithubGQLResponse } from '@/types';
import {
  IGQLProjectResponse,
  ProjectPaginationFilter,
  ProjectPaginationRequest,
} from '@/types/project';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model, PipelineStage } from 'mongoose';
import * as projectJsons from '@/../jsons/projects.json';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProjectsService implements OnModuleInit {
  constructor(
    private readonly githubGqlService: GithubGqlService,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Language.name)
    private readonly languageModel: Model<LanguageDocument>,
    @InjectModel(ProjectRequest.name)
    private readonly projectRequestModel: Model<ProjectRequestDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.handleCron();
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    await this.saveProjects();
  }

  private async getProjectsFromGithub() {
    const projectData = await this.githubGqlService.getProjects();
    const languages = this.buildLanguageUniqueArray(projectData);

    return { projectData, languages, timestamp: new Date() };
  }

  async saveProjects() {
    const { projectData, languages, timestamp } =
      await this.getProjectsFromGithub();
    try {
      await this.saveLanguageToDb(languages, timestamp);

      await Promise.all(
        projectData.map((project) => this.saveProjectToDb(project, timestamp)),
      );
    } catch (error) {
      Logger.error('Error saving data', error);
    }
  }

  private async saveLanguageToDb(languages, timestamp) {
    try {
      const newLanguageDocument = new this.languageModel({
        timestamp,
        languages,
      });

      await newLanguageDocument.save();
    } catch (error) {
      Logger.error(error);
    }
  }

  private async saveProjectToDb(project, timestamp) {
    try {
      const newProjectDocument = new this.projectModel({
        timestamp,
        item: project.item,
        error: project.error,
        meta: { link: project.meta.link },
      });

      await newProjectDocument.save();
    } catch (error) {
      Logger.error(error);
    }
  }

  private buildLanguageUniqueArray(
    projects: IGithubGQLResponse<IGQLProjectResponse>[],
  ): string[] {
    // create a array of unique languages
    const languages = projects.reduce((acc: string[], project) => {
      const languages = project.item?.data?.repository.languages?.edges?.map(
        (edge) => edge.node.name,
      );
      if (!languages) return acc;
      languages.forEach((tag) => {
        acc.push(tag);
      });
      return acc;
    }, []);

    // return a set of unique languages
    return [...new Set(languages)];
  }

  async getMostrecentDataPaginated({
    page,
    limit,
    filter,
  }: ProjectPaginationRequest): Promise<{
    projects: ProjectDocument[];
    timestamp: Date | null;
    pageLanguages: string[];
    total: number;
    languages: string[];
  }> {
    // Query the most recent timestamp from the languages collection
    const languages = await this.getLanguages();

    if (!languages)
      return {
        projects: [],
        timestamp: null,
        total: 0,
        pageLanguages: [],
        languages: [],
      };

    const projects = await this.getPaginatedProjects({
      page,
      limit,
      timestamp: languages?.timestamp,
      filter,
    });

    // get total count of projects
    const totalProjects = await this.projectModel
      .countDocuments({ timestamp: languages.timestamp })
      .exec();

    return {
      projects,
      total: totalProjects,
      languages: languages.languages,
      pageLanguages: this.buildLanguageUniqueArray(projects),
      timestamp: languages.timestamp,
    };
  }

  async getPaginatedProjects({
    page,
    limit,
    timestamp,
    filter,
  }: ProjectPaginationRequest): Promise<ProjectDocument[]> {
    // Handle MOST_CONTRIBUTORS filter with aggregation
    if (filter === ProjectPaginationFilter.MOST_CONTROBUTORS) {
      const aggregationPipeline: PipelineStage[] = [
        // Match stage to filter documents based on the provided timestamp
        { $match: { timestamp: { $eq: timestamp } } },
        // Project the size of the contributors.edges array to a new field
        {
          $addFields: {
            contributorsCount: {
              $size: '$item.data.repository.contributors.edges',
            },
          },
        },
        // Sort by the newly added contributorsCount field
        { $sort: { contributorsCount: -1 } },
        // Apply pagination
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ];

      // Execute the aggregation pipeline for the MOST_CONTRIBUTORS filter
      return await this.projectModel.aggregate(aggregationPipeline).exec();
    } else {
      // Handle other filters with simple query
      let sortCriteria = {};
      switch (filter) {
        case ProjectPaginationFilter.RECENTLY_UPDATED:
          sortCriteria = { 'item.data.repository.updatedAt': -1 };
          break;
        case ProjectPaginationFilter.RECENTLY_CREATED:
          sortCriteria = { 'item.data.repository.createdAt': -1 };
          break;
        case ProjectPaginationFilter.ALL:
        default:
          sortCriteria = { createdAt: -1 }; // Default sorting
          break;
      }

      // Execute a find query for filters other than MOST_CONTRIBUTORS
      return await this.projectModel
        .find(timestamp ? { timestamp: { $eq: timestamp } } : {})
        .sort(sortCriteria)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
    }
  }

  async getLanguages() {
    const languages = await this.languageModel
      .findOne()
      .sort({ timestamp: -1 })
      .limit(1)
      .exec();

    return languages;
  }

  async create(
    createProjectDto: CreateProjectDto,
  ): Promise<ProjectRequestDocument> {
    const createdProjectRequest = new this.projectRequestModel(
      createProjectDto,
    );
    this.updateJson(createdProjectRequest);
    return await createdProjectRequest.save();
  }

  private updateJson(createProjectDto: CreateProjectDto): void {
    projectJsons.push({
      githubLink: createProjectDto.githubLink,
      discordLink: createProjectDto.discordLink,
    });

    fs.writeFileSync(
      path.join(__dirname, '../../../jsons/projects.json'),
      JSON.stringify(projectJsons),
    );
  }
}
