const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const FAILURES_DIR = path.join(__dirname, 'failures');

// Ensure failures directory exists
if (!fs.existsSync(FAILURES_DIR)) {
  fs.mkdirSync(FAILURES_DIR, { recursive: true });
}

// Find all HTML files recursively
function getHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!['node_modules', '.gemini', '.git', 'tests'].includes(file)) {
        getHtmlFiles(filePath, fileList);
      }
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function auditMobileOverflow() {
  const htmlFiles = getHtmlFiles(ROOT_DIR);
  console.log(`Starting Mobile Overflow Audit on ${htmlFiles.length} HTML files...`);

  const browser = await puppeteer.launch({ headless: 'new' });
  let hasFailures = false;

  for (const file of htmlFiles) {
    const page = await browser.newPage();
    
    // Emulate iPhone SE (320px width) - the most aggressive mobile test
    await page.setViewport({ width: 320, height: 568 });
    
    const fileUrl = 'file:///' + file.replace(/\\/g, '/');
    console.log(`\nTesting: ${path.relative(ROOT_DIR, file)}`);
    
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    // Inject script to detect any element that overflows the screen width
    const overflowElements = await page.evaluate(() => {
      const issues = [];
      // If the document itself is wider than the window, we have a scrollbar issue
      if (document.documentElement.scrollWidth > window.innerWidth) {
        
        // Find specifically which elements are breaking out
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth) {
            // Filter out elements that don't actually contribute to the document width
            if (window.getComputedStyle(el).overflow !== 'hidden' && rect.width > window.innerWidth) {
              issues.push({
                tagName: el.tagName,
                className: el.className,
                id: el.id,
                rightBoundary: rect.right,
                width: rect.width,
                windowWidth: window.innerWidth
              });
            }
          }
        }
      }
      return issues;
    });

    if (overflowElements.length > 0) {
      hasFailures = true;
      const fileName = path.basename(file, '.html');
      const screenshotPath = path.join(FAILURES_DIR, `${fileName}_overflow.png`);
      
      console.error(`❌ FAIL: Horizontal overflow detected in ${path.relative(ROOT_DIR, file)}`);
      
      // Take a screenshot of the broken layout
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`   📸 Saved failure screenshot to: tests/failures/${fileName}_overflow.png`);
      
      console.log(`   Elements causing overflow:`);
      overflowElements.forEach(issue => {
        console.log(`     - <${issue.tagName.toLowerCase()}${issue.id ? ' id="'+issue.id+'"' : ''}${issue.className ? ' class="'+issue.className+'"' : ''}>: width ${Math.round(issue.width)}px (exceeds ${issue.windowWidth}px viewport)`);
      });
    } else {
      console.log(`✅ PASS: No horizontal overflow`);
    }

    await page.close();
  }

  await browser.close();

  if (hasFailures) {
    console.error('\n🚨 AUDIT FAILED: Mobile rendering is broken on one or more pages.');
    process.exit(1);
  } else {
    console.log('\n🎉 AUDIT PASSED: All pages render flawlessly on 320px mobile viewports.');
    process.exit(0);
  }
}

auditMobileOverflow().catch(err => {
  console.error('Audit crashed:', err);
  process.exit(1);
});
