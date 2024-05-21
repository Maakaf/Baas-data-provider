import { AnalyticsDto } from '@/common/dto/leaderboard';
import getLeaderBoardDataFROMJSON from '@/common/utils/getLeaderBoardDataFROMJSON';
import getLeaderboardDataFromGithub from '@/common/utils/getLeaderBoardDataFromGithubV2';
import { ProjectsService } from '@/projects/projects.service';
import { LeaderboardTypeAnalytics } from '@/types/leaderboard';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Leaderboard,
  LeaderboardDocument,
} from '@/common/mongoose/schemas/leaderboard';

@Injectable()
export class LeaderboardService implements OnModuleInit {
  constructor(
    @InjectModel(Leaderboard.name)
    private readonly LeaderboardModel: Model<LeaderboardDocument>,
    private projectsService: ProjectsService,
  ) {}
  async onModuleInit() {
    await this.handleCron();
  }

  @Cron('0 8 * * 0') // Cron expression for 8:00 AM every Sunday
  async handleCron() {
    console.log('Running delete all members cron job');
    await this.deleteLeaderboard();
    console.log('Running fetch and store Contributors cron job');
    await this.fetchAndStoreMembers();
  }

  private async fetchAndStoreMembers() {
    // This function for mocking the data from JSON file
    const data = await this.getLeaderboardDataV2();
    await this.saveFetchedFromGithubContributorToDb(data);
  }

  private async saveFetchedFromGithubContributorToDb(data) {
    try {
      //createOrUpdate member
      //to do - check timestamp in schema
      await this.LeaderboardModel.insertMany(data);
    } catch (error) {
      console.error('Error saving member to db', error);
    }
  }

  private async fethLeaderBoardDataFROMJSON() {
    // TODO: Leaderbaord structure has changed, need to update this method.
    const membersData = getLeaderBoardDataFROMJSON();
    const timestamp = new Date();
    return { membersData, timestamp };
  }

  async getLeaderboardDataV2(): Promise<AnalyticsDto[]> {
    const allProjects = (await this.projectsService.getAllProjectsV2())
      .map((p) => ({
        owner: p.repository.owner?.login ?? '',
        repo: p.repository.name ?? '',
      }))
      .filter((p) => p.owner && p.repo);

    return await getLeaderboardDataFromGithub(allProjects);
  }

  private async deleteLeaderboard() {
    await this.LeaderboardModel.deleteMany({});
  }
  async getLeaderboard(): Promise<AnalyticsDto> {
    // TODO: Implement this method as find all members from the database.
    // Reason: We save only the data we need in the database, so no need to filter the data.
    const leaderboard = await this.LeaderboardModel.find();
    return leaderboard as unknown as LeaderboardTypeAnalytics;
  }
}
