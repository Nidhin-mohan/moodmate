import { request, createAuthenticatedUser, createAdminUser, validMoodLog } from './helpers';
import MoodLog from '../models/moodLogModel';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('GET /api/v1/mood query validation', () => {
  it.each([
    ['page=-1'],
    ['page=0'],
    ['limit=0'],
    ['limit=-5'],
    ['limit=101'],
    ['limit=1000000'],
    ['startDate=garbage'],
    ['endDate=garbage'],
    ['mood[$ne]=x'],
  ])('rejects %s with 400', async (qs) => {
    const { token } = await createAuthenticatedUser();

    const res = await request.get(`/api/v1/mood?${qs}`).set(auth(token));

    expect(res.status).toBe(400);
  });

  it('accepts valid page, limit, mood and ISO dates', async () => {
    const { token } = await createAuthenticatedUser();
    await request.post('/api/v1/mood').set(auth(token)).send(validMoodLog);

    const res = await request
      .get('/api/v1/mood?page=1&limit=5&mood=happy&startDate=2020-01-01&endDate=2100-01-01')
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });

  it('still defaults page and limit when they are omitted', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request.get('/api/v1/mood').set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
  });
});

describe('GET /api/v1/mood/stats query validation', () => {
  it.each([['days=-5'], ['days=0'], ['days=366'], ['days=999999999'], ['days=abc']])(
    'rejects %s with 400',
    async (qs) => {
      const { token } = await createAuthenticatedUser();

      const res = await request.get(`/api/v1/mood/stats?${qs}`).set(auth(token));

      expect(res.status).toBe(400);
    },
  );

  it('defaults to 30 days', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request.get('/api/v1/mood/stats').set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.period).toBe('Last 30 days');
  });
});

describe('Admin list query validation', () => {
  it('rejects an invalid proSinceFrom date with 400', async () => {
    const admin = await createAdminUser();

    const res = await request
      .get('/api/v1/admin/users?proSinceFrom=notadate')
      .set(auth(admin.token));

    expect(res.status).toBe(400);
  });
});

describe('Future-dated mood logs', () => {
  const future = () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  it('rejects creating a log dated in the future', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request
      .post('/api/v1/mood')
      .set(auth(token))
      .send({ ...validMoodLog, date: future() });

    expect(res.status).toBe(400);
  });

  it('rejects moving an existing log into the future', async () => {
    const { token } = await createAuthenticatedUser();
    const created = await request.post('/api/v1/mood').set(auth(token)).send(validMoodLog);

    const res = await request
      .put(`/api/v1/mood/${created.body.data._id}`)
      .set(auth(token))
      .send({ date: future() });

    expect(res.status).toBe(400);
  });

  it('still accepts a log dated today or in the past', async () => {
    const { token } = await createAuthenticatedUser();

    const today = await request
      .post('/api/v1/mood')
      .set(auth(token))
      .send({ ...validMoodLog, date: new Date().toISOString() });
    const past = await request
      .post('/api/v1/mood')
      .set(auth(token))
      .send({ ...validMoodLog, date: '2025-06-01' });

    expect(today.status).toBe(201);
    expect(past.status).toBe(201);
  });

  it('leaves future logs that already exist out of the stats', async () => {
    const { token, userId } = await createAuthenticatedUser();
    await request.post('/api/v1/mood').set(auth(token)).send(validMoodLog);
    // Legacy bad data, inserted directly because the API now refuses it.
    await MoodLog.create({ ...validMoodLog, user: userId, date: new Date('2999-01-01') });

    const res = await request.get('/api/v1/mood/stats?days=30').set(auth(token));

    expect(res.body.data.totalLogs).toBe(1);
  });
});
