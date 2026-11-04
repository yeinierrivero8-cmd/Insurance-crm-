# InsuraFlow CRM - E2E Test Suite

Comprehensive end-to-end testing with Playwright covering 44 critical user flows.

## Setup

### 1. Install dependencies

```bash
npm install --save-dev @playwright/test
```

### 2. Prerequisites

Before running tests, ensure:

- **Backend is running**: `npm run dev:backend` (or your backend server on `http://localhost:5000`)
- **Frontend is running**: `npm run dev` (Vite on `http://localhost:5173`)
- **Test database is seeded** with test users:
  - `admin@test.local` / `test123` (Admin role)
  - `agent@test.local` / `test123` (Agent role)
  - `viewer@test.local` / `test123` (Viewer role)

### 3. Run all tests

```bash
npx playwright test e2e/insuraflow.spec.ts
```

### 4. Run tests in debug mode (headed browser)

```bash
npx playwright test e2e/insuraflow.spec.ts --debug
```

### 5. Run specific test suite

```bash
npx playwright test -g "Suite 1: Authentication"
npx playwright test -g "Suite 2: Token Refresh"
```

### 6. Generate HTML report

```bash
npx playwright show-report
```

## Test Coverage

| Suite                           | Tests | Focus                              |
| ------------------------------- | ----- | ---------------------------------- |
| **Authentication**              | 6     | Login, logout, session persistence |
| **Token Refresh & Expiry**       | 5     | Auto-refresh, expiry handling      |
| **RBAC Enforcement UI**          | 9     | Role-based button visibility       |
| **RBAC Enforcement API**         | 6     | Role-based API access control      |
| **CRUD Operations**              | 4     | Create, read, update, delete       |
| **Data Isolation**               | 3     | User data boundaries               |
| **Error Handling**               | 5     | Network errors, validation         |
| **Cache Invalidation**           | 2     | Cache refresh on mutations         |
| **Navigation & UX**              | 4     | Page navigation, scroll position   |
| **TOTAL**                        | **44** | **Comprehensive coverage**         |

## Configuration

- **Base URL**: `http://localhost:5173`
- **API Base**: `http://localhost:5000/api`
- **Browser**: Chromium
- **Timeout**: 5-30 seconds depending on action
- **Retries**: 2 on CI, 0 locally
- **Videos/Screenshots**: Only on failure

## Troubleshooting

### Tests fail with "Connection refused"

Ensure backend and frontend are both running:

```bash
npm run dev:all
```

### Test users don't exist

Seed the test database:

```bash
npm run db:seed
```

Then manually create test users via the app or database:

```sql
INSERT INTO users (email, password_hash, role) VALUES
('admin@test.local', <hashed_password>, 'Administrador'),
('agent@test.local', <hashed_password>, 'Agente'),
('viewer@test.local', <hashed_password>, 'Solo Lectura');
```

### Selector timeouts

Update test IDs in your React components:

```jsx
<button data-testid="create-cliente-btn">Create</button>
<button data-testid="edit-btn">Edit</button>
<button data-testid="delete-btn">Delete</button>
```

## Key Test Scenarios

1. **Authentication**: Valid/invalid login, logout, session persistence
2. **Token Management**: Auto-refresh, expiry, concurrent refresh deduplication
3. **RBAC**: UI enforcement (buttons), API enforcement (403/201 responses)
4. **CRUD**: Create cliente appears in list, update persists, delete removes from list
5. **Data Isolation**: User A's data not visible to User B
6. **Error Handling**: Network timeouts, form validation, duplicate detection
7. **Cache**: Cache invalidates on create/update
8. **Navigation**: All pages load without 404, back button preserves scroll

## CI/CD Integration

For GitHub Actions, add this to `.github/workflows/test.yml`:

```yaml
- name: Run E2E Tests
  run: |
    npm run dev &
    npm run dev:backend &
    sleep 10
    npx playwright test e2e/insuraflow.spec.ts
```

## Notes

- Tests use `data-testid` attributes for reliable selectors
- Some tests skip if UI elements don't exist (e.g., avatar upload)
- RBAC API tests assume 403 responses for unauthorized actions
- Token expiry tests use JWT mock utilities
- Data isolation depends on your tenant model (single vs. multi-tenant)
