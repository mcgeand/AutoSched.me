# Security Scanning Integration Implementation Guide

**Related**: [AUT-87 Spike Decisions](../spikes/AUT-87-security-scanning-integration-decisions.md)  
**Status**: Ready for Implementation  
**Owner**: Security Team with CI/CD and DevOps coordination

## Overview

This guide covers implementing risk-based security scanning integrated with the CI/CD pipeline, balancing comprehensive security coverage with performance constraints established in AUT-85 and AUT-86.

## Security Tool Configuration

### Dependency Vulnerability Scanning

#### npm audit Configuration
```json
// .npmrc - npm audit configuration
audit-level=high
audit-signatures=true
fund=false
```

#### Snyk Integration
```yaml
# .github/workflows/security-dependency-scan.yml
name: Dependency Security Scan
on: [push, pull_request]

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run npm audit
        run: npm audit --audit-level=high
        continue-on-error: true
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high --fail-on=all
          command: test
```

### Secret Scanning Configuration

#### GitLeaks Setup
```toml
# .gitleaks.toml
title = "AutoSched.me Secret Scanning"

[extend]
useDefault = true

[[rules]]
description = "OAuth Client Secret"
regex = '''client_secret['"]\s*[:=]\s*['"][0-9a-zA-Z\-_]{20,}['"]'''
tags = ["oauth", "secret"]

[[rules]]
description = "Database Connection String" 
regex = '''postgresql://[^'"\\s]+'''
tags = ["database", "connection"]

[[rules]]
description = "Linear API Key"
regex = '''lin_api_[0-9a-fA-F]{40}'''
tags = ["linear", "api-key"]

[allowlist]
description = "Test fixtures and documentation"
paths = [
  '''fixtures/.*\.sql''',
  '''docs/.*\.md''',
  '''README\.md'''
]
```

#### TruffleHog Configuration
```yaml
# .trufflehog.yml
git:
  maxDepth: 100
  bare: false

detectors:
- name: all

verify: true
includeDetectors:
- github
- gitlab
- aws
- gcp
- slack
- stripe
- twilio

excludeDetectors:
- generic
```

### SAST Configuration

#### Semgrep Rules
```yaml
# .semgrep.yml
rules:
- id: sql-injection-risk
  pattern: |
    $DB.query($QUERY)
  message: Potential SQL injection vulnerability
  languages: [typescript, javascript]
  severity: ERROR
  
- id: hardcoded-secrets
  pattern: |
    const $VAR = "$SECRET"
  message: Potential hardcoded secret
  languages: [typescript, javascript]
  severity: WARNING
  metadata:
    category: security
    
- id: oauth-token-exposure
  pattern: |
    console.log(..., $TOKEN, ...)
  message: OAuth token potentially logged
  languages: [typescript, javascript]
  severity: ERROR
  
- id: unsafe-eval
  pattern: eval($CODE)
  message: Use of eval() is dangerous
  languages: [typescript, javascript]
  severity: ERROR
```

### Container Security Scanning

#### Trivy Configuration
```yaml
# .trivyignore
# Ignore low severity vulnerabilities in development dependencies
CVE-2021-44906  # minimist prototype pollution (dev dependency)
CVE-2022-25883  # semver ReDoS (acceptable risk in CI)

# Trivy config
# trivy.yaml
format: sarif
exit-code: 1
severity: HIGH,CRITICAL
ignore-unfixed: true
```

## CI Pipeline Integration

