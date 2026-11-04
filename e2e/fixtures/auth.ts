/**
 * Authentication Helpers
 * Login, logout, session persistence
 */

import { Page } from '@playwright/test';
import { CONFIG } from '../config';

export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto(`${CONFIG.BASE_URL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for redirect to dashboard
  await page.waitForURL(`${CONFIG.BASE_URL}/dashboard`, { timeout: CONFIG.PAGE_LOAD_TIMEOUT });
}

export async function logout(page: Page): Promise<void> {
  // Click user menu or logout button (adjust selector based on your UI)
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-btn"]');
  // Wait for redirect to login
  await page.waitForURL(`${CONFIG.BASE_URL}/login`, { timeout: CONFIG.PAGE_LOAD_TIMEOUT });
}

export async function getCurrentUser(page: Page): Promise<any> {
  // Retrieve user data from localStorage
  const userJson = await page.evaluate(() => localStorage.getItem('user'));
  return userJson ? JSON.parse(userJson) : null;
}

export async function getTokens(page: Page): Promise<{ accessToken?: string; refreshToken?: string }> {
  const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
  const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));
  return { accessToken: accessToken || undefined, refreshToken: refreshToken || undefined };
}

export async function waitForTokenRefresh(page: Page, maxWaitTime: number = 10000): Promise<string> {
  // Poll for new accessToken in localStorage
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitTime) {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    if (token) return token;
    await page.waitForTimeout(100);
  }
  throw new Error('Token refresh timeout');
}

export async function setExpiredToken(page: Page): Promise<void> {
  // Set an expired JWT token for testing expiry scenarios
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzQ0MjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  await page.evaluate((token) => {
    localStorage.setItem('accessToken', token);
  }, expiredToken);
}

export async function clearStorage(page: Page): Promise<void> {
  // Clear localStorage and sessionStorage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function isLoggedIn(page: Page): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('accessToken'));
  return !!token;
}
