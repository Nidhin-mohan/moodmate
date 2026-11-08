import { request, createAuthenticatedUser, createAdminUser } from './helpers';

const asAdmin = (token: string) => ({ Authorization: `Bearer ${token}` });

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
