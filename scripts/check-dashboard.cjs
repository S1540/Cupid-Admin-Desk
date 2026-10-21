const { chromium } = require('../node_modules/.cache/dashboard-qa/node_modules/playwright');
const fs = require('node:fs');
let browser;
async function main() {
  browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, timezoneId: 'Asia/Kolkata' });
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') console.log('Console:', message.text().slice(0, 350)); });
  page.on('pageerror', error => errors.push(error.message));
  if (process.argv.includes('--refresh')) {
    const messages=[];
    page.on('console', message=>{if(['warning','error'].includes(message.type())) messages.push({type:message.type(),text:message.text()});});
    const cdp=await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
    for(const route of ['/customers','/orders','/']) {
      await page.goto(`http://localhost:3000${route}`,{waitUntil:'domcontentloaded',timeout:90000});
      await page.getByRole('button',{name:'Refresh data',exact:true}).waitFor({timeout:90000});
      const toggle=page.getByRole('button',{name:'Switch to light mode'});
      if(await toggle.count()) await toggle.click();
      await page.reload({waitUntil:'domcontentloaded',timeout:90000});
      await page.getByRole('button',{name:'Refresh data',exact:true}).waitFor({timeout:90000});
      await page.waitForTimeout(1200);
      console.log('Hard refresh',route,JSON.stringify({messages:messages.splice(0),errors:errors.splice(0),banners:await page.locator('.error-banner').allTextContents()}));
    }
    await browser.close();return;
  }
  if (process.argv.includes('--customers')) {
    let reads=0, targets=0;
    page.on('request', request=>{
      if (!request.url().includes('firestore.googleapis.com')) return;
      if (/runQuery|runAggregationQuery|batchGet/.test(request.url())) reads++;
      const body=request.postData()||"";
      if (/addTarget/.test(decodeURIComponent(body))) targets++;
    });
    await page.goto('http://localhost:3000/customers',{waitUntil:'domcontentloaded',timeout:90000});
    await page.getByRole('button',{name:'Refresh data',exact:true}).waitFor({timeout:90000});
    await page.locator('.customers-table tbody tr').first().waitFor();
    const headers=await page.locator('.customers-table th').allTextContents();
    if(headers.includes('Coins') || !headers.includes('Cart')) throw new Error('Cart must replace Coins in customer rows');
    const initialReads=reads, initialTargets=targets;
    await page.getByLabel('Customers per page').selectOption('10');
    if(await page.locator('.customers-table tbody tr').count()!==10) throw new Error('Customer pagination size');
    await page.getByRole('button',{name:'Next customers page'}).click();
    await page.getByRole('button',{name:'Previous customers page'}).click();
    await page.getByLabel('Sort customers').selectOption('az');
    const names=await page.locator('.customers-table tbody tr td:first-child strong').allTextContents();
    if(names.some((name,i)=>i && names[i-1].localeCompare(name,'en',{sensitivity:'base',numeric:true})>0)) throw new Error('Alphabetical sorting');
    await page.getByLabel('Search customers').fill('no-customer-matches-this-string');
    await page.getByText('No matching customers',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Reset filters'}).click();
    await page.getByLabel('Email verification',{exact:true}).selectOption('verified');
    const statuses=await page.locator('.customers-table tbody tr td:nth-child(4)').allTextContents();
    if(statuses.some(text=>text!=='Verified')) throw new Error('Verification filter');
    await page.getByRole('button',{name:'Reset filters'}).click();
    await page.getByRole('button',{name:'Joined date',exact:true}).click();
    await page.getByLabel('From',{exact:true}).fill('1990-01-01');
    await page.getByLabel('To',{exact:true}).fill('1990-01-01');
    await page.getByRole('button',{name:'Apply dates'}).click();
    await page.getByText('No matching customers',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Reset filters'}).click();
    await page.getByRole('button',{name:/^View customer /}).first().click();
    await page.getByRole('dialog').waitFor();
    await page.getByRole('tab',{name:'Orders',exact:true}).click();
    await page.getByRole('tab',{name:'Saved items',exact:true}).click();
    await page.getByRole('tab',{name:'Profile',exact:true}).click();
    fs.mkdirSync('node_modules/.cache/dashboard-qa/screenshots',{recursive:true});
    await page.screenshot({path:'node_modules/.cache/dashboard-qa/screenshots/customer-profile.png'});
    await page.keyboard.press('Escape');
    const downloadEvent=page.waitForEvent('download');
    await page.getByRole('button',{name:'Export results'}).click();
    const download=await downloadEvent;
    if(!download.suggestedFilename().endsWith('.csv')) throw new Error('CSV export');
    await page.getByRole('link',{name:'Overview',exact:true}).click();
    await page.getByRole('heading',{name:/^Overview/}).waitFor();
    await page.getByRole('link',{name:'Orders',exact:true}).click();
    await page.locator('.orders-table tbody tr').first().waitFor();
    await page.getByRole('link',{name:'Customers',exact:true}).click();
    await page.locator('.customers-table tbody tr').first().waitFor();
    if(reads!==initialReads||targets!==initialTargets) throw new Error(`Repeat Firestore reads: ${reads-initialReads}; targets: ${targets-initialTargets}`);
    await page.screenshot({path:'node_modules/.cache/dashboard-qa/screenshots/customers-dark.png',fullPage:true});
    await page.getByRole('button',{name:'Switch to light mode'}).click();
    await page.screenshot({path:'node_modules/.cache/dashboard-qa/screenshots/customers-light.png',fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:'node_modules/.cache/dashboard-qa/screenshots/customers-mobile.png',fullPage:true});
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw new Error('Customers mobile overflow');
    if(errors.length) throw new Error(errors.join('; '));
    console.log('Customers passed: real records, sorting, filters, pagination, profile tabs, CSV, themes, mobile. No extra Firestore reads or listener targets during filters and route navigation.',{initialReads,initialTargets});
    await browser.close();return;
  }
  if (process.argv.includes('--orders')) {
    await page.goto('http://localhost:3000/orders', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.getByRole('button', { name: 'Refresh data' }).waitFor({ timeout: 90000 });
    if (await page.locator('.error-banner').count()) throw new Error(await page.locator('.error-banner').innerText());
    const count = await page.locator('.orders-table tbody tr').count();
    if (!count) throw new Error('No live orders rendered');
    if (await page.locator('h1').innerText() !== 'Orders') throw new Error('Orders title has extra decoration');
    await page.getByRole('button', { name: 'Order date', exact: true }).click();
    await page.getByLabel('From', { exact: true }).fill('1990-01-01');
    await page.getByLabel('To', { exact: true }).fill('1990-01-01');
    await page.getByRole('button', { name: 'Apply dates' }).click();
    if (await page.locator('.orders-table tbody tr').count()) throw new Error('Date filter did not exclude modern orders');
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.getByRole('button', { name: /^Actions for/ }).first().click();
    await page.getByRole('button', { name: 'Update statuses', exact: true }).click();
    if (!await page.getByRole('button', { name: 'Save changes', exact: true }).isDisabled()) throw new Error('Unchanged record should not save');
    await page.getByLabel('Update delivery status', { exact: true }).fill('DELIVERED');
    if (await page.getByRole('button', { name: 'Save changes', exact: true }).isDisabled()) throw new Error('Edited record cannot save');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('button', { name: /^Actions for/ }).first().click();
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
    const download = await downloadEvent;
    if (!download.suggestedFilename().endsWith('.pdf')) throw new Error('PDF download missing');
    const pdfPath = await download.path();
    if (!fs.readFileSync(pdfPath).subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error('Downloaded file is not a PDF');
    console.log('Calendar filtering, status editor and PDF download passed. No live order was changed.');
    if (await page.locator('.nav-item.is-active').innerText() !== 'Orders') throw new Error('Wrong active navigation');
    const colors = await page.locator('.nav-item').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).color));
    if (colors[0] === colors[1]) throw new Error('Active and inactive colors match');
    await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).click();
    await page.getByRole('button', { name: 'Expand sidebar', exact: true }).click();
    await page.getByLabel('Filter order status', { exact: true }).selectOption('paid');
    const paid = await page.locator('.orders-table tbody tr').count();
    if (!paid || paid >= count) throw new Error('Status filter failed');
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.getByLabel('Orders per page').selectOption('5');
    if (count > 5) {
      await page.getByRole('button', { name: 'Next orders page' }).click();
      await page.getByRole('button', { name: 'Previous orders page' }).click();
    }
    await page.locator('.order-reference').first().click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    if (await page.getByRole('dialog').count()) throw new Error('Details did not close');
    fs.mkdirSync('node_modules/.cache/dashboard-qa/screenshots', { recursive: true });
    await page.screenshot({ path: 'node_modules/.cache/dashboard-qa/screenshots/orders-dark.png', fullPage: true });
    await page.getByRole('button', { name: 'Switch to light mode' }).click();
    await page.screenshot({ path: 'node_modules/.cache/dashboard-qa/screenshots/orders-light.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'node_modules/.cache/dashboard-qa/screenshots/orders-mobile.png', fullPage: true });
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Mobile overflow');
    if (errors.length) throw new Error(errors.join('; '));
    console.log('Orders passed: live records, active navigation, collapse/expand, payment filter, pagination, details, themes and mobile.', { count, paid });
    await browser.close(); return;
  }
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.getByRole('button', { name: 'Refresh data' }).waitFor({ timeout: 90000 });
  const metrics = await page.locator('.metric-value').allTextContents();
  if (await page.getByLabel('Date range', { exact: true }).inputValue() !== 'Last 30 days') throw new Error('Default is not Last 30 days');
  await page.waitForTimeout(1600);
  if (process.argv.includes('--inspect')) {
    await page.waitForTimeout(1200);
    console.log('Chart geometry:', await page.locator('.acquisition-panel .chart-container').evaluate(el => {
      const box = node => { const r = node?.getBoundingClientRect(); return r ? { x:r.x, y:r.y, width:r.width, height:r.height } : null; };
      const path = el.querySelector('.registration-series .recharts-area-curve');
      const style = path && getComputedStyle(path);
      return { container:box(el), responsive:box(el.querySelector('.recharts-responsive-container')), svg:box(el.querySelector('svg')), path:box(path), stroke:style?.stroke, strokeWidth:style?.strokeWidth, opacity:style?.opacity, clipPath:style?.clipPath, animations:path?.getAnimations().map(a=>({state:a.playState,time:a.currentTime})), ticks:[...el.querySelectorAll('.recharts-cartesian-axis-tick-value')].map(n=>({text:n.textContent, box:box(n)})) };
    }));
    await browser.close();
    return;
  }
  const dayTicks = await page.locator('.acquisition-panel .recharts-cartesian-axis-tick-value[text-anchor="middle"]').allTextContents();
  if (dayTicks.length < 5) throw new Error(`Expected readable daily ticks, saw ${dayTicks.length}`);
  console.log('Default daily ticks:', dayTicks);
  const statBoxes = await page.locator('.metric-card').evaluateAll(nodes => nodes.map(node => ({ top: node.getBoundingClientRect().top, height: node.getBoundingClientRect().height })));
  console.log('Stat card dimensions:', statBoxes);
  if (statBoxes.length !== 5 || statBoxes.some(box => Math.abs(box.top - statBoxes[0].top) > 1)) throw new Error('Five compact stats must share one desktop row');
  if (statBoxes.some(box => box.height > 165)) throw new Error('Stats are taller than the compact design permits');
  if (await page.locator('.acquisition-panel .chart-legend').innerText() !== 'New Login') throw new Error('New Login legend is missing');
  console.log('Live metric values:', metrics);
  console.log('Error banners:', await page.locator('.error-banner').count());
  console.log('Initial runtime errors:', errors);
  if (metrics[0] === '—') throw new Error('Live user count did not load');
  fs.mkdirSync('node_modules/.cache/dashboard-qa/screenshots', { recursive: true });
  await page.screenshot({ path: 'node_modules/.cache/dashboard-qa/screenshots/desktop.png', fullPage: true });
  if (process.argv.includes('--quick')) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(700);
    await page.screenshot({ path: 'node_modules/.cache/dashboard-qa/screenshots/mobile.png', fullPage: true });
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error('Mobile viewport overflow');
    console.log('Five compact stats, ten daily ticks, labels and mobile layout passed');
    if (errors.length) throw new Error(errors.join('; '));
    await browser.close();
    return;
  }
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  if (await page.locator('html').getAttribute('data-theme') !== 'light') throw new Error('Light theme did not activate');
  const lightBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  if (lightBackground !== 'rgb(234, 234, 237)') throw new Error(`Light theme CSS failed: ${lightBackground}`);
  await page.screenshot({ path: 'node_modules/.cache/dashboard-qa/screenshots/light.png', fullPage: true });
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await page.getByRole('button', { name: 'Refresh data' }).click();
  await page.getByRole('progressbar', { name: 'Refreshing analytics' }).waitFor();
  await page.getByRole('button', { name: 'Refresh data' }).waitFor({ timeout: 90000 });
  const chartColor = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--chart-order').trim());
  if (!chartColor) throw new Error('Chart theme tokens missing');
  if (process.argv.includes('--quick')) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'node_modules/.cache/dashboard-qa/screenshots/mobile.png', fullPage: true });
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error('Mobile viewport overflow');
    console.log('Five compact stats, ten daily ticks, labels and both themes passed');
    if (errors.length) throw new Error(errors.join('; '));
    await browser.close();
    return;
  }
  await page.getByRole('button', { name: 'Collapse sidebar' }).focus();
  await page.keyboard.press('Enter');
  if (!await page.locator('.sidebar').evaluate(el => el.classList.contains('is-collapsed'))) throw new Error('Sidebar did not collapse');
  await page.getByLabel('Date range', { exact: true }).selectOption('Today');
  await page.getByLabel('Compare with').selectOption('previous');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await page.getByRole('button', { name: 'Refresh data' }).waitFor({ timeout: 90000 });
  console.log('Today metric values:', await page.locator('.metric-value').allTextContents());
  const todayValues = await page.locator('.metric-value').allTextContents();
  if (todayValues.length !== 5) throw new Error('Expected four filtered metrics and one current cart snapshot');
  const customerSummary = await page.locator('.acquisition-panel .chart-summary > strong').innerText();
  if (todayValues[0] !== customerSummary) throw new Error('Customer card and chart disagree on selected-period total');
  if (await page.locator('.metric-comparison').count() !== 4) throw new Error('Period comparisons are missing');
  console.log('Today comparisons:', await page.locator('.metric-comparison').allTextContents());
  await page.waitForTimeout(2000);
  if (Number(todayValues[0].replaceAll(',', '')) > 0 && await page.locator('.registration-dot').count() < 2) throw new Error('Today chart is not showing hourly points');
  await page.screenshot({ path: 'node_modules/.cache/dashboard-qa/screenshots/today.png', fullPage: true });
  await page.getByLabel('Compare with').selectOption('off');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await page.getByRole('button', { name: 'Refresh data' }).waitFor({ timeout: 90000 });
  if (await page.locator('.metric-comparison').count()) throw new Error('Comparison did not turn off');
  await page.getByLabel('Date range', { exact: true }).selectOption('All time');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await page.getByRole('button', { name: 'Refresh data' }).waitFor({ timeout: 90000 });
  const allTimeValues = await page.locator('.metric-value').allTextContents();
  console.log('All-time values:', allTimeValues);
  if (Number(allTimeValues[0].replaceAll(',', '')) < Number(todayValues[0].replaceAll(',', ''))) throw new Error('All-time customers are smaller than today');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByRole('button', { name: 'Refresh data' }).waitFor({ timeout: 90000 });
  await page.getByLabel('Customer email verification, affects customer analytics only').selectOption('verified');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await page.getByRole('button', { name: 'Refresh data' }).waitFor({ timeout: 90000 });
  console.log('Verified segment:', await page.locator('.metric-value').allTextContents(), 'errors:', await page.locator('.error-banner').innerText().catch(() => 'none'));
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByRole('button', { name: 'Refresh data' }).waitFor({ timeout: 90000 });
  const status = page.getByLabel('Order status, affects order analytics only');
  const statusOptions = await status.locator('option').evaluateAll(options => options.map(o => o.value));
  if (statusOptions.length > 1) {
    await status.selectOption(statusOptions[1]);
    await page.getByRole('button', { name: 'Apply filters' }).click();
    await page.getByRole('button', { name: 'Refresh data' }).waitFor({ timeout: 90000 });
    console.log('Order status segment:', await page.locator('.metric-value').allTextContents());
  }
  const next = page.getByRole('button', { name: 'Next customer page' });
  if (await next.isEnabled()) { await next.click(); await page.getByText('Page 2', { exact: true }).waitFor(); }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'node_modules/.cache/dashboard-qa/screenshots/mobile.png', fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) throw new Error('Mobile document overflows viewport');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Close navigation' }).waitFor();
  await page.keyboard.press('Escape');
  if (await page.locator('.sidebar.is-open').count()) throw new Error('Escape did not close drawer');
  console.log('Browser errors:', errors);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const movingDots = await page.locator('.registration-dot-core, .latest-dot-halo').evaluateAll(nodes => nodes.some(node => getComputedStyle(node).animationName !== 'none'));
  if (movingDots) throw new Error('Chart animations ignored reduced-motion preference');
  if (errors.length) throw new Error('Browser runtime errors found');
  console.log('Desktop/mobile, filtering, pagination and drawer checks passed');
  await browser.close();
}
main().catch(async error => { console.error(error.message); await browser?.close(); process.exitCode = 1; });






