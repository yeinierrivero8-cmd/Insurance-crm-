# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: insuraflow.spec.ts >> Suite 6: Data Isolation >> 6.3: Search does not leak data across users
- Location: e2e\insuraflow.spec.ts:547:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="email"]')

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - heading "Insurance CRM" [level=1] [ref=e11]
      - paragraph [ref=e12]: CRM para Agentes de Seguros
    - generic [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]: Clientes y prospectos
        - generic [ref=e22]: Renovaciones automáticas
        - generic [ref=e26]: Pólizas y comisiones
        - generic [ref=e32]: Reportes y crecimiento
      - button "Iniciar sesión" [ref=e36] [cursor=pointer]
      - button "Crear cuenta" [ref=e37] [cursor=pointer]
      - generic [ref=e38]:
        - button "🇪🇸 Español" [ref=e39] [cursor=pointer]
        - button "🇺🇸 English" [ref=e41] [cursor=pointer]
  - generic [ref=e42]:
    - text: INSURAFLOW CRM
    - generic [ref=e46]: Premium mobile-first UI · Demo visual
```

# Test source

```ts
  1  | /**
  2  |  * Authentication Helpers
  3  |  * Login, logout, session persistence
  4  |  */
  5  | 
  6  | import { Page } from '@playwright/test';
  7  | import { CONFIG } from '../config';
  8  | 
  9  | export async function login(page: Page, email: string, password: string): Promise<void> {
  10 |   await page.goto(`${CONFIG.BASE_URL}/login`);
> 11 |   await page.fill('input[type="email"]', email);
     |              ^ Error: page.fill: Test timeout of 30000ms exceeded.
  12 |   await page.fill('input[type="password"]', password);
  13 |   await page.click('button[type="submit"]');
  14 |   // Wait for redirect to dashboard
  15 |   await page.waitForURL(`${CONFIG.BASE_URL}/dashboard`, { timeout: CONFIG.PAGE_LOAD_TIMEOUT });
  16 | }
  17 | 
  18 | export async function logout(page: Page): Promise<void> {
  19 |   // Click user menu or logout button (adjust selector based on your UI)
  20 |   await page.click('[data-testid="user-menu"]');
  21 |   await page.click('[data-testid="logout-btn"]');
  22 |   // Wait for redirect to login
  23 |   await page.waitForURL(`${CONFIG.BASE_URL}/login`, { timeout: CONFIG.PAGE_LOAD_TIMEOUT });
  24 | }
  25 | 
  26 | export async function getCurrentUser(page: Page): Promise<any> {
  27 |   // Retrieve user data from localStorage
  28 |   const userJson = await page.evaluate(() => localStorage.getItem('user'));
  29 |   return userJson ? JSON.parse(userJson) : null;
  30 | }
  31 | 
  32 | export async function getTokens(page: Page): Promise<{ accessToken?: string; refreshToken?: string }> {
  33 |   const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
  34 |   const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));
  35 |   return { accessToken: accessToken || undefined, refreshToken: refreshToken || undefined };
  36 | }
  37 | 
  38 | export async function waitForTokenRefresh(page: Page, maxWaitTime: number = 10000): Promise<string> {
  39 |   // Poll for new accessToken in localStorage
  40 |   const startTime = Date.now();
  41 |   while (Date.now() - startTime < maxWaitTime) {
  42 |     const token = await page.evaluate(() => localStorage.getItem('accessToken'));
  43 |     if (token) return token;
  44 |     await page.waitForTimeout(100);
  45 |   }
  46 |   throw new Error('Token refresh timeout');
  47 | }
  48 | 
  49 | export async function setExpiredToken(page: Page): Promise<void> {
  50 |   // Set an expired JWT token for testing expiry scenarios
  51 |   const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzQ0MjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  52 |   await page.evaluate((token) => {
  53 |     localStorage.setItem('accessToken', token);
  54 |   }, expiredToken);
  55 | }
  56 | 
  57 | export async function clearStorage(page: Page): Promise<void> {
  58 |   // Clear localStorage and sessionStorage
  59 |   await page.evaluate(() => {
  60 |     localStorage.clear();
  61 |     sessionStorage.clear();
  62 |   });
  63 | }
  64 | 
  65 | export async function isLoggedIn(page: Page): Promise<boolean> {
  66 |   const token = await page.evaluate(() => localStorage.getItem('accessToken'));
  67 |   return !!token;
  68 | }
  69 | 
```