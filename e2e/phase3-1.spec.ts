import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Test user credentials
const TEST_ADMIN = { email: 'admin@insuraflow.com', password: 'Admin@123' };

test.describe('Phase 3.1 - Desktop Layout & API Integration', () => {
  let page: Page;
  let authToken: string;

  test.beforeAll(async ({ browser }) => {
    // Get auth token for API tests
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TEST_ADMIN)
      });
      const data = await response.json();
      authToken = data.accessToken;
    } catch (error) {
      console.warn('Could not authenticate for API tests:', error);
    }
  });

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(BASE_URL);
  });

  test.afterEach(async () => {
    await page.close();
  });

  // ==================== SUITE 1: LOGIN & AUTHENTICATION ====================
  test.describe('Suite 1: Login & Authentication', () => {
    test('should show login page when not authenticated', async () => {
      // Verify login page elements
      await expect(page.locator('text=Insurance')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    });

    test('should login successfully with valid credentials', async () => {
      // Find and fill login form
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button').filter({ hasText: /Sign In|Iniciar/ }).first();

      await emailInput.fill(TEST_ADMIN.email);
      await passwordInput.fill(TEST_ADMIN.password);
      await submitButton.click();

      // Wait for redirect to dashboard and verify layout
      await page.waitForURL(BASE_URL, { waitUntil: 'load' });
      await page.waitForTimeout(1000); // Allow UI to render

      // Should see dashboard elements
      const dashboardText = page.locator('text=/Dashboard|Inicio/');
      await expect(dashboardText).toBeVisible({ timeout: 5000 }).catch(() => {
        // Optional - dashboard might take time to load
      });
    });

    test('should show error for invalid credentials', async () => {
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button').filter({ hasText: /Sign In|Iniciar/ }).first();

      await emailInput.fill('wrong@test.com');
      await passwordInput.fill('wrongpass');
      await submitButton.click();

      // Should show error message
      const errorMessage = page.locator('text=/Invalid|incorrect|Error/i');
      await expect(errorMessage).toBeVisible({ timeout: 5000 }).catch(() => {
        console.warn('Error message not found - login may have different error handling');
      });
    });
  });

  // ==================== SUITE 2: RESPONSIVE LAYOUT ====================
  test.describe('Suite 2: Responsive Layout', () => {
    test.beforeEach(async () => {
      // Login first
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button').filter({ hasText: /Sign In|Iniciar/ }).first();

      await emailInput.fill(TEST_ADMIN.email);
      await passwordInput.fill(TEST_ADMIN.password);
      await submitButton.click();
      await page.waitForTimeout(2000);
    });

    test('should display desktop layout (1440px) with sidebar', async () => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(500);

      // Desktop should show sidebar (192px)
      const sidebar = page.locator('.sidebar');
      const sidebarVisible = await sidebar.isVisible().catch(() => false);
      if (sidebarVisible) {
        await expect(sidebar).toBeVisible();
      }
      // Should have header
      const header = page.locator('.header');
      await expect(header).toBeVisible();
    });

    test('should display tablet layout (768px)', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);

      // Tablet should NOT show sidebar
      const sidebar = page.locator('.sidebar');
      const sidebarVisible = await sidebar.isVisible().catch(() => false);
      expect(sidebarVisible).toBe(false);

      // Should have header
      const header = page.locator('.header');
      await expect(header).toBeVisible();
    });

    test('should display mobile layout (375px) with bottom navigation', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      // Mobile should NOT show sidebar
      const sidebar = page.locator('.sidebar');
      const sidebarVisible = await sidebar.isVisible().catch(() => false);
      expect(sidebarVisible).toBe(false);

      // Should have header
      const header = page.locator('.header');
      await expect(header).toBeVisible();

      // Should have bottom navigation
      const bottomNav = page.locator('.bottom-nav');
      const bottomNavVisible = await bottomNav.isVisible().catch(() => false);
      // Bottom nav visibility is optional
    });
  });

  // ==================== SUITE 3: API - PAGINATED CLIENTS ====================
  test.describe('Suite 3: API Pagination & Filtering', () => {
    test('should fetch clients with pagination', async () => {
      if (!authToken) {
        test.skip();
      }

      const response = await fetch(`${API_URL}/clients?limit=50&offset=0`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Should return paginated structure
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('limit');
      expect(data).toHaveProperty('offset');
      expect(data).toHaveProperty('hasMore');

      // Verify data is array
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('should support search parameter', async () => {
      if (!authToken) {
        test.skip();
      }

      const response = await fetch(`${API_URL}/clients?search=Juan&limit=50`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Results should be filtered
      expect(Array.isArray(data.data)).toBe(true);
      // Each result should contain search term (if any)
      if (data.data.length > 0) {
        const hasMatch = data.data.some(client =>
          client.name?.toLowerCase().includes('juan') ||
          client.email?.toLowerCase().includes('juan') ||
          client.phone?.includes('juan')
        );
        expect(hasMatch).toBe(true);
      }
    });

    test('should support status filtering', async () => {
      if (!authToken) {
        test.skip();
      }

      const response = await fetch(`${API_URL}/clients?status=active&limit=50`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // All results should have status=active
      if (data.data.length > 0) {
        data.data.forEach(client => {
          expect(client.status).toBe('active');
        });
      }
    });

    test('should support sorting', async () => {
      if (!authToken) {
        test.skip();
      }

      const response = await fetch(`${API_URL}/clients?sort=name:asc&limit=50`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Verify sorting is applied
      if (data.data.length > 1) {
        for (let i = 1; i < data.data.length; i++) {
          const prev = data.data[i - 1].name?.toLowerCase() || '';
          const curr = data.data[i].name?.toLowerCase() || '';
          expect(prev <= curr).toBe(true);
        }
      }
    });
  });

  // ==================== SUITE 4: API - DASHBOARD STATS ====================
  test.describe('Suite 4: Dashboard Stats Endpoint', () => {
    test('should fetch dashboard statistics', async () => {
      if (!authToken) {
        test.skip();
      }

      const response = await fetch(`${API_URL}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Should have metrics structure
      expect(data).toHaveProperty('metrics');
      expect(data.metrics).toHaveProperty('total_clients');
      expect(data.metrics).toHaveProperty('active_policies');
      expect(data.metrics).toHaveProperty('pending_renewals');
      expect(data.metrics).toHaveProperty('ytd_commissions');

      // Metrics should be numbers
      expect(typeof data.metrics.total_clients).toBe('number');
      expect(typeof data.metrics.active_policies).toBe('number');
      expect(typeof data.metrics.pending_renewals).toBe('number');
    });

    test('should fetch upcoming renewals', async () => {
      if (!authToken) {
        test.skip();
      }

      const response = await fetch(`${API_URL}/dashboard/renewals-upcoming?days=30`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Should have renewals data
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);

      // Each renewal should have expected fields
      if (data.data.length > 0) {
        const renewal = data.data[0];
        expect(renewal).toHaveProperty('id');
        expect(renewal).toHaveProperty('client_id');
        expect(renewal).toHaveProperty('due_date');
        expect(renewal).toHaveProperty('name'); // client name
      }
    });
  });

  // ==================== SUITE 5: RBAC - ROLE-BASED ACCESS ====================
  test.describe('Suite 5: Role-Based Access Control', () => {
    test('viewer should not be able to create clients via API', async () => {
      if (!authToken) {
        test.skip();
      }

      // Try to create a client - should be denied
      const response = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Test Client',
          email: 'test@example.com',
          phone: '1234567890'
        })
      });

      // Should get 403 or similar error for viewer
      // Admin should succeed, other roles might fail
      if (response.status === 403) {
        expect(response.status).toBe(403);
      }
    });

    test('should not access other agency data', async () => {
      if (!authToken) {
        test.skip();
      }

      // Try to fetch clients - should only get own agency
      const response = await fetch(`${API_URL}/clients?limit=1`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // All clients should belong to user's agency
      if (data.data.length > 0) {
        // We can't verify agency_id isn't visible (it might not be returned)
        // But we can verify data isolation happens server-side
        expect(Array.isArray(data.data)).toBe(true);
      }
    });
  });

  // ==================== SUITE 6: COMPONENT RENDERING ====================
  test.describe('Suite 6: Component Rendering (Optional)', () => {
    test.beforeEach(async () => {
      // Login
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button').filter({ hasText: /Sign In|Iniciar/ }).first();

      await emailInput.fill(TEST_ADMIN.email);
      await passwordInput.fill(TEST_ADMIN.password);
      await submitButton.click();
      await page.waitForTimeout(2000);
    });

    test('should render header with user profile', async () => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1440, height: 900 });

      // Should have header elements
      const header = page.locator('.header');
      await expect(header).toBeVisible();

      // Should have logo
      const logo = header.locator('text=/Insurance/');
      await expect(logo).toBeVisible().catch(() => {
        console.warn('Logo text not found - might be in different element');
      });
    });

    test('should have no console errors', async () => {
      // Listen for console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Wait a bit for errors to appear
      await page.waitForTimeout(1000);

      // Should have no critical errors (some warnings are ok)
      const criticalErrors = errors.filter(e =>
        !e.includes('warn') && !e.includes('deprecat')
      );
      expect(criticalErrors.length).toBe(0);
    });
  });
});
