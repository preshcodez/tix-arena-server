import crypto from "crypto";

const exchangeCodes = new Map<
  string,
  {
    userId: string;
    expiresAt: number;
  }
>();

export const createExchangeCode = (userId: string): string => {
  const code = crypto.randomUUID();

  exchangeCodes.set(code, {
    userId,
    expiresAt: Date.now() + 60 * 1000,
  });

  return code;
};

export const consumeExchangeCode = (code: string): string | null => {
  const stored = exchangeCodes.get(code);

  if (!stored) {
    return null;
  }

  exchangeCodes.delete(code);

  if (Date.now() > stored.expiresAt) {
    return null;
  }

  return stored.userId;
};
