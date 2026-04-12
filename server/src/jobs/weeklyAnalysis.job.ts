import cron from 'node-cron';
import { CRON_SCHEDULES } from '../constants/cronSchedules';
import { logger } from '../utils/logger';
import { userRepository } from '../repositories/userRepository';
import { getWeeklyAnalysis } from '../services/moodAnalysis.service';

const JOB_NAME = 'weekly-mood-analysis';

async function run(): Promise<void> {
  const jobLogger = logger.child({ job: JOB_NAME });
  jobLogger.info('Job started');

  const { data: users, total } = await userRepository.findAll({
    select: ['_id'],
    pagination: { skip: 0, limit: 10_000 },
  });

  jobLogger.info({ totalUsers: total }, 'Processing users');

  let succeeded = 0;
  let insufficient = 0;
  let failed = 0;

  for (const user of users) {
    const userId = user._id.toString();
    try {
      const result = await getWeeklyAnalysis(userId);

      if (result.status === 'insufficient_data') {
        jobLogger.info({ userId }, 'Skipped — insufficient data (< 3 logs)');
        insufficient++;
      } else {
        jobLogger.info(
          { userId, stats: result.stats, provider: result.provider, analysis: result.analysis },
          'Analysis complete',
        );
        succeeded++;
      }
    } catch (err: unknown) {
      jobLogger.error({ userId, err }, 'Failed to generate analysis');
      failed++;
    }
  }

  jobLogger.info({ succeeded, insufficient, failed }, 'Job finished');
}

export function scheduleWeeklyAnalysisJob(): void {
  cron.schedule(CRON_SCHEDULES.EVERY_MINUTE, () => {
    run().catch((err) => logger.error({ job: JOB_NAME, err }, 'Unhandled job error'));
  });

  logger.info({ job: JOB_NAME, schedule: CRON_SCHEDULES.EVERY_MINUTE }, 'Cron job registered');
}
