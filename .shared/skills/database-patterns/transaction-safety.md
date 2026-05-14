# Transaction Safety Patterns

---

## ACID Compliance

PostgreSQL is fully ACID-compliant:
- **Atomicity**: all operations succeed or all are rolled back
- **Consistency**: DB constraints are enforced (FK, unique, check)
- **Isolation**: concurrent transactions don't interfere (default: READ COMMITTED)
- **Durability**: committed data survives crashes

---

## When to Use Transactions

Use a transaction when:
- Multiple related rows must be written together (e.g., create order + deduct inventory)
- A failure partway through would leave data inconsistent
- You need to read-then-write and need the read to remain valid

Do NOT:
- Perform HTTP calls, file I/O, or slow operations inside a transaction
- Hold transactions open across user interaction
- Use transactions just for single-row reads

---

## Prisma Transaction Patterns

### 1. Sequential transactions (simple, recommended for most cases)

```typescript
const result = await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({
    data: { userId, total },
  });

  await tx.inventory.update({
    where: { productId },
    data: { quantity: { decrement: quantity } },
  });

  await tx.orderItem.create({
    data: { orderId: order.id, productId, quantity },
  });

  return order;
});
```

If any operation throws, all changes are rolled back automatically.

### 2. Interactive transactions with timeout

```typescript
const result = await prisma.$transaction(
  async (tx) => {
    // Set isolation level for this transaction
    await tx.$executeRaw`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`;

    const account = await tx.account.findUniqueOrThrow({
      where: { id: accountId },
    });

    if (account.balance < amount) {
      throw new Error('Insufficient funds'); // triggers rollback
    }

    return tx.account.update({
      where: { id: accountId },
      data: { balance: { decrement: amount } },
    });
  },
  {
    maxWait: 5000,  // max ms waiting for a connection
    timeout: 10000, // max ms for the transaction to complete
  }
);
```

### 3. Batch operations (no rollback — use when atomicity not required)

```typescript
// Faster but not atomic
const [users, posts] = await prisma.$transaction([
  prisma.user.findMany(),
  prisma.post.findMany(),
]);
```

---

## Rollback Scenarios

Transactions roll back automatically when:
- An exception is thrown inside the callback
- A Prisma operation fails (DB error, constraint violation)
- The `timeout` is exceeded

Explicitly trigger a rollback by throwing:
```typescript
await prisma.$transaction(async (tx) => {
  const result = await tx.payment.create({ data: paymentData });

  if (result.status === 'DECLINED') {
    throw new Error('Payment declined'); // rollback everything
  }
  // ...
});
```

---

## Isolation Levels

| Level | Prevents | Use Case |
|---|---|---|
| READ COMMITTED (default) | Dirty reads | Most operations |
| REPEATABLE READ | Dirty + non-repeatable reads | Reports, analytics |
| SERIALIZABLE | All anomalies | Financial operations |

```typescript
await prisma.$executeRaw`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`;
```

---

## Best Practices

- Keep transactions as short as possible.
- Don't `await` external HTTP calls inside a transaction.
- Use `findUniqueOrThrow` instead of `findUnique` to fail loudly on missing records.
- Validate business rules (balance checks, inventory) inside the transaction, not before.
- Log transaction failures with enough context to debug.
