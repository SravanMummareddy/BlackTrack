# Unit Test Template

---

## Jest Setup (ts-jest)

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  collectCoverageFrom: ['src/**/*.ts', '!src/types/**'],
  coverageThreshold: { global: { lines: 70 } },
};
```

---

## Unit Test Structure

```typescript
// src/services/user-service.test.ts

import { UserService } from './user-service';
import { prisma } from '../database'; // will be mocked
import { redis } from '../database/redis'; // will be mocked
import { NotFoundError } from '../utils/errors';

// Mock external dependencies
jest.mock('../database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../database/redis', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRedis = redis as jest.Mocked<typeof redis>;

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
    jest.clearAllMocks(); // reset all mock calls between tests
  });

  describe('getUserById', () => {
    it('returns user from cache when available', async () => {
      const cachedUser = { id: '1', email: 'test@example.com', name: 'Test' };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedUser));

      const result = await service.getUserById('1');

      expect(result).toEqual(cachedUser);
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('fetches from DB and caches when cache miss', async () => {
      const dbUser = { id: '1', email: 'test@example.com', name: 'Test' };
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);

      const result = await service.getUserById('1');

      expect(result).toEqual(dbUser);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'user:1',
        expect.any(Number),
        JSON.stringify(dbUser)
      );
    });

    it('throws NotFoundError when user does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserById('999')).rejects.toThrow(NotFoundError);
    });
  });
});
```

---

## Mocking Patterns

### Mock a module's default export
```typescript
jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
```

### Mock a specific method on an instance
```typescript
const mockSendEmail = jest.spyOn(emailService, 'send').mockResolvedValue(undefined);
```

### Mock environment variables
```typescript
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});
afterAll(() => {
  delete process.env.JWT_SECRET;
});
```

### Mock timers
```typescript
jest.useFakeTimers();
jest.setSystemTime(new Date('2024-01-01'));
// ...
jest.useRealTimers();
```

---

## Assertion Examples

```typescript
// Value equality
expect(result).toEqual({ id: '1', name: 'Alice' });

// Partial match
expect(result).toMatchObject({ email: 'alice@example.com' });

// Thrown errors
await expect(fn()).rejects.toThrow('Error message');
await expect(fn()).rejects.toBeInstanceOf(NotFoundError);

// Called with specific args
expect(mockFn).toHaveBeenCalledWith('arg1', expect.objectContaining({ key: 'value' }));
expect(mockFn).toHaveBeenCalledTimes(1);

// Array contains
expect(result).toContainEqual(expect.objectContaining({ id: '1' }));
```