### Parallel Security Scan Workflow
```yaml
# .github/workflows/security-baseline.yml
name: Security Baseline Scan
on: 
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    
    strategy:
      fail-fast: true
      matrix:
        scan-type: [dependencies, secrets, sast]
        
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for secret scanning
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
        if: matrix.scan-type == 'dependencies'
      
      - name: Cache Security Tools
        uses: actions/cache@v4
        with:
          path: |
            ~/.cache/snyk
            ~/.cache/semgrep
            /tmp/gitleaks-cache
          key: security-tools-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
          restore-keys: security-tools-${{ runner.os }}-
      
      - name: Run Security Scan
        run: |
          case "${{ matrix.scan-type }}" in
            dependencies)
              echo "Running dependency security scan..."
              npm ci
              npm audit --audit-level=high
              if [ -n "$SNYK_TOKEN" ]; then
                npx snyk test --severity-threshold=high
              else
                echo "Snyk token not available, skipping enhanced scan"
              fi
              ;;
            secrets)
              echo "Running secret detection scan..."
              # Install tools if not cached
              if ! command -v gitleaks &> /dev/null; then
                curl -sSfL https://github.com/zricethezav/gitleaks/releases/latest/download/gitleaks_linux_x64.tar.gz | tar -xz
                sudo mv gitleaks /usr/local/bin/
              fi
              if ! command -v trufflehog &> /dev/null; then
                curl -sSfL https://github.com/trufflesecurity/trufflehog/releases/latest/download/trufflehog_linux_amd64.tar.gz | tar -xz
                sudo mv trufflehog /usr/local/bin/
              fi
              
              # Run secret scans
              gitleaks detect --source . --verbose --config .gitleaks.toml
              trufflehog git file://. --only-verified --config .trufflehog.yml
              ;;
            sast)
              echo "Running static analysis security scan..."
              if ! command -v semgrep &> /dev/null; then
                pip install semgrep
              fi
              semgrep --config=auto --config=.semgrep.yml --error --strict --timeout=60
              ;;
          esac
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Upload Security Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: security-scan-results-${{ matrix.scan-type }}
          path: |
            security-results-*.json
            security-results-*.sarif
```

### Weekly Comprehensive Security Scan
```yaml
# .github/workflows/security-comprehensive.yml
name: Comprehensive Security Scan
on:
  schedule:
    - cron: '0 2 * * 1'  # Monday 2 AM
  workflow_dispatch:

jobs:
  comprehensive-security:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Full Dependency Analysis
        run: |
          npm audit --audit-level=moderate
          npx snyk test --severity-threshold=medium
          npx snyk monitor  # Send results to Snyk dashboard
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Deep Secret Analysis
        run: |
          gitleaks detect --source . --verbose --config .gitleaks.toml
          trufflehog git file://. --config .trufflehog.yml
      
      - name: Full SAST Analysis
        run: |
          semgrep --config=auto --config=.semgrep.yml --json --output=sast-results.json
          semgrep --config=security --config=.semgrep.yml
      
      - name: Container Security Scan
        run: |
          docker build -t autosched/app:security-test .
          trivy image --format sarif --output container-results.sarif autosched/app:security-test
          trivy image --severity HIGH,CRITICAL autosched/app:security-test
      
      - name: Generate Security Report
        run: |
          echo "# Weekly Security Report" > security-report.md
          echo "Generated: $(date)" >> security-report.md
          echo "" >> security-report.md
          
          # Aggregate results from all scans
          if [ -f sast-results.json ]; then
            echo "## SAST Findings" >> security-report.md
            jq -r '.results[] | select(.extra.severity == "ERROR") | "- \(.check_id): \(.extra.message)"' sast-results.json >> security-report.md
          fi
      
      - name: Post to Slack
        if: always()
        run: |
          curl -X POST ${{ secrets.SECURITY_SLACK_HOOK }} \
            -H 'Content-type: application/json' \
            -d '{"text": "📊 Weekly security scan completed. Check GitHub Actions for detailed results."}'
```

## Security Alert Management

