import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { GithubGqlService } from '@/github-gql/github-gql.service';
import { Project, ProjectSchema } from '@/common/mongoose/schemas/project';
import { Language, LanguageSchema } from '@/common/mongoose/schemas/languages';
import { Model } from 'mongoose';
import { IGQLProjectResponse, ProjectPaginationFilter } from '@/types/project';
import { IGithubGQLResponse } from '@/types';
import makeMockProject from '@/../test/mocks/projects';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import {
  TestDbModule,
  closeInMongodConnection,
} from '@/../test/mocks/module/mongo-in-memory';
import {
  ProjectRequest,
  ProjectRequestSchema,
} from '@/common/mongoose/schemas/projectRequest';
import { CreateProjectDto } from '@/common/dto/project';

const mockProject1 = makeMockProject('project1', 'AAAA', ['JavaScript']);
const mockProject2 = makeMockProject('project2', 'BBBB', [
  'CSS',
  'HTML',
  'JavaScript',
]);

const mockProjectsArray = [mockProject1, mockProject2];

const mockGithubGqlService = {
  getProjects: jest.fn(),
};

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectModel: Model<Project>;
  let languageModel: Model<Language>;
  let projectRequestModel: Model<ProjectRequest>;
  const timestamp = new Date();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: GithubGqlService, useValue: mockGithubGqlService },
      ],
      imports: [
        TestDbModule,
        MongooseModule.forFeature([
          { name: 'Project', schema: ProjectSchema },
          { name: 'Language', schema: LanguageSchema },
          { name: 'ProjectRequest', schema: ProjectRequestSchema },
        ]),
        // Include any setup for in-memory MongoDB here
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectModel = module.get<Model<Project>>(getModelToken('Project'));
    languageModel = module.get<Model<Language>>(getModelToken('Language'));
    projectRequestModel = module.get<Model<ProjectRequest>>(
      getModelToken('ProjectRequest'),
    );

    // Mock the GithubGqlService if you don't want to hit the actual GitHub API in tests
    // Reset mocks before each test to clear previous calls and set the specific behavior for getProjects
    mockGithubGqlService.getProjects.mockReset();
    mockGithubGqlService.getProjects.mockImplementation(
      async (): Promise<IGithubGQLResponse<IGQLProjectResponse>[]> => {
        return mockProjectsArray.map((project) => {
          return {
            item: project,
            error: null,
            meta: { link: project.data.repository.url },
          };
        });
      },
    );

    // add languages to the database
    const newLanguages = ['JavaScript', 'CSS', 'HTML'];

    const newLanguageDocument = new languageModel({
      timestamp,
      languages: newLanguages,
    });
    await newLanguageDocument.save();

    // Add projects to the database
    await Promise.all(
      mockProjectsArray.map((project) => {
        const newProjectDocument = new projectModel({
          timestamp,
          item: project.data,
          error: null,
          meta: { link: project.data.repository.url },
        });
        return newProjectDocument.save();
      }),
    );
  });

  afterEach(async () => {
    // Clean up database after each test
    await projectModel.deleteMany({});
    await languageModel.deleteMany({});
    await projectRequestModel.deleteMany({});
  });

  afterAll(async () => {
    await closeInMongodConnection(); // Close the database connection after all tests
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Project fetching and saving', () => {
    it('should fetch projects from GitHub and save them to the database', async () => {
      await projectModel.deleteMany({});
      await service.saveProjects();

      // Verify projects and languages were saved correctly
      const savedProjects = await projectModel.find();
      expect(savedProjects).toHaveLength(2 /*mockProjectsArray.length*/);

      const savedLanguages = await languageModel.findOne();
      if (!savedLanguages?.languages?.length)
        throw new Error('No languages fetched in test');
      // example  [{"__v": 0, "_id": "66003ae19794ec210c3d534a", "languages": ["JavaScript", "CSS", "HTML"], "timestamp": 2024-03-24T14:38:25.869Z}]
      // First, check that the array is not empty
      expect(savedLanguages.languages).not.toHaveLength(0);

      // Then, check that every item in the array is a string
      savedLanguages.languages.forEach((language) => {
        expect(typeof language).toBe('string');
      });

      // Additional assertions as necessary
    });
  });

  describe('getLanguages', () => {
    it('should return the most recent languages document', async () => {
      const languages = await service.getLanguages();

      expect(languages).toBeDefined();
      expect(languages?.languages).toEqual(
        expect.arrayContaining(['JavaScript', 'CSS', 'HTML']),
      );
    });
  });

  describe('getMostrecentDataPaginated', () => {
    it('should return the most recent projects and languages', async () => {
      // Setup mock request for pagination
      const request = {
        page: 1,
        limit: 2,
        filter: ProjectPaginationFilter.ALL,
      };

      const { projects, languages } = await service.getMostrecentDataPaginated(
        request,
      );

      expect(projects).toHaveLength(2);
      expect(languages).toBeDefined();
      expect(languages).toEqual(
        expect.arrayContaining(['JavaScript', 'CSS', 'HTML']),
      );
    });
    it('should return projects based on pagination and filter', async () => {
      // Insert mock projects data in projectModel in beforeEach
      // Setup mock request for pagination and filter

      const foundProjects = await projectModel.find();
      expect(foundProjects).not.toHaveLength(0);

      const request = {
        page: 1,
        limit: 1,
        timestamp, // Use the timestamp from mock data
        filter: ProjectPaginationFilter.RECENTLY_CREATED,
      };

      const projects = await service.getPaginatedProjects(request);

      expect(projects).toHaveLength(1);
      // Additional checks based on filter and pagination logic
    });
  });

  describe('getPaginatedProjects with filter', () => {
    const dateEarliestCreated = new Date('2023-01-02T00:00:00Z');
    const dateLatestCreated = new Date('2023-01-03T00:00:00Z');
    const dateRecentlyUpdated = new Date('2023-01-03T00:00:00Z');
    const dateLatestUpdated = new Date('2023-01-04T00:00:00Z');

    beforeEach(async () => {
      // Reset and populate the database with mock data suitable for testing each filter
      await projectModel.deleteMany({});
      await languageModel.deleteMany({});

      // Insert languages
      const newLanguages = ['JavaScript', 'CSS', 'HTML'];
      const newLanguageDocument = new languageModel({
        timestamp,
        languages: newLanguages,
      });
      await newLanguageDocument.save();

      const mockProjectA = makeMockProject(
        'project1',
        'AAAA',
        ['JavaScript'],
        dateEarliestCreated,
        dateRecentlyUpdated,
        5,
      );
      const mockProjectB = makeMockProject(
        'project2',
        'BBBB',
        ['CSS', 'HTML', 'JavaScript'],
        dateLatestCreated,
        dateLatestUpdated,
        10,
      );

      // Insert projects with varied createdAt, updatedAt, and contributors for testing
      // Note: Adjust the structure as per your actual model and test requirements
      await projectModel.insertMany([
        { item: mockProjectA, timestamp, meta: {} },
        { item: mockProjectB, timestamp, meta: {} },
      ]);
    });

    it('should handle the ALL filter correctly', async () => {
      const request = {
        page: 1,
        limit: 2,
        timestamp,
        filter: ProjectPaginationFilter.ALL,
      };
      const projects = await service.getPaginatedProjects(request);
      expect(projects).toHaveLength(2);
      // Add more specific checks here if necessary
    });

    it('should handle the RECENTLY_CREATED filter correctly', async () => {
      const request = {
        page: 1,
        limit: 2,
        timestamp,
        filter: ProjectPaginationFilter.RECENTLY_CREATED,
      };
      const projects = await service.getPaginatedProjects(request);
      expect(projects).toHaveLength(2);
      // const mappedDatesCreatedAt = projects.map(
      //   (project) => new Date(project.item.data.repository.createdAt),
      // );
      expect(new Date(projects[0].item.data.repository.createdAt)).toEqual(
        dateLatestCreated,
      );
    });

    it('should handle the RECENTLY_UPDATED filter correctly', async () => {
      const request = {
        page: 1,
        limit: 1,
        timestamp,
        filter: ProjectPaginationFilter.RECENTLY_UPDATED,
      };
      const projects = await service.getPaginatedProjects(request);
      expect(projects).toHaveLength(1);
      expect(new Date(projects[0].item.data.repository.updatedAt)).toEqual(
        dateLatestUpdated,
      );
    });

    it('should handle the MOST_CONTRIBUTORS filter correctly', async () => {
      const request = {
        page: 1,
        limit: 1,
        timestamp,
        filter: ProjectPaginationFilter.MOST_CONTROBUTORS,
      };
      const projects = await service.getPaginatedProjects(request);
      expect(projects).toHaveLength(1);
      // Assuming contributorsCount was added in aggregation
      expect(
        projects[0].item.data.repository.contributors.edges.length,
      ).toEqual(10);
    });
  });

  // TODO re work creates here in future from api request
  describe.skip('create', () => {
    it('should create a prolect', async () => {
      const createProjectDto: CreateProjectDto = {
        githubLink: 'https://github.com/Maakaf/Baas-data-provider',
        discordLink: 'aaaa',
      };

      const result = await service.create(createProjectDto);

      expect(result).toEqual(expect.objectContaining(createProjectDto));
      expect(result._id).toBeDefined(); // Ensure _id is defined
    });
  });
});
