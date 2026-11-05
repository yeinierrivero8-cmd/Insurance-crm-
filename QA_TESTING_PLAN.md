# QA & SECURITY TESTING PLAN - Insurance CRM Redesign
**Version:** 1.0  
**Phase:** Pre-Implementation (Environment Preparation)  
**Status:** Ready for Execution  
**Date:** 2026-11-04

---

## EXECUTIVE SUMMARY

QA & Security Engineer has prepared a comprehensive testing environment and plan for Insurance CRM redesign verification. Once ENGINEER completes implementation, this plan will be executed following the checklist below.

**Total Test Coverage:**
- 44 existing e2e tests (Auth, Token, RBAC, CRUD, Data Isolation, Error Handling, Cache, Navigation)
- 5 visual breakpoints for responsive testing (375px, 430px, 768px, 1024px, 1440px)
- Security validations (CORS, XSS, SQL Injection, CSRF, Auth, Authz)
- Regression testing against existing functionality

---

## PHASE 1: LOCAL ENVIRONMENT SETUP

### 1.1 Dependencies Verification

**Installed:**
- ✅ Node.js v24.15.0
- ✅ npm (package manager)
- ✅ Playwright 1.63.0+ (for e2e testing)
- ✅ Vite (build tool)
- ✅ Express (backend)

**Location:** `E:\Insurance\InsuraFlow-CRM\InsuraFlow-CRM\`

### 1.2 Required Commands

```bash
# Install frontend dependencies
npm ci  # Use ci for clean install

# Install backend dependencies  
cd backend
npm ci
cd ..

# Build the project
npm run build

# Verify Playwright
npx playwright --version
```

### 1.3 Servers Configuration

| Service | Port | Command | Purpose |
|---------|------|---------|---------|
| Frontend (Vite) | 5173 | `npm run dev` | React app + HMR |
| Backend | 5000 | `npm run dev:backend` | API + Test DB |
| Both | — | `npm run dev:all` | Parallel start |
| Preview | 4173 | `npm run preview` | Built dist preview |

---

## PHASE 2: DATABASE & TEST DATA SETUP

### 2.1 Test Users (Auto-seeded)

Three roles for RBAC testing:

```json
{
  "admin": {
    "email": "admin@insuraflow.com",
    "password": "Admin@123",
    "role": "Administrador",
    "permissions": ["create", "read", "update", "delete"]
  },
  "agent": {
    "email": "agent@insuraflow.com",
    "password": "Agent@123",
    "role": "Agente",
    "permissions": ["create", "read", "update"]
  },
  "viewer": {
    "email": "viewer@insuraflow.com",
    "password": "Viewer@123",
    "role": "Solo Lectura",
    "permissions": ["read"]
  }
}
```

### 2.2 Seed Test Database

```bash
# Seed with test data
npm run db:seed

