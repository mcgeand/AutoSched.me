# AUT-87: Security Scanning Integration Strategy - Decision Record

**Date**: 2025-08-16  
**Participants**: Security Specialist (lead), CI/CD Specialist, DevOps Specialist  
**Status**: ✅ Decisions Finalized  
**Related**: [AUT-9 CI Baseline](../../ops/linear/README.md)

## Problem Statement

Security scanning is required for AUT-9 CI baseline, but integration approach needs to balance security coverage with CI performance and developer experience across Security, CI/CD, and DevOps teams.

## Key Decisions Made

### 1. Risk-Based Security Scan Prioritization

**Decision**: **Tiered security scanning strategy based on risk impact and CI performance constraints**

**Critical Security Scans (MVP - Must Block Builds)**:
- **Dependency Vulnerability Scanning**: npm audit + Snyk
- **Secret Scanning**: GitLeaks + TruffleHog  
- **Performance Target**: <2 minutes total (daily CI)

**Important Security Scans (Weekly/Release - Advisory)**:
- **SAST (Static Application Security Testing)**: Semgrep
- **Container Image Scanning**: Trivy
- **Performance Target**: <8 minutes total (weekly CI)

**Rationale**: Focus on highest-impact vulnerabilities that can be detected quickly while maintaining CI performance targets from AUT-85/AUT-86.

### 2. Parallel CI Integration Architecture

**Decision**: **Concurrent security scan execution with incremental optimization**

**Daily CI Pipeline Integration**:
```yaml
security_scans:
  strategy:
    matrix:
      scan_type: [dependencies, secrets, basic_sast]
    max-parallel: 3
  
parallel_execution:
  dependency_scan: 60s timeout
  secret_scan: 30s timeout  
  basic_sast: 90s timeout
```

**Incremental Scanning Strategy**:
- **PR-level**: Only scan changed files and new dependencies
- **Merge-level**: Full codebase security validation
- **Caching**: Tool results cached by file/dependency hashes

### 3. Vulnerability Threshold Policy

**Decision**: **Clear blocking vs advisory strategy with remediation SLAs**

**Immediate Build Failures (Blocking)**:
- **Critical vulnerabilities** with available patches
- **High severity** with active exploits in the wild
- **Any secrets** detected in code/commits
- **SQL injection, XSS, authentication bypass** patterns

**Advisory Warnings (Review Required)**:
- **Medium severity** vulnerabilities without active exploits
- **Low severity** with complex remediation
- **Code quality** security anti-patterns

**Remediation SLA Framework**:
- **Critical**: 24 hours to fix or disable CI
- **High**: 7 days with tracking ticket
- **Medium**: 30 days with scheduled fix
- **Low**: Next major release cycle

### 4. Security Tool Selection & Configuration

**Decision**: **Best-in-class tools optimized for CI performance**

**Dependency Vulnerability Scanning**:
- **Primary**: `npm audit` (built-in, fast)
- **Enhanced**: Snyk (comprehensive vulnerability database)
- **Integration**: Parallel execution with fallback to npm audit if API limits hit

**Secret Detection**:
- **GitLeaks**: Fast file-based secret scanning
- **TruffleHog**: Deep git history analysis with verified secrets
- **Custom patterns**: OAuth tokens, API keys, database credentials

**Static Application Security Testing**:
- **Semgrep**: TypeScript/JavaScript security rules
- **Configuration**: Auto-config with custom rules for OAuth and database patterns
- **Performance**: Incremental scanning on changed code paths

**Container Security**:
- **Trivy**: Comprehensive container and dependency scanning
- **Scope**: Production Docker images and base image vulnerabilities
- **Integration**: Weekly and release pipeline validation

### 5. Alert Management & Notification Strategy

**Decision**: **Intelligent alert routing to prevent notification fatigue**

**Immediate Alerts** (Slack + Email):
- **Secrets detected**: Security team + PR author
- **Critical vulnerabilities**: Security team + DevOps
- **Build blocking issues**: CI team + PR author

