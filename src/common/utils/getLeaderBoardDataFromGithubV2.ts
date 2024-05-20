import * as pThrottle from 'p-throttle';
import { z } from 'zod';

// Step 1: Schema and Types
const githubWeekStatesSchema = z.object({
  w: z.number(),
  a: z.number(),
  d: z.number(),
  c: z.number(),
});

const gitHubauthorSchema = z.object({
  login: z.string(),
  id: z.number(),
  node_id: z.string(),
  avatar_url: z.string(),
});

const gitHubContributorStatsSchema = z.array(
  z.object({
    total: z.number(),
    weeks: z.array(githubWeekStatesSchema),
    author: gitHubauthorSchema,
  }),
);

type GithubContributorStats = z.infer<typeof gitHubContributorStatsSchema>;

export type Analytics = {
  members: {
    name: string;
    node_id: string;
    projects_names: {
      url: string;
      name: string;
    }[];
    avatar_url: string;
    score: number;
    stats: {
      additions: number;
      deletions: number;
      commits: number;
    };
  }[];
  since: number;
  until: number;
  stat: 'allTimes' | 'lastMonth' | 'lastWeek';
};

// Step 2: Helper Functions
const calculateTotals = (weeks: GithubContributorStats[number]['weeks']) =>
  weeks.reduce(
    (acc, week) => {
      const stats = {
        additions: week.a + acc.stats.additions,
        deletions: week.d + acc.stats.deletions,
        commits: week.c + acc.stats.commits,
      };
      return {
        score:
          acc.score +
          (stats.additions * 3 + stats.deletions * 2 + stats.commits),
        stats,
      };
    },
    { score: 0, stats: { additions: 0, deletions: 0, commits: 0 } },
  );

