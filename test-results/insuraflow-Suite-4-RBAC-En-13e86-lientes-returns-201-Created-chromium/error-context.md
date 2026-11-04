# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: insuraflow.spec.ts >> Suite 4: RBAC Enforcement API >> 4.3: Admin POST /clientes returns 201 Created
- Location: e2e\insuraflow.spec.ts:346:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  260 |     await login(page, user.email, user.password);
  261 |     await page.goto(`${CONFIG.BASE_URL}/clientes`);
  262 | 
  263 |     const deleteBtn = await page.locator('[data-testid="delete-btn"]').isVisible().catch(() => false);
  264 |     expect(deleteBtn).toBeFalsy();
  265 |   });
  266 | 
  267 |   test('3.6: Admin sees all CRUD buttons', async ({ page }) => {
  268 |     const user = getAdminUser();
  269 |     await login(page, user.email, user.password);
  270 |     await page.goto(`${CONFIG.BASE_URL}/clientes`);
  271 | 
  272 |     const createBtn = await page.locator('[data-testid="create-cliente-btn"]').isVisible().catch(() => true);
  273 |     const editBtn = await page.locator('[data-testid="edit-btn"]').isVisible().catch(() => true);
  274 |     const deleteBtn = await page.locator('[data-testid="delete-btn"]').isVisible().catch(() => true);
  275 | 
  276 |     expect(createBtn).toBeTruthy();
  277 |     expect(editBtn).toBeTruthy();
  278 |     expect(deleteBtn).toBeTruthy();
  279 |   });
  280 | 
  281 |   test('3.7: Settings page only accessible to admin', async ({ page }) => {
  282 |     const viewerUser = getViewerUser();
  283 |     await login(page, viewerUser.email, viewerUser.password);
  284 | 
  285 |     // Try to access settings
  286 |     await page.goto(`${CONFIG.BASE_URL}/settings`);
  287 | 
  288 |     // Should either redirect to dashboard or show access denied
  289 |     const currentUrl = page.url();
  290 |     const hasAccess = currentUrl.includes('/settings');
  291 |     expect(hasAccess).toBeFalsy();
  292 |   });
  293 | 
  294 |   test('3.8: Admin can access Settings page', async ({ page }) => {
  295 |     const user = getAdminUser();
  296 |     await login(page, user.email, user.password);
  297 |     await page.goto(`${CONFIG.BASE_URL}/settings`);
  298 | 
  299 |     // Should load settings page successfully
  300 |     await page.waitForLoadState('networkidle');
  301 |     expect(page.url()).toContain('/settings');
  302 |   });
  303 | 
  304 |   test('3.9: Role labels display correctly', async ({ page }) => {
  305 |     const user = getAdminUser();
  306 |     await login(page, user.email, user.password);
  307 |     await page.goto(`${CONFIG.BASE_URL}/dashboard`);
  308 | 
  309 |     // Check that user role is displayed somewhere (e.g., in header/profile)
  310 |     const roleElement = await page.locator('[data-testid="user-role"]').textContent();
  311 |     expect(roleElement).toContain('Administrador');
  312 |   });
  313 | });
  314 | 
  315 | // ============================================================================
  316 | // SUITE 4: RBAC Enforcement API (6 tests)
  317 | // ============================================================================
  318 | 
  319 | test.describe('Suite 4: RBAC Enforcement API', async () => {
  320 |   test('4.1: Viewer POST /clientes returns 403 Forbidden', async () => {
  321 |     const viewer = getViewerUser();
  322 |     const client = await createAuthenticatedClient(viewer.email, viewer.password);
  323 | 
  324 |     const response = await client.createCliente({ nombre: 'Test', email: 'test@test.local' });
  325 | 
  326 |     expect(response.success).toBeFalsy();
  327 |   });
  328 | 
  329 |   test('4.2: Agent POST /clientes returns 201 Created', async () => {
  330 |     const agent = getAgentUser();
  331 |     const client = await createAuthenticatedClient(agent.email, agent.password);
  332 | 
  333 |     const newClient = {
  334 |       nombre: 'Agent Created Client',
  335 |       email: 'agent.client@test.local',
  336 |       telefono: '555-0001',
  337 |       direccion: 'Test Address',
  338 |       estado: 'activo',
  339 |     };
  340 | 
  341 |     const response = await client.createCliente(newClient);
  342 | 
  343 |     expect(response.success).toBeTruthy();
  344 |   });
  345 | 
  346 |   test('4.3: Admin POST /clientes returns 201 Created', async () => {
  347 |     const admin = getAdminUser();
  348 |     const client = await createAuthenticatedClient(admin.email, admin.password);
  349 | 
  350 |     const newClient = {
  351 |       nombre: 'Admin Created Client',
  352 |       email: 'admin.client@test.local',
  353 |       telefono: '555-0002',
  354 |       direccion: 'Admin Address',
  355 |       estado: 'activo',
  356 |     };
  357 | 
  358 |     const response = await client.createCliente(newClient);
  359 | 
> 360 |     expect(response.success).toBeTruthy();
      |                              ^ Error: expect(received).toBeTruthy()
  361 |   });
  362 | 
  363 |   test('4.4: Viewer DELETE /clientes/:id returns 403 Forbidden', async () => {
  364 |     const viewer = getViewerUser();
  365 |     const client = await createAuthenticatedClient(viewer.email, viewer.password);
  366 | 
  367 |     const response = await client.deleteCliente('nonexistent-id');
  368 | 
  369 |     expect(response.success).toBeFalsy();
  370 |   });
  371 | 
  372 |   test('4.5: Agent DELETE /clientes/:id returns 403 Forbidden', async () => {
  373 |     const agent = getAgentUser();
  374 |     const client = await createAuthenticatedClient(agent.email, agent.password);
  375 | 
  376 |     const response = await client.deleteCliente('nonexistent-id');
  377 | 
  378 |     expect(response.success).toBeFalsy();
  379 |   });
  380 | 
  381 |   test('4.6: Admin DELETE /clientes/:id returns 204 No Content', async () => {
  382 |     // This test assumes an existing client to delete
  383 |     // In practice, would create one first
  384 |     const admin = getAdminUser();
  385 |     const client = await createAuthenticatedClient(admin.email, admin.password);
  386 | 
  387 |     // Skip if no test client exists
  388 |     const response = await client.deleteCliente('test-id');
  389 | 
  390 |     // May fail with 404 if client doesn't exist, but should allow the request
  391 |     expect(response.success === false && response.error?.includes('404')).toBeTruthy();
  392 |   });
  393 | });
  394 | 
  395 | // ============================================================================
  396 | // SUITE 5: CRUD Operations (4 tests)
  397 | // ============================================================================
  398 | 
  399 | test.describe('Suite 5: CRUD Operations', () => {
  400 |   test.beforeEach(async ({ page }) => {
  401 |     await clearStorage(page);
  402 |   });
  403 | 
  404 |   test('5.1: Create cliente appears in list', async ({ page }) => {
  405 |     const user = getAgentUser();
  406 |     await login(page, user.email, user.password);
  407 |     await page.goto(`${CONFIG.BASE_URL}/clientes`);
  408 | 
  409 |     const newClient = createNewClientForm();
  410 | 
  411 |     // Click Create button
  412 |     await page.click('[data-testid="create-cliente-btn"]');
  413 |     await page.waitForSelector('[data-testid="cliente-form"]');
  414 | 
  415 |     // Fill form
  416 |     await page.fill('input[name="nombre"]', newClient.nombre);
  417 |     await page.fill('input[name="email"]', newClient.email);
  418 |     await page.fill('input[name="telefono"]', newClient.telefono);
  419 |     await page.fill('input[name="direccion"]', newClient.direccion);
  420 | 
  421 |     // Submit
  422 |     await page.click('button[type="submit"]');
  423 | 
  424 |     // Wait for success toast or list update
  425 |     await page.waitForLoadState('networkidle');
  426 | 
  427 |     // Verify cliente appears in list
  428 |     const clienteText = await page.locator(`text=${newClient.nombre}`).isVisible().catch(() => false);
  429 |     expect(clienteText).toBeTruthy();
  430 |   });
  431 | 
  432 |   test('5.2: Update cliente fields persist', async ({ page }) => {
  433 |     const user = getAgentUser();
  434 |     await login(page, user.email, user.password);
  435 |     await page.goto(`${CONFIG.BASE_URL}/clientes`);
  436 | 
  437 |     // Assume first cliente exists; click edit
  438 |     const firstEditBtn = await page.locator('[data-testid="edit-btn"]').first();
  439 |     if (await firstEditBtn.isVisible().catch(() => false)) {
  440 |       await firstEditBtn.click();
  441 | 
  442 |       // Update a field
  443 |       await page.fill('input[name="nombre"]', 'Updated Cliente Name');
  444 |       await page.click('button[type="submit"]');
  445 | 
  446 |       await page.waitForLoadState('networkidle');
  447 | 
  448 |       // Reload and verify
  449 |       await page.reload();
  450 |       const updatedName = await page.locator('text=Updated Cliente Name').isVisible().catch(() => false);
  451 |       expect(updatedName).toBeTruthy();
  452 |     }
  453 |   });
  454 | 
  455 |   test('5.3: Delete cliente removed from list', async ({ page }) => {
  456 |     const user = getAdminUser();
  457 |     await login(page, user.email, user.password);
  458 |     await page.goto(`${CONFIG.BASE_URL}/clientes`);
  459 | 
  460 |     // Get initial count
```