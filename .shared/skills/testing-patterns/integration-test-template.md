# Integration Test Template

---

## Setup: Real Database, No Mocks

Integration tests hit a real (test) PostgreSQL database. Do NOT mock Prisma.

### Test Database Config
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/testdb
```

Set via `.env.test` or CI environment variables.

---

## Full Test File Template

```typescript
// tests/integration/users.test.ts
import request from 'supertest';
import { app } from '../../src/index';
import { prisma } from '../../src/database';

// Seed helpers
async function createTestUser(overrides: Partial<User> = {}) {
  return prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      passwordHash: '$2b$10$hashedpassword', // pre-hashed, skip bcrypt in tests
      ...overrides,
    },
  });
}

describe('Users API', () => {
  let authToken: string;
  let testUser: User;

  beforeAll(async () => {
    // Seed a user and get an auth token once for the suite
    testUser = await createTestUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'testpassword' });
    authToken = res.body.accessToken;
  });

  afterAll(async () => {
    // Clean up all test data
    await prisma.user.deleteMany({ where: { email: { contains: 'test-' } } });
    await prisma.$disconnect();
  });

  describe('GET /api/users/:id', () => {
    it('returns 200 with user data for authenticated request', async () => {
      const res = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        id: testUser.id,
        email: testUser.email,
      });
      // Ensure password hash is never returned
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get(`/api/users/${testUser.id}`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/users', () => {
    it('creates user and returns 201', async () => {
      const input = { email: `new-${Date.now()}@example.com`, name: 'New User', password: 'Password1!' };
      const res = await request(app).post('/api/users').send(input);

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe(input.email);

      // Verify persisted in DB
      const dbUser = await prisma.user.findUnique({ where: { email: input.email } });
      expect(dbUser).not.toBeNull();
    });

    it('returns 409 when email already exists', async () => {
      const res = await request(app).post('/api/users').send({
        email: testUser.email,
        name: 'Duplicate',
        password: 'Password1!',
      });
      expect(res.status).toBe(409);
    });

    it('returns 400 with field errors on invalid input', async () => {
      const res = await request(app).post('/api/users').send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
        ])
      );
    });
  });
});
```

---

## Database Seeding Pattern

```typescript
// tests/helpers/seed.ts
import { prisma } from '../../src/database';

export const seed = {
  async user(overrides = {}) {
    return prisma.user.create({
      data: {
        email: `seed-${Date.now()}-${Math.random()}@test.com`,
        name: 'Seed User',
        passwordHash: 'hash',
        ...overrides,
      },
    });
  },

  async cleanup() {
    // Delete in FK order
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
  },
};
```

---

## Cleanup Between Tests

```typescript
// Option A: afterEach (slower, safest)
afterEach(async () => {
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
});

// Option B: beforeEach truncate (faster for large suites)
beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE posts, users RESTART IDENTITY CASCADE`;
});
```

---

## Error Scenario Testing

```typescript
it('handles DB connection failure gracefully', async () => {
  jest.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce(
    new Error('Connection refused')
  );

  const res = await request(app)
    .get('/api/users/1')
    .set('Authorization', `Bearer ${authToken}`);

  expect(res.status).toBe(500);
  expect(res.body.error.code).toBe('INTERNAL_ERROR');
});
```
