import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

const PASSWORD_RULES = {
  minLength: 8,
  // Require upper, lower, digit
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
} as const;

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

export function validatePasswordStrength(password: string): string[] {
  const errors: string[] = [];

  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Must be at least ${PASSWORD_RULES.minLength} characters`);
  }

  if (!PASSWORD_RULES.pattern.test(password)) {
    errors.push('Must contain at least one uppercase letter, one lowercase letter, and one number');
  }

  return errors;
}
