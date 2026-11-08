import { request } from './helpers';

const register = (email: string) =>
  request.post('/api/v1/auth/register').send({ name: 'Case', email, password: 'password123' });

describe('Email addresses are case-insensitive', () => {
  it('stores the email lower-cased and trimmed', async () => {
    const res = await register('  Mixed.Case@Example.COM ');

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('mixed.case@example.com');
  });

  it('rejects registering the same address in different case with 409', async () => {
    await register('someone@example.com');

    const res = await register('SOMEONE@EXAMPLE.COM');

    expect(res.status).toBe(409);
  });

  it('logs in whatever casing the user types', async () => {
    await register('login.case@example.com');

    const res = await request
      .post('/api/v1/auth/login')
      .send({ email: 'Login.Case@EXAMPLE.com', password: 'password123' });

    expect(res.status).toBe(200);
  });
});