const fetchRepoData = async (owner: string, repo: string) => {
  const url = `https://api.github.com/repos/${owner}/${repo}/stats/contributors`;
  // This log is for debugging purposes only
  console.log(`Fetching data for ${owner}/${repo}`, url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch data for ${owner}/${repo}, ${response.status}`,
    );
  }
  const json = await response.json();
  return { owner, repo, json };
};

// Step 3: Error Handling and Data Processing
const processRepoDataAllTimes = (
  data: { owner: string; repo: string; json: GithubContributorStats },
  acc: Map<string, Analytics['members'][number]>,
): Map<string, Analytics['members'][number]> => {
  data.json.forEach((contributor) => {
    const { author, weeks } = contributor;
    const { score, stats } = calculateTotals(weeks);

    const member = {
      name: author.login,
      node_id: author.node_id,
      projects_names: [{ url: `${data.owner}/${data.repo}`, name: data.repo }],
      avatar_url: author.avatar_url,
      score,
      stats,
    };

    if (!acc.has(member.node_id)) {
      acc.set(member.node_id, member);
    } else {
      const existing = acc.get(member.node_id)!;
      acc.set(member.node_id, {
        ...existing,
        score: existing.score + member.score,
        stats: {
          additions: existing.stats.additions + member.stats.additions,
          deletions: existing.stats.deletions + member.stats.deletions,
          commits: existing.stats.commits + member.stats.commits,
        },
        projects_names: [...existing.projects_names, ...member.projects_names],
      });
    }
  });

  return acc;
};

const processRepoDataWeekly = (
  data: { owner: string; repo: string; json: GithubContributorStats },
  acc: Map<string, Analytics['members'][number]>,
): Map<string, Analytics['members'][number]> => {
  data.json.forEach((contributor) => {
    const { author, weeks } = contributor;
    const { score, stats } = calculateTotals(weeks.slice(-1));

    const member = {
      name: author.login,
      node_id: author.node_id,
      projects_names: [{ url: `${data.owner}/${data.repo}`, name: data.repo }],
      avatar_url: author.avatar_url,
      score,
      stats,
    };

    if (!acc.has(member.node_id)) {
      acc.set(member.node_id, member);
    } else {
      const existing = acc.get(member.node_id)!;
      acc.set(member.node_id, {
        ...existing,
        score: existing.score + member.score,
        stats: {
          additions: existing.stats.additions + member.stats.additions,
          deletions: existing.stats.deletions + member.stats.deletions,
          commits: existing.stats.commits + member.stats.commits,
        },
        projects_names: [...existing.projects_names, ...member.projects_names],
      });
    }
  });

  return acc;
};

const processRepoDataMonthly = (
  data: { owner: string; repo: string; json: GithubContributorStats },
  acc: Map<string, Analytics['members'][number]>,
): Map<string, Analytics['members'][number]> => {
  data.json.forEach((contributor) => {
    const { author, weeks } = contributor;
    const { score, stats } = calculateTotals(weeks.slice(-4));

    const member = {
      name: author.login,
      node_id: author.node_id,
      projects_names: [{ url: `${data.owner}/${data.repo}`, name: data.repo }],
      avatar_url: author.avatar_url,
      score,
      stats,
    };

    if (!acc.has(member.node_id)) {
      acc.set(member.node_id, member);
    } else {
      const existing = acc.get(member.node_id)!;
      acc.set(member.node_id, {
        ...existing,
        score: existing.score + member.score,
        stats: {
          additions: existing.stats.additions + member.stats.additions,
          deletions: existing.stats.deletions + member.stats.deletions,
          commits: existing.stats.commits + member.stats.commits,
        },
        projects_names: [...existing.projects_names, ...member.projects_names],
      });
    }
  });

  return acc;
};

// Step 4: Optimization and Leaderboard Construction
const normalizeScores = (members: Analytics['members']) => {
  const maxScore = Math.max(...members.map((m) => m.score));
  return members.map((m) => ({
    ...m,
    score: (m.score / maxScore) * 100, // Normalize the score to a percentage so it's easier to compare
  }));
};

const fetchAndThrottle = async (repos: { owner: string; repo: string }[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const throttle4 = (pThrottle as any)({
    limit: 60,
    interval: 1000 * 60 * 60, // 10 requests per hour
    onDelay: () => {
      console.log('Reached interval limit, call is delayed');
    },
  });

  const throttledFetchRepoData = throttle4((owner: string, repo: string) =>
    fetchRepoData(owner, repo),
  );

  const results = await Promise.allSettled(
    repos.map(
      ({ owner, repo }) =>
        throttledFetchRepoData(owner, repo) as unknown as ReturnType<
          typeof fetchRepoData
        >,
    ),
  );

  return results;
};

const sortLeaderboard = (members: Analytics['members']) =>
  members.sort((a, b) => b.score - a.score);

// Step 5: Implementing the Builder Pattern
class LeaderboardBuilder {
  private leaderboard: Map<string, Analytics['members'][number]> = new Map();
  private leaderboardWeekly: Map<string, Analytics['members'][number]> =
    new Map();
  private leaderboardMonthly: Map<string, Analytics['members'][number]> =
    new Map();
  private sinceAllTimes = [] as number[];
  private untilAllTimes = [] as number[];
  private sinceMonthly = [] as number[];
  private untilMonthly = [] as number[];
  private sinceWeekly = [] as number[];
  private untilWeekly = [] as number[];

  async processRepos(repos: { owner: string; repo: string }[]) {
    const results = await fetchAndThrottle(repos);

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const parsedData = gitHubContributorStatsSchema.safeParse(
          result.value.json,
        );
        if (!parsedData.success) return;
        const value = {
          owner: result.value.owner,
          repo: result.value.repo,
          json: parsedData.data,
        };

        this.leaderboard = processRepoDataAllTimes(value, this.leaderboard);
        this.leaderboardWeekly = processRepoDataWeekly(
          value,
          this.leaderboardWeekly,
        );
        this.leaderboardMonthly = processRepoDataMonthly(
          value,
          this.leaderboardMonthly,
        );

        // Ensure all contributors have at least one week
        const validContributors = value.json.filter((c) => c.weeks.length > 0);

        // Step 2: Update sinceAllTimes and untilAllTimes
        if (validContributors.length > 0) {
          this.sinceAllTimes = this.sinceAllTimes.concat(
            validContributors.map((c) => Math.min(...c.weeks.map((w) => w.w))),
          );
          this.untilAllTimes = this.untilAllTimes.concat(
            validContributors.map((c) => Math.max(...c.weeks.map((w) => w.w))),
          );
        }

        // Ensure all contributors have at least four weeks for monthly calculations
        const validMonthlyContributors = value.json.filter(
          (c) => c.weeks.length >= 4,
        );

        if (validMonthlyContributors.length > 0) {
          this.sinceMonthly = this.sinceMonthly.concat(
            validMonthlyContributors.map((c) =>
              Math.min(...c.weeks.slice(-4).map((w) => w.w)),
            ),
          );
          this.untilMonthly = this.untilMonthly.concat(
            validMonthlyContributors.map((c) =>
              Math.max(...c.weeks.slice(-4).map((w) => w.w)),
            ),
          );
        }

        // Ensure all contributors have at least one week for weekly calculations
        if (validContributors.length > 0) {
          this.sinceWeekly = this.sinceWeekly.concat(
            validContributors.map((c) =>
              Math.min(...c.weeks.slice(-1).map((w) => w.w)),
            ),
          );
        }
      } else {
        console.error('Error fetching data:', result.reason);
      }
    });

    return this;
  }

  normalizeAndSort() {
    const arrayLeaderboard = normalizeScores(
      Array.from(this.leaderboard.values()),
    );
    const arrayLeaderboardWeekly = normalizeScores(
      Array.from(this.leaderboardWeekly.values()),
    );
    const arrayLeaderboardMonthly = normalizeScores(
      Array.from(this.leaderboardMonthly.values()),
    );
    return [
      sortLeaderboard(arrayLeaderboard),
      sortLeaderboard(arrayLeaderboardWeekly),
      sortLeaderboard(arrayLeaderboardMonthly),
    ];
  }

  build(): Analytics[] {
    const [sortedLeaderboard, arrayLeaderboardWeekly, arrayLeaderboardMonthly] =
      this.normalizeAndSort(); // all times leaderboard

    const since = Math.min(...this.sinceAllTimes) * 1000;
    const until = Math.max(...this.untilAllTimes) * 1000;
    const sinceMonthly = Math.min(...this.sinceMonthly) * 1000;
    const untilMonthly = Math.max(...this.untilMonthly) * 1000;
    const sinceWeekly = Math.min(...this.sinceWeekly) * 1000;
    const untilWeekly = Math.max(...this.untilWeekly) * 1000;

    return [
      { members: sortedLeaderboard, since, until, stat: 'allTimes' },
      {
        members: arrayLeaderboardMonthly,
        since: sinceMonthly,
        until: untilMonthly,
        stat: 'lastMonth',
      },
      {
        members: arrayLeaderboardWeekly,
        since: sinceWeekly,
        until: untilWeekly,
        stat: 'lastWeek',
      },
    ];
  }
}

// Step 6: Functional Programming and Final Function
interface Repo {
  owner: string;
  repo: string;
}

async function getLeaderboardDataFromGithub(
  repos: Repo[],
): Promise<Analytics[]> {
  const builder = new LeaderboardBuilder();
  await builder.processRepos(repos);
  return builder.build();
}

export default getLeaderboardDataFromGithub;