**Daily Digest** (Slack only):
- **New medium/low vulnerabilities** discovered
- **Remediation progress** tracking
- **Security metrics** and trends

**Weekly Reports** (Email):
- **Security posture** summary
- **Vulnerability remediation** backlog
- **Compliance status** updates

## Implementation Architecture

### CI Pipeline Resource Allocation
```yaml
# Updated GitHub Actions resource distribution
Total Resources (7GB memory, variable CPU):
- PostgreSQL container: 2GB memory, 1.0 CPU (from AUT-86)
- Application container: 1GB memory, 0.5 CPU (from AUT-86)
- Security scanning jobs: 1.5GB memory, 0.75 CPU (new)
- Mock API server: 256MB memory, 0.25 CPU (from AUT-86)
- System buffer: 2.25GB memory, remaining CPU
```

### Security Scan Integration Points
```yaml
# CI Pipeline sequence with security integration
ci_pipeline_flow:
  1. Checkout & Setup: 30s
  2. Security Scans (parallel): 90s max
     - dependency_scan: 60s
     - secret_scan: 30s  
     - basic_sast: 90s
  3. Generator Pipeline: 8s (from AUT-85)
  4. Database Tests: 8min (from AUT-86)
  5. Integration Tests: remaining time
```

### Security Tool Infrastructure
```dockerfile
# Containerized security tools
FROM node:20-alpine
RUN npm install -g @snyk/cli gitleaks semgrep
RUN apk add --no-cache git curl jq trivy
COPY security-scan-scripts/ /usr/local/bin/
```

### Caching Strategy
```yaml
# Performance optimization through caching
security_tool_cache:
  - ~/.cache/snyk (by package-lock.json hash)
  - ~/.cache/semgrep (by source code hash) 
  - ~/.cache/trivy (daily refresh)
  - /tmp/gitleaks-cache (by git history hash)
```

## Performance Integration with Existing Spikes

### AUT-85 Generator Pipeline Coordination
- **Security scans run parallel** to generator pipeline when possible
- **Shared failure handling** with consistent exit codes
- **Combined performance budget** maintained under 8 minutes total

### AUT-86 Database Architecture Coordination
- **Container orchestration** supports database + security tools
- **Resource sharing** optimized for GitHub Actions limits
- **Parallel execution** across database setup and security scanning

### Performance Budget Allocation
```
Daily CI Performance Budget:
- AUT-85 Generator Pipeline: 8 seconds
- AUT-86 Database Setup: 30 seconds  
- AUT-87 Security Scanning: 90 seconds
- Application Tests: remaining time
Total: Under 8 minutes (meets AUT-86 target)

Weekly CI Performance Budget:
- Full security scanning: 8 minutes
- Comprehensive database testing: 15 minutes
- Complete integration suite: 30 minutes total
```

## Implementation Commitments

### Security Specialist Commitments:
- ✅ **Risk-based scan prioritization** with clear blocking thresholds
- ✅ **Vulnerability threshold policies** with remediation SLAs
- ✅ **Alert routing configuration** preventing notification fatigue
- ✅ **Security tool selection** optimized for CI performance
- ✅ **Incident response procedures** for critical security findings

### CI/CD Specialist Commitments:
- ✅ **Parallel security scanning** within <2 minute daily budget
- ✅ **Incremental scanning optimization** for PR-level performance
- ✅ **Security exit codes** integrated with existing failure handling
- ✅ **Caching strategy implementation** for scan results and tools
- ✅ **Performance monitoring** for security scan duration tracking

### DevOps Specialist Commitments:
- ✅ **Infrastructure capacity allocation** for security scanning jobs
- ✅ **Containerized security tools** for consistent CI environment
- ✅ **API rate limit management** with fallback strategies
- ✅ **Alert infrastructure** with Slack/Linear integration
- ✅ **Secrets management** via GitHub Secrets with rotation

## Security Scan Configuration

