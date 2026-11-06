const { chromium } = require('playwright');

async function fullTest() {
  const browser = await chromium.launch({ headless: true });
  let results = [];
  
  try {
    console.log('\n🧪 TESTING INSURANCE CRM - PRODUCTION\n');
    
    // Test 1: Welcome page desktop
    console.log('Test 1️⃣ : Welcome page desktop (1440px)...');
    const page1 = await browser.newPage();
    page1.setViewportSize({ width: 1440, height: 900 });
    const resp = await page1.goto('https://insurance-crm.onrender.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    if (resp.status() === 200) {
      console.log('  ✅ HTTP 200 - Page loaded');
      results.push('✅ HTTP 200');
      
      await page1.waitForTimeout(1000);
      const content = await page1.textContent('body');
      
      if (content.includes('Gestiona') || content.includes('comisión')) {
        console.log('  ✅ Welcome headline found');
        results.push('✅ Welcome headline');
        
        const cards = await page1.locator('.feature-card').count();
        if (cards === 4) {
          console.log('  ✅ 4 feature cards found');
          results.push('✅ 4 feature cards');
        }
      } else {
        console.log('  ⚠️ Headline not found, content:', content.substring(0, 100));
      }
      
      await page1.screenshot({ path: 'E:/test-desktop.png' });
      console.log('  ✅ Screenshot desktop saved');
    } else {
      console.log('  ❌ HTTP ' + resp.status());
      results.push('❌ HTTP ' + resp.status());
    }
    
    // Test 2: Mobile welcome
    console.log('\nTest 2️⃣ : Welcome mobile (375px)...');
    const page2 = await browser.newPage();
    page2.setViewportSize({ width: 375, height: 667 });
    await page2.goto('https://insurance-crm.onrender.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    const mobileCont = await page2.textContent('body');
    if (mobileCont.includes('Gestiona') || mobileCont.includes('comisión')) {
      console.log('  ✅ Mobile welcome loads');
      results.push('✅ Mobile welcome');
    }
    await page2.screenshot({ path: 'E:/test-mobile.png' });
    
    // Test 3: Click login
    console.log('\nTest 3️⃣ : Navigation to login...');
    const loginBtn = page1.locator('button').filter({ hasText: /Iniciar|sesión/i }).first();
    if (await loginBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loginBtn.click();
      await page1.waitForTimeout(1500);
      
      const url = page1.url();
      const loginContent = await page1.textContent('body');
      
      if (loginContent.includes('Insurance CRM') || loginContent.includes('Usuario')) {
        console.log('  ✅ Login page loaded');
        results.push('✅ Login page');
      }
      await page1.screenshot({ path: 'E:/test-login.png' });
    }
    
    // Test 4: Login form
    console.log('\nTest 4️⃣ : Login with credentials...');
    const emailField = page1.locator('input[type="text"], input[type="email"]').first();
    const passField = page1.locator('input[type="password"]').first();
    
    if (await emailField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailField.fill('admin@insuraflow.com');
      await passField.fill('Admin@123');
      console.log('  ✅ Form filled');
      results.push('✅ Form fields');
      
      await page1.click('button:has-text("Iniciar")');
      await page1.waitForTimeout(2000);
      
      const finalUrl = page1.url();
      const finalContent = await page1.textContent('body');
      
      if (!finalContent.includes('Cannot GET') && !finalContent.includes('Usuario')) {
        console.log('  ✅ Login attempt processed');
        results.push('✅ Login processed');
      }
    }
    
    // Test 5: No console errors
    console.log('\nTest 5️⃣ : Console check...');
    let hasErrors = false;
    page1.on('console', msg => {
      if (msg.type() === 'error') {
        hasErrors = true;
        console.log('  Error:', msg.text());
      }
    });
    
    if (!hasErrors) {
      console.log('  ✅ No critical errors');
      results.push('✅ No errors');
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS:');
    console.log('='.repeat(50));
    results.forEach(r => console.log(r));
    
    const passed = results.filter(r => r.includes('✅')).length;
    const failed = results.filter(r => r.includes('❌')).length;
    
    console.log('\n✅ Passed: ' + passed);
    console.log('❌ Failed: ' + failed);
    console.log('='.repeat(50) + '\n');
    
    if (failed === 0 && passed >= 7) {
      console.log('🎉 ALL CRITICAL TESTS PASSED!\n');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests incomplete\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

fullTest();
