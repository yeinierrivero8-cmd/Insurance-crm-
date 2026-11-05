# QA Testing Environment Setup Guide

**Last Updated:** 2026-11-04  
**For Phase:** Insurance CRM Redesign  
**Status:** ✅ Ready for Testing

---

## Quick Start (3 minutes)

```bash
# 1. Install dependencies
npm ci

# 2. Seed test database
npm run db:seed

# 3. Start servers (Terminal 1)
npm run dev:all

# 4. Wait 5 seconds, then run all tests (Terminal 2)
npx playwright test

# 5. View results
npx playwright show-report
```

---

## Environment Setup Details

### Prerequisites

- Windows 11 Home or equivalent
- Node.js v24.15.0+
- npm (included with Node)
- Git 2.53.0+
- 2GB free disk space
- Ports available: 5173 (frontend), 5000 (backend)

### Installation

```bash
# Navigate to project root
cd E:\Insurance\InsuraFlow-CRM\InsuraFlow-CRM

# Clean install dependencies
npm ci

# Verify Playwright is installed
npx playwright --version
# Expected: v1.63.0 or higher

# Install browser drivers
npx playwright install chromium
```

### Database Setup

```bash
# Seed test database with users and sample data
npm run db:seed

# Verify users created
# Check backend logs for:
# ✓ Database initialized
# ✓ Test users created
# ✓ Sample data seeded
```

---

## Running Tests Locally

### Option 1: Full Test Suite (Recommended)

```bash
# Terminal 1: Start frontend + backend
npm run dev:all

# Terminal 2: Wait 5 seconds, then run tests
sleep 5  # or wait manually
npx playwright test e2e/insuraflow.spec.ts

# View HTML report
npx playwright show-report
```

**Expected Output:**
```
Running 44 tests using 1 worker
...
✓ Suite 1: Authentication (6 passed)
✓ Suite 2: Token Refresh (5 passed)
✓ Suite 3: RBAC UI (9 passed)
✓ Suite 4: RBAC API (6 passed)
✓ Suite 5: CRUD (4 passed)
✓ Suite 6: Data Isolation (3 passed)
✓ Suite 7: Error Handling (5 passed)
✓ Suite 8: Cache (2 passed)
✓ Suite 9: Navigation (4 passed)

44 passed (2m 15s)
```

### Option 2: Individual Test Suites

```bash
# Auth tests only
npm run test:auth

# RBAC tests
npm run test:rbac

# CRUD tests
npm run test:crud

# With headed browser (see actions)
npm run test:headed

# Debug mode (step through with inspector)
npm run test:debug
```

### Option 3: CI/CD (Production-like)

```bash
# Builds, then tests
npm run test:ci

# Output includes:
# - Build artifacts
# - Test results
# - Video of failures
# - Performance metrics
```

---

## Manual Visual Testing Workflow

### Setup

```bash
# Terminal 1: Start dev servers
npm run dev:all

# Terminal 2: Open browser to frontend
# Navigate to http://localhost:5173
```

### Testing Each Breakpoint

#### Mobile (375px - iPhone SE)

```
1. Press F12 to open DevTools
2. Click device toggle (Ctrl+Shift+M on Windows)
3. Select "iPhone SE" preset (375x667)
4. Go to each page:
   - http://localhost:5173/login
   - http://localhost:5173/dashboard
   - http://localhost:5173/clientes
   - http://localhost:5173/renewals
   - http://localhost:5173/settings
5. Verify:
   - ✓ No horizontal scroll
   - ✓ Touch targets ≥ 44px
   - ✓ Text readable
   - ✓ Buttons clickable
   - ✓ Colors match design
6. Screenshot: Right-click → Screenshot
   Save as: screenshots/mobile-[page].png
```

#### Tablet (768px - iPad Air)

```
1. Reload and set viewport to 768x1024
2. Go to same pages
3. Verify:
   - ✓ Sidebar visible (not hamburger)
   - ✓ Two-column layout works
   - ✓ Spacing proper
4. Screenshot: screenshots/tablet-[page].png
```

#### Desktop (1440px - Full HD)

```
1. Reload and set viewport to 1440x900 (or maximize)
2. Go to same pages
3. Verify:
   - ✓ Full desktop layout
   - ✓ Sidebar + content visible
   - ✓ No wasted space
   - ✓ Three-column layouts work
4. Screenshot: screenshots/desktop-[page].png
```

### Visual Comparison Checklist

For each page and breakpoint, verify:

- [ ] Colors exact match (check hex values in DevTools)
- [ ] Typography: font size, weight, line height correct
- [ ] Spacing: padding, margins match 8px or 16px grid
- [ ] Components: buttons, cards, modals styled correctly
- [ ] States: hover, active, disabled visible and correct
- [ ] Responsive: no overflow, proper text wrapping
- [ ] Contrast: text readable (WCAG AA minimum)
- [ ] Icons: sizes correct, colors match
- [ ] Shadows: present where needed
- [ ] Borders: radius, color, width correct

---

## Test Scripts (npm run)

### Available Commands

```bash
npm run dev              # Start frontend dev server
npm run dev:backend      # Start backend dev server
npm run dev:all          # Start both simultaneously

npm run build            # Production build
npm run preview          # Preview built version

npm run test             # Run all 44 tests
npm run test:headed      # Run with browser visible
npm run test:debug       # Debug mode (interactive)
npm run test:report      # View HTML results
npm run test:auth        # Auth tests only
npm run test:rbac        # RBAC tests only
npm run test:crud        # CRUD tests only
npm run test:ci          # CI mode (build + test)

npm run db:seed          # Seed test database
npm run db:reset         # Reset database
```

---

## Troubleshooting

### "Connection refused" on test start