### Daily CI Security Baseline
```bash
#!/bin/bash
# daily-security-scan.sh
set -e

echo "Running security baseline scan..."

# Parallel security scans
(npm audit --audit-level=high) &
(gitleaks detect --source . --verbose) &
(semgrep --config=auto --error --strict --timeout=60) &

wait  # Wait for all parallel scans to complete

echo "Security baseline scan completed"
```

### Weekly CI Comprehensive Security
```bash
#!/bin/bash  
# weekly-security-scan.sh
set -e

echo "Running comprehensive security scan..."

# Full dependency analysis
snyk test --severity-threshold=medium
npm audit --audit-level=moderate

# Deep secret scanning
trufflehog git file://. --only-verified

# Full SAST analysis
semgrep --config=auto --error

# Container security
trivy image autosched/app:latest

echo "Comprehensive security scan completed"
```

### Security Alert Integration
```bash
#!/bin/bash
# security-alert-handler.sh
SEVERITY=$1
FINDING=$2

case $SEVERITY in
  critical|high)
    # Immediate alert
    curl -X POST $SECURITY_SLACK_HOOK \
      -d "{\"text\": \"🚨 $SEVERITY Security Finding: $FINDING\"}"
    
    # Create Linear ticket
    curl -X POST https://api.linear.app/graphql \
      -H "Authorization: Bearer $LINEAR_API_KEY" \
      -d "mutation { issueCreate(input: { title: \"Security: $FINDING\" }) }"
    exit 1  # Block build
    ;;
  medium|low)
    # Add to daily digest
    echo "$FINDING" >> /tmp/security-digest-$(date +%Y-%m-%d).txt
    exit 0  # Allow build to continue
    ;;
esac
```

## Security Metrics & Monitoring

### Performance Metrics
- **Security scan duration**: Track against <2 minute daily budget
- **Tool performance**: Individual scan tool execution times
- **Cache effectiveness**: Hit rate for security tool caches
- **Resource utilization**: Memory and CPU usage during scans

### Security Metrics
- **Vulnerability detection rate**: New vulnerabilities found per scan
- **Remediation time**: Average time to fix critical/high severity issues
- **False positive rate**: Incorrectly flagged security issues
- **Coverage metrics**: Percentage of codebase analyzed by each tool

### Alert Metrics
- **Alert volume**: Number of security alerts generated per day/week
- **Response time**: Time from alert to acknowledgment
- **Resolution time**: Time from alert to vulnerability fix
- **Alert accuracy**: Percentage of actionable vs false positive alerts

## Success Criteria Met

- ✅ Security scan types and tools selected (npm audit, Snyk, GitLeaks, TruffleHog, Semgrep, Trivy)
- ✅ Blocking vs advisory scan strategy defined (critical/high block, medium/low advisory)
- ✅ Vulnerability threshold policies established (with remediation SLAs)
- ✅ CI integration approach documented (parallel execution, incremental scanning)
- ✅ Alert/remediation workflow defined (intelligent routing, digest aggregation)

## Edge Cases Addressed

### API Rate Limiting
- **Snyk API limits**: Fallback to npm audit if quota exceeded
- **GitHub API limits**: Batch Linear ticket creation for multiple findings
- **Tool availability**: Graceful degradation if external security services unavailable

### Performance Edge Cases
- **Large codebases**: Incremental scanning and timeout management
- **Complex dependencies**: Chunked dependency analysis for large node_modules
- **Parallel execution limits**: Resource contention handling between security scans

### Security Edge Cases
- **Zero-day vulnerabilities**: Rapid response procedures for newly discovered issues
- **False positives**: Review and whitelist procedures for legitimate code patterns
- **Legacy dependencies**: Handling unmaintained packages with known vulnerabilities

## Next Steps

1. **Security Team**: Configure security tools with custom rules and thresholds
2. **CI/CD Team**: Implement parallel scanning infrastructure and caching
3. **DevOps Team**: Set up containerized security tools and alert routing
4. **All Teams**: Integration testing with AUT-9 CI baseline implementation

---

**Status**: Ready for implementation in AUT-9  
**Next Review**: After initial security scan deployment and performance validation