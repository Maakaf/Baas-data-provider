import { AnalyticsDto } from '@/common/dto/leaderboard';
import getLeaderBoardDataFROMJSON from '@/common/utils/getLeaderBoardDataFROMJSON';
import { LeaderboardTypeAnalytics } from '@/types/leaderboard';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class LeaderboardService implements OnModuleInit {
  async getLeaderboardData(): Promise<AnalyticsDto> {
    const since = '2024-01-05T00:00:00Z';
    const until = '2024-04-12T00:00:00Z';
    return {
      members: getLeaderBoardDataFROMJSON(),
      since,
      until,
    } as LeaderboardTypeAnalytics;
  }

  async onModuleInit(): Promise<void> {
    await this.handleCron();
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    // Implement a delete function to delete old data 6 weeks or older
    await this.saveLeaderboard();
  }

  private async saveLeaderboard() {
    // Implement this
  }
}
