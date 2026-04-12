import cron from 'node-cron';
import { CRON_SCHEDULES } from '../constants/cronSchedules';
import { logger } from '../utils/logger';
import { userRepository } from '../repositories/userRepository';
import { getWeeklyAnalysis } from '../services/moodAnalysis.service';
import { sendEmail } from '../services/email.service';
import { weeklyAnalysisTemplate } from '../templates/email/weeklyAnalysis';

const JOB_NAME = 'weekly-mood-analysis';

async function run(): Promise<void> {
  const jobLogger = logger.child({ job: JOB_NAME });
  jobLogger.info('Job started');

  const { data: users, total } = await userRepository.findAll({
    filter: { isPro: true },
    select: ['_id', 'name', 'email'],
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
        continue;
      }

      await sendEmail(
        user.email,
        'Your Weekly Mood Analysis 🌿',
        weeklyAnalysisTemplate({ name: user.name, analysis: result.analysis, stats: result.stats }),
      );

      jobLogger.info({ userId, email: user.email, provider: result.provider }, 'Email sent');
      succeeded++;
    } catch (err: unknown) {
      jobLogger.error({ userId, err }, 'Failed');
      failed++;
    }
  }

  jobLogger.info({ succeeded, insufficient, failed }, 'Job finished');
}

export function scheduleWeeklyAnalysisJob(): void {
  cron.schedule(CRON_SCHEDULES.EVERY_SUNDAY_3AM, () => {
    run().catch((err) => logger.error({ job: JOB_NAME, err }, 'Unhandled job error'));
  });

  logger.info({ job: JOB_NAME, schedule: CRON_SCHEDULES.EVERY_SUNDAY_3AM }, 'Cron job registered');
}