# Verify users exist
# Check backend logs for "Database initialized" message
```

---

## PHASE 3: VISUAL REGRESSION TESTING CHECKLIST

### 3.1 Breakpoints to Test

| Device | Width | Testing | Tools |
|--------|-------|---------|-------|
| Mobile SE | 375px | iPhone SE | Chrome DevTools |
| Mobile Modern | 430px | Pixel 6 Pro | Chrome DevTools |
| Tablet | 768px | iPad Air | Chrome DevTools |
| Desktop Small | 1024px | MacBook 1024 | Chrome DevTools |
| Desktop Large | 1440px | Full HD | Full screen |

### 3.2 Visual Elements Checklist

#### Colors & Typography
- [ ] Primary color matches reference (confirm hex value)
- [ ] Secondary color consistent
- [ ] Text colors have proper contrast (WCAG AA)
- [ ] Font sizes: h1, h2, h3, body, small follow scale
- [ ] Font weights: bold/regular/light applied correctly
- [ ] Line heights appropriate (readability)

#### Components
- [ ] Buttons: hover, active, disabled states visible
- [ ] Inputs: focus, error, disabled states visible
- [ ] Badges: correct colors per status (pending, active, etc.)
- [ ] Cards: shadows present, spacing consistent
- [ ] Modals: overlay correct, backdrop visible
- [ ] Dropdowns: open/close states correct
- [ ] Avatars: gradients/initials render correctly
- [ ] Icons: size and color consistent

#### Layout & Spacing
- [ ] Navbar: fixed/sticky, correct height
- [ ] Sidebar: collapse/expand works on mobile
- [ ] Padding: all sections follow 16px grid
- [ ] Margins: no overflow on small screens
- [ ] Gutter width: 16px on mobile, 24px desktop
- [ ] Page height: no unexpected vertical scroll unless data-heavy

#### Responsive Specific
- **375px:**
  - [ ] Stack columns vertically
  - [ ] Touch targets 44px+ minimum
  - [ ] Modals full-width with 16px margin
  - [ ] Pagination hidden/horizontal scroll
  
- **430px:**
  - [ ] Same as 375px (mobile layout)
  - [ ] Two-column grids readable
  
- **768px:**
  - [ ] Tablet layout active
  - [ ] Sidebar visible (not hamburger)
  - [ ] Two columns work well
  
- **1024px:**
  - [ ] Small desktop layout
  - [ ] Full sidebar visible
  - [ ] 3 columns possible
  
- **1440px:**
  - [ ] Full desktop layout
  - [ ] All features visible
  - [ ] No wasted horizontal space

### 3.3 Screenshot Capture Process

```bash
# 1. Open Chrome DevTools
# 2. Go to each page
# 3. Set viewport to breakpoint size (Ctrl+Shift+M on Windows)
# 4. Toggle mobile view on/off
# 5. Screenshot each state:
#    - Idle (no hover)
#    - Hover state on interactive elements
#    - Active/clicked state
#    - Error state (if applicable)
#    - Loading state (if applicable)

