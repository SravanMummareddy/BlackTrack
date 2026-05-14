# Skills Library

Reusable patterns and reference implementations for this project.
Load the relevant skill doc before implementing a feature in that area.

---

## Available Skills

### Data Patterns (`data-patterns/`)

| Skill | File | Use When |
|---|---|---|
| Pagination | `pagination.md` | Building list endpoints; choose offset vs cursor |
| Caching | `caching.md` | Adding Redis cache to services or API responses |
| Rate Limiting | `rate-limiting.md` | Protecting endpoints from abuse |

### API Patterns (`api-patterns/`)

| Skill | File | Use When |
|---|---|---|
| Error Handling | `error-handling.md` | Defining error classes and response shapes |
| Validation | `validation.md` | Validating request input with Zod |
| Authentication | `authentication.md` | Implementing JWT, OAuth2, refresh tokens |

### Database Patterns (`database-patterns/`)

| Skill | File | Use When |
|---|---|---|
| Connection Pooling | `connection-pooling.md` | Configuring Prisma/PG pool settings |
| Transaction Safety | `transaction-safety.md` | Wrapping multi-step DB writes |
| Query Optimization | `query-optimization.md` | Fixing slow queries or N+1 problems |

### Testing Patterns (`testing-patterns/`)

| Skill | File | Use When |
|---|---|---|
| Unit Test Template | `unit-test-template.md` | Writing service/utility unit tests |
| Integration Test Template | `integration-test-template.md` | Testing full API request/response cycles |
| Mock Data Strategy | `mock-data-strategy.md` | Generating test fixtures and factories |

### Deployment (`deployment/`)

| Skill | File | Use When |
|---|---|---|
| Docker Best Practices | `docker-best-practices.md` | Writing or updating Dockerfiles |
| Env Var Strategy | `env-var-strategy.md` | Adding or managing environment variables |
| Health Checks | `health-checks.md` | Implementing `/health` endpoints |

---

## How to Reference in Code

Each skill doc includes ready-to-use code snippets. Copy the relevant snippet into your implementation, then adapt variable names and schema to the project.

Example workflow:
1. You need pagination on `GET /api/posts`
2. Open `data-patterns/pagination.md`
3. Choose cursor-based (preferred for large datasets) or offset (simpler, small sets)
4. Copy the Prisma + route handler snippet
5. Adapt column names and type definitions
