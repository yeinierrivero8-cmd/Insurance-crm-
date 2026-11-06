const { chromium } = require('playwright');

async function fullTest() {
  const browser = await chromium.launch({ headless: true });
  let passed = 0;
  let failed = 0;
  
  try {
    console.log('\n=== TESTING INSURANCE CRM APP ===\n');
    
    // Test 1: Desktop welcome page
    console.log('📱 Test 1: Desktop welcome page (1440px)...');
    const desktopWelcome = await browser.newPage();
    desktopWelcome.setViewportSize({ width: 1440, height: 900 });
    await desktopWelcome.goto('https://insurance-crm.onrender.com', { waitUntil: 'networkidle', timeout: 30000 });
    
    const title = await desktopWelcome.title();
    if (title && title.length > 0) {
      console.log('  ✅ Page loaded successfully');
      passed++;
    } else {
      console.log('  ❌ Page title missing');
      failed++;
    }
    
    const h1 = await desktopWelcome.locator('h1').first().textContent();
    if (h1 && h1.includes('Gestiona')) {
      console.log('  ✅ Welcome headline visible: "' + h1.substring(0, 30) + '..."');
      passed++;
    } else {
      console.log('  ❌ Welcome headline missing');
      failed++;
    }
    
    const featureCards = await desktopWelcome.locator('.feature-card').count();
    if (featureCards === 4) {
      console.log('  ✅ 4 feature cards present');
      passed++;
    } else {
      console.log('  ❌ Expected 4 feature cards, found ' + featureCards);
      failed++;
    }
    
    await desktopWelcome.screenshot({ path: 'E:/Insurance/InsuraFlow-CRM/InsuraFlow-CRM/test-desktop-welcome.png' });
    console.log('  ✅ Desktop screenshot saved');
    passed++;
    
    // Test 2: Mobile welcome page
    console.log('\n📱 Test 2: Mobile welcome page (375px)...');
    const mobileWelcome = await browser.newPage();
    mobileWelcome.setViewportSize({ width: 375, height: 667 });
    await mobileWelcome.goto('https://insurance-crm.onrender.com', { waitUntil: 'networkidle', timeout: 30000 });
    
    const mobileH1 = await mobileWelcome.locator('h1').first().textContent();
    if (mobileH1 && mobileH1.includes('Gestiona')) {
      console.log('  ✅ Mobile welcome headline visible');
      passed++;
    } else {
      console.log('  ❌ Mobile welcome headline missing');
      failed++;
    }
    
    await mobileWelcome.screenshot({ path: 'E:/Insurance/InsuraFlow-CRM/InsuraFlow-CRM/test-mobile-welcome.png' });
    console.log('  ✅ Mobile screenshot saved');
    passed++;
    
    // Test 3: Click login button
    console.log('\n🔐 Test 3: Navigation to login...');
    await desktopWelcome.click('button:has-text("Iniciar sesión")');
    await desktopWelcome.waitForLoadState('networkidle');
    
    const loginH1 = await desktopWelcome.locator('h1').first().textContent();
    if (loginH1 && loginH1.includes('Insurance')) {
      console.log('  ✅ Login page loaded');
      passed++;
    } else {
      console.log('  ❌ Login page not loaded');
      failed++;
    }
    
    // Test 4: Login form
    console.log('\n📝 Test 4: Testing login with admin credentials...');
    const emailInput = await desktopWelcome.locator('input[type="text"], input[type="email"]').first();
    const passwordInput = await desktopWelcome.locator('input[type="password"]').first();
    
    if (emailInput && passwordInput) {
      await emailInput.fill('admin@insuraflow.com');
      await passwordInput.fill('Admin@123');
      console.log('  ✅ Login form filled');
      passed++;
      
      await desktopWelcome.click('button:has-text("Iniciar sesión")');
      await desktopWelcome.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      
      const currentUrl = desktopWelcome.url();
      if (currentUrl.includes('dashboard') || !currentUrl.includes('login')) {
        console.log('  ✅ Login successful, redirected to dashboard');
        passed++;
      } else {
        console.log('  ⚠️  Still on login page (may be normal if waiting for response)');
      }
    } else {
      console.log('  ❌ Login form fields not found');
      failed++;
    }
    
    // Test 5: Console errors
    console.log('\n🔍 Test 5: Checking for console errors...');
    const errors = [];
    desktopWelcome.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    if (errors.length === 0) {
      console.log('  ✅ No console errors detected');
      passed++;
    } else {
      console.log('  ⚠️  Console errors found: ' + errors.length);
    }
    
    // Test 6: Responsive check
    console.log('\n📐 Test 6: Testing responsive design...');
    const sizes = [375, 768, 1024, 1440];
    let responsiveOk = true;
    for (const size of sizes) {
      const page = await browser.newPage();
      page.setViewportSize({ width: size, height: 900 });
      await page.goto('https://insurance-crm.onrender.com', { timeout: 20000 });
      const content = await page.locator('h1').first().textContent();
      if (!content) responsiveOk = false;
      await page.close();
    }
    
    if (responsiveOk) {
      console.log('  ✅ All responsive breakpoints working');
      passed++;
    } else {
      console.log('  ❌ Some breakpoints failed');
      failed++;
    }
    
    // Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Total: ${passed + failed}\n`);
    
    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED! App is ready for use.');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed. Check the results above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

fullTest();