# File naming convention:
# [page]-[breakpoint]-[state].png
# Example: clients-375px-idle.png
#          clients-375px-hover-btn.png
```

---

## PHASE 4: FUNCTIONAL TESTING CHECKLIST

### 4.1 Authentication Flow

#### Login
- [ ] Valid credentials: success + redirect to /dashboard
- [ ] Invalid password: error toast appears
- [ ] Invalid email: validation error appears
- [ ] Empty fields: error message per field
- [ ] Remember me checkbox: toggles
- [ ] After login: tokens stored in localStorage
- [ ] After logout: tokens cleared, redirect to /login

#### Session Persistence
- [ ] Reload page after login: stays logged in
- [ ] Close/reopen browser: session persists (if Remember Me checked)
- [ ] Tab switch: session valid in both tabs
- [ ] Expired token: auto-refresh or logout

### 4.2 Navigation & Pages

**All pages should:**
- [ ] Load without 404 or console errors
- [ ] Respond to navbar clicks
- [ ] Support back/forward browser buttons
- [ ] Preserve scroll position on back

**Pages to test:**
- [ ] `/` → Redirects to /login or /dashboard
- [ ] `/login` → Login form visible
- [ ] `/dashboard` → Metrics cards load
- [ ] `/clientes` → Table renders, pagination works
- [ ] `/renovals` → Renewal data loads
- [ ] `/settings` → Only admin can access
- [ ] 404 page → Accessible at /nonexistent

### 4.3 CRUD Operations

#### Create Cliente
- [ ] Form fields render
- [ ] Validation: required fields marked
- [ ] Submit button enabled only when form valid
- [ ] After create: success toast + modal closes
- [ ] New cliente appears in list immediately
- [ ] Form resets for next entry

#### Read Cliente
- [ ] Table loads without lag
- [ ] Pagination works (prev/next/jump to page)
- [ ] Search filters results
- [ ] Sort by columns (if available)
- [ ] Click row: detail view opens
- [ ] Detail modal shows all fields

#### Update Cliente
- [ ] Click Edit: modal opens with existing data
- [ ] Edit fields: values update
- [ ] Submit: success toast appears
- [ ] List refreshes without full reload
- [ ] Changes persist after page reload

#### Delete Cliente
- [ ] Click Delete: confirmation modal appears
- [ ] Cancel: modal closes, nothing deleted
- [ ] Confirm: success toast + item removed from list
- [ ] Verify actually deleted: refresh list

### 4.4 Forms Validation

- [ ] Required fields: show error if empty
- [ ] Email field: validate format
- [ ] Phone field: validate format (if present)
- [ ] Date fields: validate date format
- [ ] Min/max lengths: enforced with feedback
- [ ] Duplicate detection: show error if email exists
- [ ] Submit disabled: until all valid

### 4.5 Error Handling

- [ ] Network timeout: toast with message + retry button
- [ ] 500 server error: user-friendly message
- [ ] 403 Forbidden: "You don't have permission"
- [ ] 404 Not Found: "Page not found"
- [ ] Form validation: inline errors under field
- [ ] API error: retry mechanism works

### 4.6 Console & Performance

- [ ] **Console errors:** 0 red errors
- [ ] **Console warnings:** Review for legitimate warnings only
- [ ] **Network tab:** All requests successful (200/201/204/403 expected)
- [ ] **Performance:** Page load < 3s (on 3G throttle)
- [ ] **Unused CSS:** Minimal (expect ~10-15KB gzipped)

---

## PHASE 5: SECURITY TESTING CHECKLIST

### 5.1 Authentication & Authorization

- [ ] Expired token triggers logout
- [ ] Refresh token works when access token expires
- [ ] Can't bypass login with manual token in localStorage
- [ ] RBAC enforced on UI (buttons hidden for unauthorized roles)
- [ ] RBAC enforced on API (403 responses for unauthorized actions)

### 5.2 Input Validation

**SQL Injection Prevention:**
- [ ] Client name field: accepts letters/numbers/special chars safely
- [ ] Email field: basic format validation
- [ ] Backend: parameterized queries used

**XSS Prevention:**
- [ ] Rich text fields: HTML escaped
- [ ] User avatars: safe image rendering
- [ ] Search terms: no script execution
- [ ] Error messages: no HTML injection

**CSRF Protection:**
- [ ] POST requests include auth header
- [ ] No form-based submissions (API-driven)
- [ ] No sensitive GET requests

### 5.3 Data Isolation

- [ ] User A cannot see User B's clientes (API returns 403 or empty)
- [ ] User A avatar URL inaccessible to User B (403)
- [ ] Search/filter doesn't leak other users' data
- [ ] No client-side data exposure (localStorage only has tokens)

### 5.4 CORS & Headers

- [ ] `Access-Control-Allow-Origin` correct (localhost:5173 in dev)
- [ ] `X-Content-Type-Options: nosniff` present
- [ ] `X-Frame-Options: DENY` present (if API not embedded)
- [ ] Credentials sent with auth requests

### 5.5 Sensitive Data

- [ ] No passwords logged
- [ ] No PII in console
- [ ] Tokens not persisted in cookies (use localStorage with HTTPOnly alternatives)
- [ ] No sensitive data in URLs

---

## PHASE 6: REGRESSION TESTING CHECKLIST

### 6.1 Existing Features (Post-Redesign)

Test that **redesign does NOT break**:

- [ ] Login/logout still works
- [ ] API endpoints respond correctly
- [ ] Database queries execute
- [ ] Token refresh mechanism intact
- [ ] RBAC logic unchanged
- [ ] Search functionality
- [ ] Pagination
- [ ] Sorting
- [ ] Filters

### 6.2 Playwright E2E Tests

Run all 44 existing tests:

```bash
# Full suite
npx playwright test e2e/insuraflow.spec.ts

# By suite
npx playwright test -g "Suite 1: Authentication"
npx playwright test -g "Suite 3: RBAC Enforcement UI"
npx playwright test -g "Suite 5: CRUD Operations"