**Problem:** Tests can't connect to frontend/backend

**Solutions:**
```bash
# 1. Verify servers are running
npm run dev:all

# 2. Check ports are available
# Windows: netstat -ano | find "5173"
#          netstat -ano | find "5000"

# 3. Kill processes on those ports if needed
# Windows: taskkill /PID [PID] /F

# 4. Restart
npm run dev:all
```

### "SecurityError: Failed to read localStorage"

**Problem:** Page served via file:// instead of http://

**Solution:**
```bash
# Ensure Vite is running and Playwright uses correct URL
# Check playwright.config.ts has:
# baseURL: 'http://localhost:5173'

# Restart dev server
npm run dev:all
```

### "Selector timeout" on data-testid

**Problem:** Test can't find element with data-testid

**Cause:** Component doesn't have the test ID attribute

**Solution:**
```jsx
// Add data-testid to React component:
<button data-testid="create-cliente-btn">Create</button>
<input data-testid="search-input" />

// Rebuild
npm run build

# Then retry tests
npm run test
```

### "Login failed" with 403

**Problem:** Test users don't exist in backend

**Solution:**
```bash
# Seed database
npm run db:seed

# Verify users via backend logs
npm run dev:backend
# Look for: "Test users created"

# If manual creation needed, use backend CLI or SQL
# See backend/db/seed.js for user creation
```

### Tests hang or timeout

**Problem:** Tests stuck waiting for element

**Solutions:**
```bash
# 1. Check backend is running
npm run dev:backend

# 2. Check test database is seeded
npm run db:seed

# 3. Increase timeout in playwright.config.ts
# Change: timeout: 30000 (currently 30s)
# To: timeout: 60000 (60s)

# 4. Run debug mode to see what's happening
npm run test:debug
```

---

## Test Report Files

After running tests, find reports here:

```
playwright-report/
├── index.html              ← Open in browser
├── data/
│   └── trace.zip          ← Video of failures
└── ...

test-results/
├── results.json           ← Machine-readable results
├── visual/                ← Screenshots
│   ├── dashboard-375px.png
│   ├── clientes-768px.png
│   └── ...
└── ...
```

### View Report

```bash
# Open HTML report in default browser
npx playwright show-report

# Or open file directly
start playwright-report/index.html  # Windows
open playwright-report/index.html   # Mac
```

---

## CI/CD Integration (Optional)

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '24'
      
      - run: npm ci
      
      - run: npm run build
      
      - run: npm run dev:all &
      - run: sleep 10
      - run: npm run test
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## Testing the Redesign (Step-by-Step)

### Before Testing

1. **Check prerequisites:**
   ```bash
   node --version     # v24.15.0+
   npm --version      # 10.0.0+
   npx playwright --version  # 1.63.0+
   ```

2. **Update code to latest:**
   ```bash
   git pull origin main
   ```

3. **Install deps:**
   ```bash
   npm ci
   ```

4. **Seed database:**
   ```bash
   npm run db:seed
   ```

### During Testing

1. **Start servers:**
   ```bash
   npm run dev:all
   ```

2. **Run tests:**
   ```bash
   # In another terminal
   npx playwright test e2e/insuraflow.spec.ts
   ```

3. **Watch results:**
   ```bash
   npx playwright show-report
   ```

4. **Manual visual check:**
   - Open http://localhost:5173
   - Use Chrome DevTools responsive design mode
   - Test on 375px, 768px, 1440px
   - Verify colors, spacing, typography

### After Testing

1. **Document findings:**
   - Screenshot any issues
   - Note severity (Critical/High/Medium/Low)
   - List reproduction steps

2. **Report bugs:**
   - Create bug report using template (see QA_TESTING_PLAN.md)
   - Include screenshots
   - Assign to ENGINEER for fix

3. **Sign off when ready:**
   - All tests pass ✓
   - Visual design verified ✓
   - No critical bugs ✓
   - Security checklist complete ✓

---

## Performance Testing (Optional)

```bash
# Check page load performance
npx playwright test -g "performance"

# Or manually check DevTools:
# 1. Open DevTools (F12)
# 2. Go to Performance tab
# 3. Click Record
# 4. Navigate page
# 5. Stop recording
# 6. Check metrics:
#    - First Contentful Paint < 2s
#    - Time to Interactive < 4s
#    - Largest Contentful Paint < 3s
```

---

## Security Testing (Optional)

```bash
# Manual security checks
1. Try SQL injection in search: ' OR '1'='1
2. Try XSS in client name: <img src=x onerror="alert('xss')">
3. Try CSRF: Create request without auth token
4. Try RBAC bypass: Admin action as viewer user
5. Check console for exposed secrets

# Automated security via OWASP recommendations
npm run test  # Includes RBAC + auth tests
```

---

## Useful Links

- **Playwright Docs:** https://playwright.dev
- **Test Report:** localhost:4400 (after `npx playwright show-report`)
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **DevTools:** F12 in browser

---

## Support & Escalation

- **Playwright Issues:** https://github.com/microsoft/playwright/issues
- **Backend Issues:** Check backend logs: `npm run dev:backend`
- **Test Data Issues:** Reseed: `npm run db:reset`
- **Build Issues:** Clean build: `npm run build --verbose`

---

## Next Steps

1. Run `npm run dev:all` to start servers
2. Open http://localhost:5173 in browser
3. Manually test on 3 breakpoints (375px, 768px, 1440px)
4. Run `npx playwright test` to execute e2e tests
5. Review report in `playwright-report/index.html`
6. Document any bugs found
7. Get sign-off when all checks pass

---

**Status:** ✅ Environment Ready  
**Last Check:** 2026-11-04  
**Next:** Await ENGINEER implementation → Execute this plan

