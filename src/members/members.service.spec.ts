import { Test, type TestingModule } from '@nestjs/testing';
import { MembersService } from './members.service';
import {
  Member,
  type MemberDocument,
  MemberSchema,
} from '../common/mongoose/schemas/member';
import { type Model } from 'mongoose';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import {
  TestDbModule,
  closeInMongodConnection,
} from '../../test/mocks/module/mongo-in-memory';
import { type CreateMemberDto } from '../common/dto/member';
import { GithubGqlService } from '@/github-gql/github-gql.service';

const mockGithubGqlService = {
  getProjects: jest.fn(),
};

describe('MembersService', () => {
  let service: MembersService;
  let memberModel: Model<MemberDocument>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: GithubGqlService, useValue: mockGithubGqlService },
      ],
      imports: [
        TestDbModule,
        MongooseModule.forFeature([
          { name: Member.name, schema: MemberSchema },
        ]),
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
    memberModel = module.get<Model<MemberDocument>>(getModelToken(Member.name));
  });

  afterEach(async () => {
    await memberModel.deleteMany();
    // Clear the database after each test
  });

  afterAll(async () => {
    await closeInMongodConnection(); // Close the database connection after all tests
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // TODO re work creates here in future from api request
  describe.skip('create', () => {
    it('should create a member', async () => {
      const createMemberDto: CreateMemberDto = {
        name: 'John Doe',
        discordUser: 'johndoe#1234',
        links: {
          github: 'https://github.com/johndoe',
          linkedIn: 'https://linkedin.com/in/johndoe',
        },
        description: 'A description',
      };

      const result = await service.create(createMemberDto);

      expect(result).toEqual(expect.objectContaining(createMemberDto));
      expect(result._id).toBeDefined(); // Ensure _id is defined
    });
  });
  // TODO re work creates here in future from api request
  describe.skip('createMany', () => {
    it('should create multiple members', async () => {
      const createMemberDtos: CreateMemberDto[] = [
        {
          name: 'John Doe',
          discordUser: 'johndoe#1234',
          links: {
            github: 'https://github.com/johndoe',
            linkedIn: 'https://linkedin.com/in/johndoe',
          },
          description: 'A description',
        },
        {
          name: 'Jane Doe',
          discordUser: 'janedoe#5678',
          links: {
            github: 'https://github.com/janedoe',
            linkedIn: 'https://linkedin.com/in/janedoe',
          },
          description: 'Another description',
        },
      ];

      const result = await service.createMany(createMemberDtos);

      expect(result.length).toBe(2); // Ensure two members are created

      // Check attributes for each created member
      result.forEach((member, index) => {
        expect(member).toEqual(
          expect.objectContaining(createMemberDtos[index]),
        );
        expect(member._id).toBeDefined(); // Ensure _id is defined
      });
    });
  });
});