### Alert Routing Script
```bash
#!/bin/bash
# scripts/security-alert-handler.sh

SEVERITY="$1"
FINDING="$2"
FILE_PATH="$3"
LINE_NUMBER="$4"

# Slack webhook for immediate alerts
SECURITY_SLACK_HOOK="${SECURITY_SLACK_HOOK}"
LINEAR_API_KEY="${LINEAR_API_KEY}"

case $SEVERITY in
  critical)
    # Critical: Immediate alert + Linear ticket + Block CI
    MESSAGE="🚨 CRITICAL Security Vulnerability Detected!
    
Finding: $FINDING
File: $FILE_PATH:$LINE_NUMBER
Action: Build blocked - immediate fix required
Team: Security team notified"
    
    # Slack alert
    curl -X POST "$SECURITY_SLACK_HOOK" \
      -H 'Content-type: application/json' \
      -d "{\"text\": \"$MESSAGE\", \"channel\": \"#security-alerts\"}"
    
    # Create Linear ticket
    curl -X POST https://api.linear.app/graphql \
      -H "Authorization: Bearer $LINEAR_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"query\": \"mutation { issueCreate(input: { title: \\\"CRITICAL Security: $FINDING\\\", description: \\\"File: $FILE_PATH:$LINE_NUMBER\\\\nSeverity: Critical\\\\nAction Required: Immediate fix\\\", priority: 1 }) { success issue { id url } } }\"}"
    
    exit 1  # Block build
    ;;
    
  high)
    # High: Alert + Linear ticket + Block CI
    MESSAGE="⚠️ HIGH Security Vulnerability Detected
    
Finding: $FINDING
File: $FILE_PATH:$LINE_NUMBER
Action: Build blocked - fix required within 7 days"
    
    curl -X POST "$SECURITY_SLACK_HOOK" \
      -H 'Content-type: application/json' \
      -d "{\"text\": \"$MESSAGE\", \"channel\": \"#security-alerts\"}"
    
    curl -X POST https://api.linear.app/graphql \
      -H "Authorization: Bearer $LINEAR_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"query\": \"mutation { issueCreate(input: { title: \\\"HIGH Security: $FINDING\\\", description: \\\"File: $FILE_PATH:$LINE_NUMBER\\\\nSeverity: High\\\\nSLA: 7 days\\\", priority: 2 }) { success issue { id url } } }\"}"
    
    exit 1  # Block build
    ;;
    
  medium)
    # Medium: Daily digest + Linear ticket (no block)
    echo "$(date): MEDIUM - $FINDING ($FILE_PATH:$LINE_NUMBER)" >> /tmp/security-digest-$(date +%Y-%m-%d).txt
    
    curl -X POST https://api.linear.app/graphql \
      -H "Authorization: Bearer $LINEAR_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"query\": \"mutation { issueCreate(input: { title: \\\"MEDIUM Security: $FINDING\\\", description: \\\"File: $FILE_PATH:$LINE_NUMBER\\\\nSeverity: Medium\\\\nSLA: 30 days\\\", priority: 3 }) { success issue { id url } } }\"}"
    
    exit 0  # Allow build
    ;;
    
  low)
    # Low: Daily digest only
    echo "$(date): LOW - $FINDING ($FILE_PATH:$LINE_NUMBER)" >> /tmp/security-digest-$(date +%Y-%m-%d).txt
    exit 0  # Allow build
    ;;
esac
```

### Daily Digest Aggregation
```bash
#!/bin/bash
# scripts/security-daily-digest.sh

DIGEST_FILE="/tmp/security-digest-$(date +%Y-%m-%d).txt"

if [ -f "$DIGEST_FILE" ]; then
  FINDING_COUNT=$(wc -l < "$DIGEST_FILE")
  
  if [ "$FINDING_COUNT" -gt 0 ]; then
    MESSAGE="📋 Daily Security Digest - $(date +%Y-%m-%d)

$FINDING_COUNT security findings requiring review:

$(cat "$DIGEST_FILE")

View full details in Linear security tickets."
    
    curl -X POST "$SECURITY_SLACK_HOOK" \
      -H 'Content-type: application/json' \
      -d "{\"text\": \"$MESSAGE\", \"channel\": \"#security-digest\"}"
  fi
  
  # Cleanup digest file
  rm "$DIGEST_FILE"
fi
```

## Performance Optimization

### Incremental Scanning for PRs
```bash
#!/bin/bash
# scripts/incremental-security-scan.sh

BASE_BRANCH="${GITHUB_BASE_REF:-dev}"
CURRENT_BRANCH="${GITHUB_HEAD_REF:-$(git branch --show-current)}"

echo "Running incremental security scan: $BASE_BRANCH..$CURRENT_BRANCH"

# Get changed files
CHANGED_FILES=$(git diff --name-only origin/$BASE_BRANCH...HEAD)
echo "Changed files: $CHANGED_FILES"

# Only scan changed files for secrets
if echo "$CHANGED_FILES" | grep -E '\.(js|ts|json|yml|yaml)$'; then
  echo "Scanning changed files for secrets..."
  echo "$CHANGED_FILES" | xargs gitleaks protect --staged
fi

# Check if package.json or package-lock.json changed
if echo "$CHANGED_FILES" | grep -E 'package(-lock)?\.json$'; then
  echo "Dependencies changed, running dependency scan..."
  npm audit --audit-level=high
  npx snyk test --severity-threshold=high
else
  echo "No dependency changes detected, skipping dependency scan"
fi

# Check if source code changed
if echo "$CHANGED_FILES" | grep -E '\.(js|ts)$'; then
  echo "Source code changed, running SAST on modified files..."
  echo "$CHANGED_FILES" | grep -E '\.(js|ts)$' | xargs semgrep --config=auto --config=.semgrep.yml
else
  echo "No source code changes detected, skipping SAST"
fi
```

