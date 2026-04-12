import { scheduleWeeklyAnalysisJob } from './weeklyAnalysis.job';

export function scheduleAllJobs(): void {
  scheduleWeeklyAnalysisJob();
}
