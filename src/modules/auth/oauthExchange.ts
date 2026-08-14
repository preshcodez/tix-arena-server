import crypto from "crypto";

interface ExchangeEntry {
  userId: string;
  expiresAt: number;
}

const exchangeStore = new Map<string, ExchangeEntry>();

export function createExchangeCode(userId: string): string {
  const code = crypto.randomUUID();
  exchangeStore.set(code, { userId, expiresAt: Date.now() + 60 * 1000 });
  return code;
}

export function consumeExchangeCode(code: string): string | null {
  const entry = exchangeStore.get(code);
  if (!entry) return null;

  exchangeStore.delete(code);
  if (Date.now() > entry.expiresAt) return null;

  return entry.userId;
}
