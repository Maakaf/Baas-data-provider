import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypedConfigModule, dotenvLoader } from 'nest-typed-config';
import { RootConfig, validate } from './config/env.validation';
import { MongooseModule } from '@nestjs/mongoose';
import { MembersModule } from './members/members.module';
import { GithubGqlModule } from './github-gql/github-gql.module';
import { ProjectsModule } from './projects/projects.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { CoreRecordsModule } from './core-records/core-records.module';

@Module({
  imports: [
    TypedConfigModule.forRoot({
      isGlobal: true,
      schema: RootConfig,
      validate,
      load: dotenvLoader({
        envFilePath: '.env.development.local',
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [TypedConfigModule],
      useFactory: async (config: RootConfig) => {
        const connection = config.MONGO_URI;
        // const connection = `mongodb://${config.MONGO_USER}:${config.MONGO_PASS}@${config.MONGO_HOST}:${config.MONGO_PORT}/${config.MONGO_DB}`;
        return {
          connectionFactory: (connection) => {
            if (connection.readyState === 1) {
              Logger.log('Database Connected successfully');
            }
            connection.on('disconnected', () => {
              Logger.log('Database disconnected');
            });
            connection.on('error', (error) => {
              Logger.log('Database connection failed! for error: ', error);
            });

            return connection;
          },
          uri: connection,
        };
      },
      inject: [RootConfig],
    }),
    MembersModule,
    GithubGqlModule,
    ProjectsModule,
    LeaderboardModule,
    CoreRecordsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
