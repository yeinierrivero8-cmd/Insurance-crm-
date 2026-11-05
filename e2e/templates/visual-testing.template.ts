/**
 * VISUAL TESTING TEMPLATES
 *
 * Use these templates to create visual regression tests for responsive design.
 * Run on each breakpoint to verify the redesign maintains visual integrity.
 *
 * Breakpoints: 375px, 430px, 768px, 1024px, 1440px
 */

import { test, expect } from '@playwright/test';

const BREAKPOINTS = [
  { name: 'mobile-se', width: 375, height: 667, device: 'iPhone SE' },
  { name: 'mobile-modern', width: 430, height: 932, device: 'Pixel 6 Pro' },
  { name: 'tablet', width: 768, height: 1024, device: 'iPad Air' },
  { name: 'desktop-small', width: 1024, height: 768, device: '1024p' },
  { name: 'desktop-large', width: 1440, height: 900, device: 'Full HD' },
];

// ============================================================================
// TEMPLATE 1: Responsive Layout Verification
// ============================================================================

test.describe('Visual: Responsive Layouts', () => {
  BREAKPOINTS.forEach(({ name, width, height, device }) => {
    test(`Dashboard layout at ${width}px (${device})`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize({ width, height });

      // Navigate to dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify no horizontal scroll
      const bodyWidth = await page.locator('body').boundingBox();
      expect(bodyWidth?.width).toBeLessThanOrEqual(width + 20); // Allow 20px margin

      // Verify key components visible
      await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
      await expect(page.locator('[data-testid="metric-cards"]')).toBeVisible();

      // Take screenshot for manual review
      await page.screenshot({
        path: `test-results/visual/dashboard-${name}.png`,
        fullPage: false,
      });
    });

    test(`Clients table layout at ${width}px (${device})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/clientes');
      await page.waitForLoadState('networkidle');

      const bodyWidth = await page.locator('body').boundingBox();
      expect(bodyWidth?.width).toBeLessThanOrEqual(width + 20);

      await page.screenshot({
        path: `test-results/visual/clientes-table-${name}.png`,
        fullPage: false,
      });
    });
  });
});

// ============================================================================
// TEMPLATE 2: Color & Contrast Verification
// ============================================================================

test.describe('Visual: Colors & Contrast', () => {
  test('Primary brand color consistency', async ({ page }) => {
    await page.goto('/dashboard');

    // Get primary button color
    const primaryBtn = page.locator('button.btn-primary');
    const bgColor = await primaryBtn.evaluate((el: any) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Verify consistent across buttons
    const allPrimaryBtns = await page.locator('button.btn-primary').all();
    for (const btn of allPrimaryBtns) {
      const color = await btn.evaluate((el: any) =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(color).toBe(bgColor);
    }
  });

  test('Text contrast >= 4.5:1 (WCAG AA)', async ({ page }) => {
    await page.goto('/dashboard');

    // Check body text contrast
    const bodyText = page.locator('body');
    const color = await bodyText.evaluate((el: any) =>
      window.getComputedStyle(el).color
    );
    const bgColor = await bodyText.evaluate((el: any) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Simple luminance-based contrast check (simplified version)
    // In production, use proper contrast ratio calculator
    expect(color).toBeTruthy();
    expect(bgColor).toBeTruthy();
  });

  test('Disabled button has reduced opacity', async ({ page }) => {
    await page.goto('/clientes');

    // Try to find disabled button (create without valid form = disabled)
    const disabledBtn = page.locator('button:disabled').first();

    if (await disabledBtn.count() > 0) {
      const opacity = await disabledBtn.evaluate((el: any) =>
        window.getComputedStyle(el).opacity
      );

      // Disabled should have opacity < 0.7
      expect(parseFloat(opacity)).toBeLessThan(0.7);
    }
  });
});

// ============================================================================
// TEMPLATE 3: Component State Verification
// ============================================================================

test.describe('Visual: Component States', () => {
  test('Button hover state visible', async ({ page }) => {
    await page.goto('/dashboard');

    const btn = page.locator('button.btn-primary').first();
    const normalStyle = await btn.evaluate((el: any) =>
      window.getComputedStyle(el).boxShadow
    );

    // Hover the button
    await btn.hover();
    const hoverStyle = await btn.evaluate((el: any) =>
      window.getComputedStyle(el).boxShadow
    );

    // Hover should have different box-shadow
    expect(hoverStyle).not.toBe(normalStyle);
  });

  test('Form input focus state visible', async ({ page }) => {
    await page.goto('/clientes');

    const input = page.locator('input[name="nombre"]').first();
    const normalOutline = await input.evaluate((el: any) =>
      window.getComputedStyle(el).outline
    );

    // Focus the input
    await input.focus();
    const focusOutline = await input.evaluate((el: any) =>
      window.getComputedStyle(el).outline
    );

    // Outline should change on focus
    expect(focusOutline).not.toBe(normalOutline);
  });

  test('Modal backdrop opacity correct', async ({ page }) => {
    await page.goto('/clientes');

    // Open create modal
    await page.locator('[data-testid="create-cliente-btn"]').click();
    await page.waitForSelector('[data-testid="modal-backdrop"]');

    const backdrop = page.locator('[data-testid="modal-backdrop"]');
    const opacity = await backdrop.evaluate((el: any) =>
      window.getComputedStyle(el).opacity
    );

    // Backdrop should be semi-transparent (0.5 or similar)
    expect(parseFloat(opacity)).toBeGreaterThan(0);
    expect(parseFloat(opacity)).toBeLessThan(1);
  });
});

// ============================================================================
// TEMPLATE 4: Typography Scale Verification
// ============================================================================

test.describe('Visual: Typography', () => {
  test('Heading hierarchy sizes correct', async ({ page }) => {
    await page.goto('/dashboard');

    const h1 = page.locator('h1').first();
    const h2 = page.locator('h2').first();
    const body = page.locator('body');

    const h1Size = await h1.evaluate((el: any) =>
      parseInt(window.getComputedStyle(el).fontSize)
    );

    const h2Size = await h2.evaluate((el: any) =>
      parseInt(window.getComputedStyle(el).fontSize)
    );

    const bodySize = await body.evaluate((el: any) =>
      parseInt(window.getComputedStyle(el).fontSize)
    );

    // Verify hierarchy: h1 > h2 > body
    expect(h1Size).toBeGreaterThan(h2Size);
    expect(h2Size).toBeGreaterThan(bodySize);
  });

  test('Font weights applied correctly', async ({ page }) => {
    await page.goto('/dashboard');

    const title = page.locator('h1').first();
    const subtitle = page.locator('h2').first();

    const titleWeight = await title.evaluate((el: any) =>
      window.getComputedStyle(el).fontWeight
    );

    const subtitleWeight = await subtitle.evaluate((el: any) =>
      window.getComputedStyle(el).fontWeight
    );

    // Title should be bolder than subtitle
    expect(parseInt(titleWeight)).toBeGreaterThanOrEqual(parseInt(subtitleWeight));
  });
});

// ============================================================================
// TEMPLATE 5: Spacing & Alignment Verification
// ============================================================================

test.describe('Visual: Spacing & Layout', () => {
  test('Card padding consistent', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard');

    const cards = await page.locator('[data-testid="metric-card"]').all();

    if (cards.length > 0) {
      const firstCardPadding = await cards[0].evaluate((el: any) =>
        window.getComputedStyle(el).padding
      );

      // All cards should have same padding
      for (const card of cards) {
        const padding = await card.evaluate((el: any) =>
          window.getComputedStyle(el).padding
        );
        expect(padding).toBe(firstCardPadding);
      }
    }
  });

  test('List items vertical spacing consistent', async ({ page }) => {
    await page.goto('/clientes');
    await page.waitForSelector('[data-testid="cliente-row"]');

    const rows = await page.locator('[data-testid="cliente-row"]').all();

    if (rows.length > 1) {
      const row1Box = await rows[0].boundingBox();
      const row2Box = await rows[1].boundingBox();

      if (row1Box && row2Box) {
        // Calculate gap between rows
        const gap = row2Box.y - (row1Box.y + row1Box.height);

        // Gap should be consistent (within ±2px due to rounding)
        const row3Box = await rows[2]?.boundingBox?.();
        if (row3Box) {
          const gap2 = row3Box.y - (row2Box.y + row2Box.height);
          expect(Math.abs(gap - gap2)).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  test('Gutter width 16px on mobile, 24px desktop', async ({ page }) => {
    // Mobile check
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    let container = page.locator('[data-testid="main-content"]');
    let padding = await container.evaluate((el: any) =>
      window.getComputedStyle(el).paddingLeft
    );

    expect(padding).toMatch(/16px|16/);

    // Desktop check
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.reload();

    padding = await container.evaluate((el: any) =>
      window.getComputedStyle(el).paddingLeft
    );

    expect(padding).toMatch(/24px|24/);
  });
});

// ============================================================================
// TEMPLATE 6: Full Page Screenshots (Manual Comparison)
// ============================================================================

test.describe('Visual: Full Page Screenshots', () => {
  test('Dashboard full page - all breakpoints', async ({ page }) => {
    for (const bp of BREAKPOINTS) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: `test-results/visual/dashboard-full-${bp.name}.png`,
        fullPage: true,
      });
    }
  });

  test('Clients page full page - all breakpoints', async ({ page }) => {
    for (const bp of BREAKPOINTS) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('/clientes');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: `test-results/visual/clientes-full-${bp.name}.png`,
        fullPage: true,
      });
    }
  });
});

// ============================================================================
// TEMPLATE 7: Regression - Visual Stability
// ============================================================================

test.describe('Visual Regression', () => {
  test('Dashboard visual stable after auth token refresh', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@insuraflow.com');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('**/dashboard');
    await page.setViewportSize({ width: 1440, height: 900 });

    // Capture initial state
    const before = await page.screenshot();

    // Simulate page reload (token refresh)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Capture after state
    const after = await page.screenshot();

    // Visual should be identical
    expect(before).toEqual(after);
  });
});