### Security Tool Caching
```yaml
# Optimized caching for security tools
- name: Cache Security Tools and Databases
  uses: actions/cache@v4
  with:
    path: |
      ~/.cache/snyk
      ~/.cache/semgrep
      ~/.local/share/semgrep
      ~/.cache/trivy
      /tmp/gitleaks-cache
      /usr/local/bin/gitleaks
      /usr/local/bin/trufflehog
    key: security-tools-${{ runner.os }}-${{ hashFiles('package-lock.json', '.gitleaks.toml', '.semgrep.yml') }}
    restore-keys: |
      security-tools-${{ runner.os }}-
      security-tools-
```

## Monitoring and Metrics

### Security Metrics Collection
```bash
#!/bin/bash
# scripts/collect-security-metrics.sh

METRICS_FILE="security-metrics-$(date +%Y-%m-%d).json"

{
  echo "{"
  echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"scan_duration\": {"
  echo "    \"dependencies\": $DEPENDENCY_SCAN_DURATION,"
  echo "    \"secrets\": $SECRET_SCAN_DURATION,"
  echo "    \"sast\": $SAST_SCAN_DURATION"
  echo "  },"
  echo "  \"findings\": {"
  echo "    \"critical\": $(grep -c "CRITICAL" security-results.log || echo 0),"
  echo "    \"high\": $(grep -c "HIGH" security-results.log || echo 0),"
  echo "    \"medium\": $(grep -c "MEDIUM" security-results.log || echo 0),"
  echo "    \"low\": $(grep -c "LOW" security-results.log || echo 0)"
  echo "  },"
  echo "  \"tools_used\": ["
  echo "    \"npm-audit\","
  echo "    \"snyk\","
  echo "    \"gitleaks\","
  echo "    \"trufflehog\","
  echo "    \"semgrep\""
  echo "  ]"
  echo "}"
} > "$METRICS_FILE"

# Upload metrics to monitoring system (if configured)
if [ -n "$METRICS_ENDPOINT" ]; then
  curl -X POST "$METRICS_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d @"$METRICS_FILE"
fi
```

## Troubleshooting Guide

### Common Issues

#### Snyk API Rate Limiting
```bash
# Fallback when Snyk API limits hit
if ! npx snyk test --severity-threshold=high 2>/dev/null; then
  echo "Snyk API limit reached, falling back to npm audit"
  npm audit --audit-level=high
fi
```

#### Large Repository Performance
```bash
# Optimize for large repositories
if [ $(find . -name "*.js" -o -name "*.ts" | wc -l) -gt 1000 ]; then
  echo "Large repository detected, using optimized scanning"
  # Use incremental scanning
  git diff --name-only HEAD~1 | grep -E '\.(js|ts)$' | xargs semgrep --config=.semgrep.yml
else
  # Full scan for smaller repositories
  semgrep --config=auto --config=.semgrep.yml .
fi
```

#### Container Build Failures
```bash
# Handle Docker build failures gracefully
if ! docker build -t autosched/app:security-test .; then
  echo "Docker build failed, skipping container security scan"
  echo "::warning::Container security scan skipped due to build failure"
  exit 0
fi
```

### Performance Tuning

#### Parallel Execution Optimization
- **Resource allocation**: Limit concurrent scans based on runner capacity
- **Tool selection**: Use faster alternatives for daily CI (npm audit vs Snyk)
- **Timeout management**: Set aggressive timeouts to prevent hanging scans
- **Early termination**: Stop remaining scans if critical vulnerability found

#### Caching Optimization
- **Tool binaries**: Cache downloaded security tools between runs
- **Vulnerability databases**: Cache Snyk/Trivy databases with daily refresh
- **Scan results**: Cache results by file hash to avoid re-scanning unchanged code
- **Dependencies**: Leverage npm cache for faster dependency analysis

---

**Implementation Status**: Ready for AUT-9 integration  
**Next Steps**: Security tool deployment and CI pipeline integration testing