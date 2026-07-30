const https = require('https');
const fs = require('fs');
const path = require('path');

const REPO_OWNER = 'krutideepanpanda';
const REPO_NAME = 'Portfolio-website';

async function checkGitHubActions() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=1`,
      method: 'GET',
      headers: {
        'User-Agent': 'Antigravity-Security-Agent',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const parsed = JSON.parse(data);
          if (parsed.workflow_runs && parsed.workflow_runs.length > 0) {
            const run = parsed.workflow_runs[0];
            resolve({
              status: run.status,
              conclusion: run.conclusion,
              html_url: run.html_url,
              created_at: run.created_at
            });
          } else {
            resolve({ status: 'unknown', conclusion: 'no_runs' });
          }
        } else {
          resolve({ status: 'error', conclusion: `API Error: ${res.statusCode}` });
        }
      });
    });

    req.on('error', (e) => resolve({ status: 'error', conclusion: e.message }));
    req.end();
  });
}

function scanForInjections(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!['node_modules', '.git', '.gemini', 'agents', 'tests', 'scripts'].includes(file)) {
        scanForInjections(filePath, fileList);
      }
    } else if (file.endsWith('.html') || file.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Look for common malicious patterns: eval, base64 encoded payloads, external untrusted domains
      const maliciousPatterns = [
        /eval\s*\(/i,
        /document\.write\s*\(/i,
        /<script[^>]*src=["']https?:\/\/(?!cdnjs\.cloudflare\.com|kit\.fontawesome\.com|cdn\.jsdelivr\.net)[^"']*["']/i // Flag unknown external scripts
      ];

      for (const pattern of maliciousPatterns) {
        if (pattern.test(content)) {
          // Exempt our own script.js which might have some valid logic, though we shouldn't use eval
          fileList.push({ file: filePath, pattern: pattern.toString() });
        }
      }
    }
  }
  return fileList;
}

async function runHealthCheck() {
  console.log("=== ANTIGRAVITY SECURITY HEALTH CHECK ===");
  
  // 1. Check CI Status
  console.log("\n[1] Querying GitHub Actions Status...");
  const ciStatus = await checkGitHubActions();
  console.log(`Latest Run Status: ${ciStatus.status}`);
  console.log(`Latest Conclusion: ${ciStatus.conclusion}`);
  if (ciStatus.html_url) console.log(`URL: ${ciStatus.html_url}`);

  if (ciStatus.conclusion === 'failure') {
    console.error("🚨 CRITICAL: The latest CI pipeline failed! Potential broken deployment.");
  } else if (ciStatus.conclusion === 'success') {
    console.log("✅ CI Pipeline is passing.");
  }

  // 2. Scan for Injections
  console.log("\n[2] Scanning static files for malicious injections...");
  const rootDir = path.resolve(__dirname, '..', '..');
  const injections = scanForInjections(rootDir);
  
  if (injections.length > 0) {
    console.error("🚨 CRITICAL: Anomalous script patterns detected!");
    injections.forEach(inj => {
      console.error(`  - File: ${path.relative(rootDir, inj.file)}\n    Matched Pattern: ${inj.pattern}`);
    });
  } else {
    console.log("✅ No malicious injections found.");
  }

  // Final Verdict
  console.log("\n=========================================");
  if (ciStatus.conclusion === 'failure' || injections.length > 0) {
    console.log("STATUS: FAIL. Immediate agent escalation required.");
    process.exit(1);
  } else {
    console.log("STATUS: SECURE. No threats detected.");
    process.exit(0);
  }
}

runHealthCheck();