# With reporter
npx playwright show-report
```

**Expected Results:**
- All 44 tests pass ✓
- No new failures introduced

---

## PHASE 7: ACCESSIBILITY TESTING (BASIC)

### 7.1 Contrast & Readability

- [ ] Text/background contrast ratio >= 4.5:1 (normal text)
- [ ] Headings readable on light and dark backgrounds
- [ ] Focus indicators visible (outline on buttons/links)

### 7.2 Keyboard Navigation

- [ ] Tab through form fields in logical order
- [ ] Enter submits form
- [ ] Escape closes modal
- [ ] Arrow keys work in tables/dropdowns

### 7.3 Screen Reader (Quick Check)

- [ ] Buttons have text labels (not just icons)
- [ ] Form labels associated with inputs
- [ ] Images have alt text
- [ ] Tables have headers

---

## PHASE 8: TEST EXECUTION WORKFLOW

### 8.1 Pre-Execution Checklist

Before running tests:

- [ ] Frontend compiled (`npm run build`)
- [ ] Backend can start (`npm run dev:backend` works)
- [ ] Playwright installed (`npx playwright --version`)
- [ ] Test database seedable (`npm run db:seed`)
- [ ] No uncommitted changes in git

### 8.2 Local Test Execution

```bash
# Terminal 1: Start servers
npm run dev:all

# Terminal 2: Wait 5 seconds, then run tests
sleep 5
npx playwright test e2e/insuraflow.spec.ts

# View results
npx playwright show-report

# Optional: Take screenshots
npx playwright test e2e/insuraflow.spec.ts --update-snapshots
```

### 8.3 Visual Testing Workflow

```bash
# 1. Manual visual inspection on each breakpoint
#    - Open http://localhost:5173 in browser
#    - Open Chrome DevTools (F12)
#    - Toggle device toolbar (Ctrl+Shift+M)
#    - Set viewport to each breakpoint size
#    - Screenshot or record each page

# 2. Compare to reference designs (if available)
#    - Figma mockups
#    - Color specs
#    - Typography specs

# 3. Document discrepancies
#    - Screenshot mismatched element
#    - Note exact issue
#    - Assign to ENGINEER for fix
```

---

## PHASE 9: REPORTING & DOCUMENTATION

### 9.1 Test Report Template

```markdown
# Testing Report - Insurance CRM Redesign
Date: [YYYY-MM-DD]
Tester: QA & Security Engineer
Build: [commit hash]
Environment: Local dev (5173/5000)

## Summary
- Total Tests Executed: X
- Passed: X
- Failed: X
- Skipped: X
- Success Rate: X%

## Build & Compilation
- ✓ npm run build: Success
- ✓ No TypeScript errors
- ✓ No missing dependencies
- ✓ dist/ generated (size: X MB)

## Functional Testing
- Authentication: PASS/FAIL
- Navigation: PASS/FAIL
- CRUD Operations: PASS/FAIL
- Forms: PASS/FAIL
- Error Handling: PASS/FAIL

## Visual Testing (Responsive)
- 375px: PASS/FAIL
- 430px: PASS/FAIL
- 768px: PASS/FAIL
- 1024px: PASS/FAIL
- 1440px: PASS/FAIL

## Security Testing
- SQL Injection: PASS/FAIL
- XSS Prevention: PASS/FAIL
- CSRF Protection: PASS/FAIL
- Data Isolation: PASS/FAIL
- RBAC Enforcement: PASS/FAIL

## Console Errors
- Critical: X
- Warnings: X
- Info: X

## Playwright E2E Tests
- Total: 44
- Passed: X
- Failed: X
- Skipped: X

## Bugs Found
1. [Bug title] - [Priority: Critical/High/Medium/Low]
   - Steps to reproduce: ...
   - Expected: ...
   - Actual: ...
   - Screenshots: [links or embedded]

2. [Bug title] - [Priority]
   - ...

## Blockers
- None / List any critical blockers

## Sign-Off
- ✓ Ready for Production / ⏸️ Needs fixes
- Signed by: QA & Security Engineer
- Date: YYYY-MM-DD
```

### 9.2 Bug Tracking Template

```markdown
## Bug: [Title]
- **ID:** [BUG-001]
- **Priority:** Critical / High / Medium / Low
- **Component:** [UI Component / API / Auth / etc]
- **Affected Breakpoint(s):** [375px / 768px / 1440px / All]
- **Environment:** Local dev
- **Reproducibility:** Always / Sometimes / Never

