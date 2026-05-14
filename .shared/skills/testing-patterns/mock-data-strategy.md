# Mock Data Strategy

---

## Factory Pattern

Factories create consistent, realistic test data with sensible defaults.

```typescript
// tests/factories/user.factory.ts
import { faker } from '@faker-js/faker';
import type { User } from '@prisma/client';

export function buildUser(overrides: Partial<User> = {}): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    email: faker.internet.email().toLowerCase(),
    name: faker.person.fullName(),
    passwordHash: '$2b$10$fakehash', // don't run bcrypt in factories
    active: true,
    role: 'USER',
    ...overrides,
  };
}

// Persist to DB
export async function createUser(overrides: Partial<User> = {}) {
  return prisma.user.create({ data: buildUser(overrides) });
}

// Create many
export async function createUsers(count: number, overrides: Partial<User> = {}) {
  return Promise.all(Array.from({ length: count }, () => createUser(overrides)));
}
```

---

## Faker.js Integration

```typescript
// Install: npm install --save-dev @faker-js/faker

import { faker } from '@faker-js/faker';

// Seed faker for reproducible tests
faker.seed(12345);

// Common usage
faker.internet.email()          // 'john@example.com'
faker.person.fullName()         // 'John Doe'
faker.string.uuid()             // 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
faker.date.past()               // Date object in the past
faker.number.int({ min: 1, max: 100 })
faker.lorem.paragraph()
faker.internet.url()
faker.phone.number()
```

---

## Test Fixtures (Static Data)

For data that must match specific conditions (IDs, relations):

```typescript
// tests/fixtures/users.ts
export const fixtures = {
  adminUser: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'ADMIN' as const,
  },
  regularUser: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'user@test.com',
    name: 'Regular User',
    role: 'USER' as const,
  },
} as const;
```

---

## Data Cleanup Patterns

### Tracked cleanup (safest — won't delete unrelated data)
```typescript
const createdIds: string[] = [];

async function createTrackedUser(data = {}) {
  const user = await createUser(data);
  createdIds.push(user.id);
  return user;
}

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: createdIds } } });
});
```

### Prefix-based cleanup (simple for isolated test environments)
```typescript
const TEST_PREFIX = `test-${Date.now()}-`;

// Create with prefix
await createUser({ email: `${TEST_PREFIX}alice@test.com` });

// Clean up all prefixed records
afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: 'test-' } } });
});
```

### Full truncate (fastest, only safe in dedicated test DB)
```typescript
beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE users, posts RESTART IDENTITY CASCADE`;
});
```

---

## Best Practices

- Always seed before the test that needs data, not globally for the whole suite.
- Use factories for test data generation, not hardcoded literals.
- Keep fixture IDs deterministic (fixed UUIDs) when testing relations.
- Seed faker with a fixed value for reproducible snapshots/screenshots.
- Never share mutable test data between `it()` blocks — create fresh data per test.
