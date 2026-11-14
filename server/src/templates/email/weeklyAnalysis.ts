import { baseEmail } from './base';
import type { WeeklyStats } from '../../services/moodAnalysis.service';

interface WeeklyAnalysisData {
  name: string;
  analysis: string;
  stats: WeeklyStats;
}

function statsRow(label: string, value: string | number): string {
  return `
  <tr>
    <td style="padding:7px 0;color:#64748b;font-size:14px;">${label}</td>
    <td style="padding:7px 0;font-weight:600;font-size:14px;text-align:right;color:#1e293b;">${value}</td>
  </tr>`;
}

function sleepRow(stats: WeeklyStats): string {
  const { avgSleepHours: hours, avgSleepQuality: quality } = stats;
  if (hours != null && quality != null)
    return statsRow('Sleep', `${hours}h · quality ${quality} / 5`);
  if (hours != null) return statsRow('Sleep', `${hours}h`);
  if (quality != null) return statsRow('Sleep Quality', `${quality} / 5`);
  return '';
}

// Rows appear only for metrics the user actually recorded this week.
function buildStatsRows(stats: WeeklyStats): string {
  return [
    statsRow('Check-ins', `${stats.totalLogs}`),
    stats.avgIntensity != null ? statsRow('Mood Intensity', `${stats.avgIntensity} / 10`) : '',
    stats.avgEnergyLevel != null ? statsRow('Energy Level', `${stats.avgEnergyLevel} / 10`) : '',
    stats.avgStressLevel != null ? statsRow('Stress Level', `${stats.avgStressLevel} / 10`) : '',
    stats.avgAnxietyLevel != null ? statsRow('Anxiety Level', `${stats.avgAnxietyLevel} / 10`) : '',
    sleepRow(stats),
    statsRow('Exercise Days', `${stats.exerciseDays} of ${stats.totalLogs}`),
    stats.avgExerciseMinutes != null
      ? statsRow('Avg Exercise', `${stats.avgExerciseMinutes} min`)
      : '',
  ].join('');
}

function buildAnalysisHtml(analysis: string): string {
  return analysis
    .split(/\n+/)
    .filter(Boolean)
    .map(
      (line) =>
        `<p style="margin:0 0 10px;line-height:1.65;color:#1e293b;font-size:14px;">${line}</p>`,
    )
    .join('');
}

export function weeklyAnalysisTemplate({ name, analysis, stats }: WeeklyAnalysisData): string {
  const body = `
    <!-- Header -->
    <tr><td style="background:linear-gradient(135deg,#0d9488,#6366f1);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
      <p style="margin:0 0 4px;color:#99f6e4;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Weekly Mood Report</p>
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Hi ${name} 👋</h1>
      <p style="margin:8px 0 0;color:#ccfbf1;font-size:14px;">Here's your mood summary for the past 7 days.</p>
    </td></tr>

    <!-- Body -->
    <tr><td style="background:#ffffff;padding:32px 40px;">

      <h2 style="margin:0 0 14px;font-size:15px;font-weight:600;color:#1e293b;">Your Week at a Glance</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;margin-bottom:28px;">
        ${buildStatsRows(stats)}
      </table>

      <h2 style="margin:0 0 14px;font-size:15px;font-weight:600;color:#1e293b;">AI Analysis</h2>
      <div style="background:#f0fdf4;border-left:4px solid #0d9488;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
        ${buildAnalysisHtml(analysis)}
      </div>

      <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
        This analysis is AI-generated and is not a substitute for professional mental health advice.
      </p>

    </td></tr>`;

  return baseEmail(body);
}