**Description:**
[What is broken]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Screenshots:**
[Links or embedded images]

**Console Errors:**
[Any relevant error messages]

**Assigned to:** ENGINEER
**Status:** Open / In Progress / Fixed / Verified
```

---

## PHASE 10: TEST SUMMARY & DELIVERABLES

### 10.1 What Will Be Tested

✅ **Build & Compilation**
- Clean build without errors
- Dist folder properly generated
- No missing dependencies

✅ **Functional Features**
- Login/Logout
- CRUD operations (Create, Read, Update, Delete)
- Navigation & page loads
- Form validation
- Error handling

✅ **Visual Design (Responsive)**
- 5 breakpoints (375px to 1440px)
- Colors, typography, spacing
- Component states (hover, active, disabled)
- Mobile & desktop layouts

✅ **Security**
- Authentication & token management
- Authorization (RBAC) enforcement
- Data isolation
- Input validation (XSS, SQL Injection prevention)

✅ **Performance**
- Page load time
- Network requests
- Console for errors/warnings

✅ **Regression**
- All 44 existing e2e tests pass
- No functionality broken by redesign

### 10.2 Deliverables

After testing completes:

1. **Testing Report** (markdown)
   - Checklist status
   - Test results summary
   - Bug list with severity

2. **Screenshots** (by breakpoint)
   - Idle states
   - Hover states
   - Error states

3. **Bug Report** (if any)
   - Priority & severity
   - Reproduction steps
   - Expected vs actual

4. **Playwright Report**
   - HTML report in `playwright-report/`
   - Video of failures (if any)
   - Test execution time

5. **Sign-Off** (approval to deploy)
   - All critical tests passed
   - No blocking bugs
   - Ready for production

---

## NEXT STEPS

### When ENGINEER Completes Implementation

1. **Notify QA** that build is ready
2. **Pull latest code** to testing environment
3. **Run this checklist** in order:
   - Phase 1: Environment setup
   - Phase 2: Database seeding
   - Phase 3: Visual regression (screenshots)
   - Phase 4: Functional testing
   - Phase 5: Security validation
   - Phase 6: Regression (run Playwright)
   - Phase 7: Accessibility
   - Phase 8: Execute tests
   - Phase 9: Generate reports
   - Phase 10: Sign-off

4. **Report findings** with evidence
5. **Coordinate fixes** with ENGINEER
6. **Re-test** critical fixes
7. **Get approval** to merge/deploy

---

## TOOLS & ENVIRONMENTS

| Tool | Version | Purpose |
|------|---------|---------|
| Playwright | 1.63.0+ | E2E Testing |
| Chrome DevTools | Latest | Visual inspection, responsive testing |
| VS Code | Latest | Code review, quick edits |
| Git | 2.53.0 | Version control |
| Node.js | 24.15.0 | Runtime |

**Testing will run on:**
- Windows 11 Home
- Local environment (127.0.0.1)
- Port 5173 (Frontend)
- Port 5000 (Backend)

---

## SUCCESS CRITERIA

Testing is **COMPLETE** when:

✅ All 44 Playwright tests pass  
✅ Visual design verified on 5 breakpoints  
✅ No critical bugs found  
✅ Security checklist all green  
✅ Regression tests pass  
✅ Accessibility basic checks pass  
✅ Console clean (0 errors)  
✅ Build succeeds without warnings  
✅ Complete report generated  
✅ Sign-off ready  

---

## CONTACT & ESCALATION

- **QA & Security Engineer:** [This testing plan]
- **ENGINEER:** For code fixes during testing
- **ARCHITECT:** For design/architecture decisions
- **DEVOPS:** For deployment approval

---

**Document Status:** Ready for Execution  
**Last Updated:** 2026-11-04  
**Version:** 1.0

---

**AWAITING:** ENGINEER to complete implementation  
**THEN:** Execute this plan end-to-end
