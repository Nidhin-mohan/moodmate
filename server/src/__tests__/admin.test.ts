import { request, createAuthenticatedUser, createAdminUser } from './helpers';
import User from '../models/userModel';

const asAdmin = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('Admin access control', () => {
  it('answers a logged-in non-admin with 403, not 401', async () => {
    const user = await createAuthenticatedUser();

    const res = await request.get('/api/v1/admin/users').set(asAdmin(user.token));

    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('FORBIDDEN');
  });

  it('still answers a missing token with 401', async () => {
    const res = await request.get('/api/v1/admin/users');

    expect(res.status).toBe(401);
  });
});

describe('Admin user list: search and filters', () => {
  const seed = async () => {
    const base = { password: 'password123' };
    await User.create([
      { ...base, name: 'Alice (ops)', email: 'alice@example.com' },
      { ...base, name: 'Bob', email: 'bob@example.com', isPro: true },
      { ...base, name: 'Legacy', email: 'legacy@example.com' },
    ]);
    // Simulate an account created before the isPro field existed.
    await User.collection.updateOne({ email: 'legacy@example.com' }, { $unset: { isPro: '' } });
  };
  const emails = (res: { body: { data: { email: string }[] } }) =>
    res.body.data.map((u) => u.email).sort();

  it('treats regex characters in search literally', async () => {
    const admin = await createAdminUser();
    await seed();

    const paren = await request.get('/api/v1/admin/users?search=(').set(asAdmin(admin.token));
    const dotStar = await request.get('/api/v1/admin/users?search=.*').set(asAdmin(admin.token));

    expect(paren.status).toBe(200);
    expect(emails(paren)).toEqual(['alice@example.com']);
    expect(dotStar.status).toBe(200);
    expect(dotStar.body.data).toHaveLength(0);
  });

  it('rejects an overly long search with 400', async () => {
    const admin = await createAdminUser();

    const res = await request
      .get(`/api/v1/admin/users?search=${'a'.repeat(101)}`)
      .set(asAdmin(admin.token));

    expect(res.status).toBe(400);
  });

  it('isPro=false includes users that have no isPro field', async () => {
    const admin = await createAdminUser();
    await seed();

    const res = await request
      .get('/api/v1/admin/users?isPro=false&search=example.com')
      .set(asAdmin(admin.token));

    expect(emails(res)).toEqual(
      expect.arrayContaining(['alice@example.com', 'legacy@example.com']),
    );
    expect(emails(res)).not.toContain('bob@example.com');
  });
});

describe('Admin self-protection', () => {
  it('rejects an admin changing their own role', async () => {
    const admin = await createAdminUser();

    const res = await request
      .patch(`/api/v1/admin/users/${admin.userId}`)
      .set(asAdmin(admin.token))
      .send({ role: 'user' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/own role/i);
  });

  it('still lets an admin change their own name or Pro status', async () => {
    const admin = await createAdminUser();

    const res = await request
      .patch(`/api/v1/admin/users/${admin.userId}`)
      .set(asAdmin(admin.token))
      .send({ name: 'Renamed Admin', isPro: true, role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Renamed Admin');
    expect(res.body.data.role).toBe('admin');
  });

  it('rejects an admin soft-deleting themselves', async () => {
    const admin = await createAdminUser();

    const res = await request
      .delete(`/api/v1/admin/users/${admin.userId}`)
      .set(asAdmin(admin.token));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/own account/i);
  });

  it('lets an admin demote and delete a different admin', async () => {
    const admin = await createAdminUser();
    const other = await createAdminUser();

    const demote = await request
      .patch(`/api/v1/admin/users/${other.userId}`)
      .set(asAdmin(admin.token))
      .send({ role: 'user' });
    const del = await request
      .delete(`/api/v1/admin/users/${other.userId}`)
      .set(asAdmin(admin.token));

    expect(demote.status).toBe(200);
    expect(demote.body.data.role).toBe('user');
    expect(del.status).toBe(200);
  });

  it('lets an admin change a regular user', async () => {
    const admin = await createAdminUser();
    const user = await createAuthenticatedUser();

    const res = await request
      .patch(`/api/v1/admin/users/${user.userId}`)
      .set(asAdmin(admin.token))
      .send({ role: 'therapist' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('therapist');
  });
});
