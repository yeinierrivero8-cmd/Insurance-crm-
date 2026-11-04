/**
 * Time & Token Expiry Utilities
 * Mock time for testing token expiration scenarios
 */

import { Page } from '@playwright/test';

export async function setMockTime(page: Page, timestamp: number): Promise<void> {
  await page.evaluate((ts) => {
    // Mock Date.now() and Date constructor
    const originalNow = Date.now;
    const originalDateConstructor = Date;

    globalThis.Date.now = () => ts;

    // Also mock the regular Date for compatibility
    const MockDate = class extends Date {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(ts);
        } else {
          super(...args);
        }
      }
      static now() {
        return ts;
      }
      static parse(s: string) {
        return originalDateConstructor.parse(s);
      }
      static UTC(...args: any[]) {
        return originalDateConstructor.UTC(...args);
      }
    };

    Object.defineProperty(MockDate, 'prototype', {
      value: Date.prototype,
    });

    globalThis.Date = MockDate as any;
  }, timestamp);
}

export async function fastForwardTime(page: Page, milliseconds: number): Promise<void> {
  await page.evaluate((ms) => {
    const currentTime = Date.now();
    const newTime = currentTime + ms;
    // Re-set mock time to new value
    globalThis.Date.now = () => newTime;
  }, milliseconds);
}

export async function resetMockTime(page: Page): Promise<void> {
  await page.evaluate(() => {
    delete (globalThis as any).mockTime;
  });
}

export async function getExpirationTime(page: Page, minutes: number = 15): Promise<number> {
  // Returns a timestamp that's `minutes` from now
  return await page.evaluate((mins) => {
    return Date.now() + mins * 60 * 1000;
  }, minutes);
}

export function createExpiredJWT(payload: any = {}): string {
  // Create a JWT with exp in the past
  // Format: header.payload.signature (simplified for testing)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const now = Math.floor(Date.now() / 1000);
  const expiredPayload = {
    sub: '1234567890',
    name: 'Test User',
    iat: now - 3600,
    exp: now - 60, // Expired 1 minute ago
    ...payload,
  };
  const payloadEncoded = Buffer.from(JSON.stringify(expiredPayload)).toString('base64');
  const signature = 'fake_signature';

  return `${header}.${payloadEncoded}.${signature}`;
}

export function createValidJWT(payload: any = {}, expiresInMinutes: number = 15): string {
  // Create a JWT with exp in the future
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const now = Math.floor(Date.now() / 1000);
  const validPayload = {
    sub: '1234567890',
    name: 'Test User',
    iat: now,
    exp: now + expiresInMinutes * 60,
    ...payload,
  };
  const payloadEncoded = Buffer.from(JSON.stringify(validPayload)).toString('base64');
  const signature = 'fake_signature';

  return `${header}.${payloadEncoded}.${signature}`;
}

export async function waitFor(
  condition: () => Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100,
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(`Timeout waiting for condition (${timeout}ms)`);
}
