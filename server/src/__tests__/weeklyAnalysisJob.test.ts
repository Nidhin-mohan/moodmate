import User from '../models/userModel';
import { runWeeklyAnalysisJob } from '../jobs/weeklyAnalysis.job';
import { getWeeklyAnalysis } from '../services/moodAnalysis.service';
import { sendEmail } from '../services/email.service';

// No real AI calls or emails: stub both edges of the job.
jest.mock('../services/moodAnalysis.service', () => ({
  getWeeklyAnalysis: jest.fn(),
}));
jest.mock('../services/email.service', () => ({
  sendEmail: jest.fn(),
}));

const stats = {
  avgIntensity: 5,
  avgEnergyLevel: 5,
  avgStressLevel: null,
  avgAnxietyLevel: null,
  avgSleepHours: 7,
  avgSleepQuality: 3,
  exerciseDays: 1,
  avgExerciseMinutes: null,
  totalLogs: 4,
};

describe('weekly analysis job', () => {
  beforeEach(() => {
    jest.mocked(getWeeklyAnalysis).mockReset().mockResolvedValue({
      status: 'success',
      analysis: 'Nice week',
      stats,
      provider: 'test',
    });
    jest.mocked(sendEmail).mockReset().mockResolvedValue();
  });

  it('emails active Pro users only: not free users, not soft-deleted Pro users', async () => {
    const base = { name: 'U', password: 'password123' };
    await User.create([
      { ...base, email: 'pro@example.com', isPro: true },
      { ...base, email: 'deleted-pro@example.com', isPro: true, isDeleted: true },
      { ...base, email: 'free@example.com' },
    ]);

    await runWeeklyAnalysisJob();

    const recipients = jest.mocked(sendEmail).mock.calls.map(([to]) => to);
    expect(recipients).toEqual(['pro@example.com']);
  });

  it('skips users without enough data', async () => {
    await User.create({
      name: 'U',
      password: 'password123',
      email: 'pro@example.com',
      isPro: true,
    });
    jest.mocked(getWeeklyAnalysis).mockResolvedValue({ status: 'insufficient_data' });

    await runWeeklyAnalysisJob();

    expect(sendEmail).not.toHaveBeenCalled();
  });
});
