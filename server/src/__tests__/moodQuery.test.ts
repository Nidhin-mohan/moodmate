import { request, createAuthenticatedUser, createAdminUser, validMoodLog } from './helpers';
import MoodLog from '../models/moodLogModel';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

// The error handler turns ZodErrors into { errors: [{ field, message }] }.
const expectFieldError = (
  res: { status: number; body: { errors?: { field: string }[] } },
  field: string,
) => {
  expect(res.status).toBe(400);
  expect(res.body.errors?.map((e) => e.field)).toContain(field);
};

describe('GET /api/v1/mood query validation', () => {
  it.each([
    ['page=-1', 'page'],
    ['page=0', 'page'],
    ['limit=0', 'limit'],
    ['limit=-5', 'limit'],
    ['limit=101', 'limit'],
    ['limit=1000000', 'limit'],
    ['startDate=garbage', 'startDate'],
    ['endDate=garbage', 'endDate'],
    ['mood[$ne]=x', 'mood'],
  ])('rejects %s with a 400 naming the "%s" field', async (qs, field) => {
    const { token } = await createAuthenticatedUser();

    const res = await request.get(`/api/v1/mood?${qs}`).set(auth(token));

    expectFieldError(res, field);
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
    'rejects %s with a 400 naming the "days" field',
    async (qs) => {
      const { token } = await createAuthenticatedUser();

      const res = await request.get(`/api/v1/mood/stats?${qs}`).set(auth(token));

      expectFieldError(res, 'days');
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
  it.each([['proSinceFrom'], ['proSinceTo']])(
    'rejects an invalid %s date with a 400 naming the field',
    async (field) => {
      const admin = await createAdminUser();

      const res = await request.get(`/api/v1/admin/users?${field}=notadate`).set(auth(admin.token));

      expectFieldError(res, field);
    },
  );
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

  it('leaves future logs that already exist out of the list, even with a later endDate', async () => {
    const { token, userId } = await createAuthenticatedUser();
    await request.post('/api/v1/mood').set(auth(token)).send(validMoodLog);
    await MoodLog.create({ ...validMoodLog, user: userId, date: new Date('2999-01-01') });

    const all = await request.get('/api/v1/mood').set(auth(token));
    const fromToday = await request
      .get(`/api/v1/mood?startDate=${new Date(Date.now() - 60_000).toISOString()}`)
      .set(auth(token));
    const wideEnd = await request.get('/api/v1/mood?endDate=3000-01-01').set(auth(token));

    expect(all.body.total).toBe(1);
    expect(fromToday.body.total).toBe(1);
    expect(wideEnd.body.total).toBe(1);
  });
});

describe('GET /api/v1/mood mood filter', () => {
  it('matches the mood case-insensitively, so legacy lower-case logs are found', async () => {
    const { token, userId } = await createAuthenticatedUser();
    await MoodLog.create({ user: userId, mood: 'happy', date: new Date() });
    await MoodLog.create({ user: userId, mood: 'Happy', date: new Date() });
    await MoodLog.create({ user: userId, mood: 'Sad', date: new Date() });

    const res = await request.get('/api/v1/mood?mood=HAPPY').set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
  });

  it('matches the whole mood literally, not as a pattern or a prefix', async () => {
    const { token, userId } = await createAuthenticatedUser();
    await MoodLog.create({ user: userId, mood: 'Happy', date: new Date() });

    const pattern = await request.get('/api/v1/mood?mood=.*').set(auth(token));
    const prefix = await request.get('/api/v1/mood?mood=Hap').set(auth(token));
    const paren = await request.get('/api/v1/mood?mood=(').set(auth(token));

    expect(pattern.body.total).toBe(0);
    expect(prefix.body.total).toBe(0);
    expect(paren.status).toBe(200);
    expect(paren.body.total).toBe(0);
  });
});
