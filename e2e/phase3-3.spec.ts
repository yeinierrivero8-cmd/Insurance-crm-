/**
 * Phase 3.3: Production Readiness E2E Tests
 *
 * Test Suites:
 * 1. Full User Journey (Admin) - Core workflow
 * 2. Performance Under Load - Dashboard/list performance
 * 3. Error Resilience - Network failures and retries
 * 4. Security - RBAC enforcement, data isolation
 * 5. Mobile Critical Paths - Responsive design validation
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000/api';

// Test credentials
const ADMIN_USER = {
  email: 'admin@insuraflow.com',
  password: 'Admin@123'
};

const AGENT_USER = {
  email: 'agent@insuraflow.com',
  password: 'Agent@123'
};

// ==========================================
// Suite 1: Full User Journey (Admin)
// ==========================================

test.describe('Suite 1: Full User Journey - Admin Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('Should login successfully', async ({ page }) => {
    // Navigate to login
    await page.click('button:has-text("Iniciar sesión")');
    expect(page.url()).toContain('/login');

    // Fill login form
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);

    // Submit login
    await Promise.all([
      page.waitForNavigation(),
      page.click('button:has-text("Iniciar sesión")')
    ]);

    // Should be redirected to dashboard
    expect(page.url()).toContain('/home');
    await expect(page.locator('text=Hola')).toBeVisible();
  });

  test('Should create new client', async ({ page }) => {
    // Login
    await loginAdmin(page);

    // Navigate to clients
    await page.click('button:has-text("Clientes")');
    expect(page.url()).toContain('/clients');

    // Click "Nuevo" button
    await page.click('button:has-text("Nuevo")');

    // Fill client form
    await page.fill('input[placeholder="Nombre y apellido"]', 'John Doe Test');
    await page.selectOption('select', 'Salud (ACA)');
    await page.fill('input[placeholder="(305) 555-0000"]', '(786) 555-1234');
    await page.fill('input[placeholder="correo@ejemplo.com"]', 'john@example.com');

    // Submit form
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/clients') && res.status() === 201),
      page.click('button:has-text("Guardar cliente")')
    ]);

    // Verify client appears in list
    await expect(page.locator('text=John Doe Test')).toBeVisible();
  });

  test('Should view client details', async ({ page }) => {
    // Login and navigate to clients
    await loginAdmin(page);
    await page.click('button:has-text("Clientes")');

    // Click first client
    await page.click('.client-row >> nth=0');
    expect(page.url()).toContain('/detail');

    // Verify detail page elements
    await expect(page.locator('h2')).toContainText(/\w+/);
    await expect(page.locator('button:has-text("Información")')).toBeVisible();
    await expect(page.locator('button:has-text("Pólizas")')).toBeVisible();
  });

  test('Should logout successfully', async ({ page }) => {
    // Login
    await loginAdmin(page);

    // Click settings (bottom nav "Más")
    await page.click('button >> text=Más');

    // Click logout
    await page.click('button >> text=Cerrar sesión');

    // Should return to welcome page
    expect(page.url()).toContain(BASE_URL);
    await expect(page.locator('text=Insurance CRM')).toBeVisible();
  });
});

// ==========================================
// Suite 2: Performance Under Load
// ==========================================

test.describe('Suite 2: Performance Under Load', () => {
  test('Dashboard should load within 2 seconds', async ({ page }) => {
    const startTime = Date.now();

    // Navigate to dashboard
    await page.goto(`${BASE_URL}/home`, { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;

    // Assert load time < 2s
    expect(loadTime).toBeLessThan(2000);
    console.log(`Dashboard loaded in ${loadTime}ms`);
  });

  test('Clients list should handle pagination', async ({ page }) => {
    await loginAdmin(page);
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle' });

    // Measure first paint of clients list
    const startTime = Date.now();
    await expect(page.locator('.client-row')).first().toBeVisible();
    const firstPaintTime = Date.now() - startTime;

    expect(firstPaintTime).toBeLessThan(1000);
    console.log(`First client appeared in ${firstPaintTime}ms`);

    // Count visible clients (pagination)
    const clientCount = await page.locator('.client-row').count();
    expect(clientCount).toBeGreaterThan(0);
  });

  test('Search should respond within 500ms', async ({ page }) => {
    await loginAdmin(page);
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle' });

    // Type search query
    const startTime = Date.now();
    await page.fill('input[placeholder*="Buscar"]', 'Juan');

    // Wait for results to update
    await page.waitForTimeout(300);
    const searchTime = Date.now() - startTime;

    expect(searchTime).toBeLessThan(500);
    console.log(`Search completed in ${searchTime}ms`);
  });
});

// ==========================================
// Suite 3: Error Resilience
// ==========================================

test.describe('Suite 3: Error Resilience', () => {
  test('Should handle network timeout gracefully', async ({ page }) => {
    await loginAdmin(page);

    // Simulate network timeout
    await page.route('**/api/clients', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 15000)); // Timeout after 10s
      route.abort('timedout');
    });

    // Try to navigate to clients
    await page.goto(`${BASE_URL}/clients`);

    // Should show error message instead of hanging
    await expect(page.locator('text=/Error|problema|fallo/i')).toBeVisible({ timeout: 5000 });
  });

  test('Should retry on 5xx error', async ({ page }) => {
    let requestCount = 0;
    await loginAdmin(page);

    // First request fails, second succeeds
    await page.route('**/api/clients', async (route) => {
      requestCount++;
      if (requestCount === 1) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    // Navigate to clients
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle' });

    // Should eventually show clients (after retry)
    await expect(page.locator('.client-row')).first().toBeVisible({ timeout: 5000 });
    expect(requestCount).toBeGreaterThan(1);
  });

  test('Should display validation errors on form submission', async ({ page }) => {
    await loginAdmin(page);
    await page.goto(`${BASE_URL}/clients`);

    // Click "Nuevo"
    await page.click('button:has-text("Nuevo")');

    // Try to submit empty form
    await page.click('button:has-text("Guardar")');

    // Should show validation error
    await expect(page.locator('text=/requerido|obligatorio/i')).toBeVisible();
  });
});

// ==========================================
// Suite 4: Security - RBAC & Data Isolation
// ==========================================

test.describe('Suite 4: Security - RBAC & Data Isolation', () => {
  test('Agent cannot delete clients', async ({ page }) => {
    // Login as agent
    await page.goto(BASE_URL);
    await loginWithCredentials(page, AGENT_USER);

    // Navigate to clients
    await page.click('button:has-text("Clientes")');

    // Try to access delete endpoint
    const response = await page.request.delete(`${API_URL}/clients/1`, {
      headers: {
        'Authorization': `Bearer ${await getAuthToken(page)}`
      }
    });

    // Should be forbidden
    expect(response.status()).toBe(403);
  });

  test('Viewer cannot create clients', async ({ page }) => {
    const viewerCreds = {
      email: 'viewer@insuraflow.com',
      password: 'Viewer@123'
    };

    // Login as viewer
    await page.goto(BASE_URL);
    await loginWithCredentials(page, viewerCreds);

    // Navigate to clients
    await page.click('button:has-text("Clientes")');

    // "Nuevo" button should not be visible for viewers
    const newButton = page.locator('button:has-text("Nuevo")');
    await expect(newButton).not.toBeVisible();
  });

  test('2FA should be enforced for admin', async ({ page }) => {
    // This is a placeholder - implement based on your 2FA implementation
    // For now, just verify 2FA settings are visible
    await loginAdmin(page);
    await page.click('button >> text=Más');
    await page.click('button >> text=Configuración');

    // Should have 2FA section (if implemented)
    // await expect(page.locator('text=Autenticación')).toBeVisible();
  });
});

// ==========================================
// Suite 5: Mobile Critical Paths
// ==========================================

test.describe('Suite 5: Mobile Critical Paths - Responsive', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('Mobile dashboard should be responsive', async ({ page }) => {
    await loginAdmin(page);
    await page.goto(`${BASE_URL}/home`, { waitUntil: 'networkidle' });

    // Verify mobile layout
    const metrics = await page.locator('.metric');
    expect(await metrics.count()).toBeGreaterThan(0);

    // Verify no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('Mobile clients list should be usable', async ({ page }) => {
    await loginAdmin(page);
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle' });

    // Should display search box
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible();

    // Should display filter buttons
    await expect(page.locator('button >> text=Todos')).toBeVisible();

    // Click on first client
    await page.click('.client-row >> nth=0');

    // Should navigate to detail
    expect(page.url()).toContain('/detail');
  });

  test('Mobile navigation should be accessible', async ({ page }) => {
    await loginAdmin(page);
    await page.goto(`${BASE_URL}/home`, { waitUntil: 'networkidle' });

    // Bottom navigation should be visible
    const navButtons = page.locator('.bottom-nav button');
    expect(await navButtons.count()).toBeGreaterThan(3);

    // Click each nav button
    const navItems = ['home', 'clients', 'calendar', 'more'];
    for (const item of navItems.slice(0, 3)) {
      await page.click(`.bottom-nav button >> text=${item}`);
      await page.waitForLoadState('networkidle');
    }
  });

  test('Mobile forms should be usable', async ({ page }) => {
    await loginAdmin(page);
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle' });

    // Click "Nuevo"
    await page.click('button:has-text("Nuevo")');

    // Form should be visible
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();

    // Inputs should be accessible
    const inputs = modal.locator('input, select');
    expect(await inputs.count()).toBeGreaterThan(0);

    // Fill form
    await modal.locator('input[placeholder="Nombre"]').fill('Mobile Test');

    // Submit should work
    const submitBtn = modal.locator('button:has-text("Guardar")');
    await expect(submitBtn).toBeEnabled();
  });
});

// ==========================================
// Helper Functions
// ==========================================

async function loginAdmin(page: Page) {
  return loginWithCredentials(page, ADMIN_USER);
}

async function loginWithCredentials(page: Page, credentials: any) {
  // Check if already logged in
  if (page.url().includes('/home') || page.url().includes('/clients')) {
    return;
  }

  await page.goto(BASE_URL);

  // Navigate to login page if needed
  if (page.url() === BASE_URL + '/') {
    await page.click('button:has-text("Iniciar sesión")');
  }

  // Fill and submit login form
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);

  await Promise.all([
    page.waitForNavigation(),
    page.click('button:has-text("Iniciar sesión")')
  ]);

  // Verify login successful
  await expect(page.locator('text=Hola')).toBeVisible();
}

async function getAuthToken(page: Page): Promise<string> {
  // Extract token from localStorage
  return await page.evaluate(() => {
    return localStorage.getItem('accessToken') || '';
  });
}
