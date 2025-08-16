# Generator Pipeline Implementation Guide

**Related**: [AUT-85 Spike Decisions](../spikes/AUT-85-generator-pipeline-decisions.md)  
**Status**: Ready for Implementation  
**Owner**: CI/CD Team

## Overview

This guide covers implementing the deterministic generator pipeline for API contracts and TypeScript types in CI/CD.

## Pipeline Architecture

### Job Sequence
```yaml
jobs:
  api-contract-pipeline:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Compile TypeScript
        run: npm run build
        
      - name: Generate OpenAPI Spec
        run: npm run gen:openapi
        
      - name: Detect Breaking Changes
        run: npm run check:breaking-changes
        
      - name: Generate API Types
        run: npm run gen:api-types
        
      - name: Validate Generated Types
        run: npm run validate:api-types
        
      - name: Check for Drift
        run: |
          if [ -n "$(git status --porcelain)" ]; then
            echo "❌ Uncommitted changes detected after generation:"
            git status --porcelain
            echo ""
            echo "Run: npm run gen:openapi && npm run gen:api-types"
            echo "Then commit the generated changes for review"
            exit 2
          fi
          
      - name: Frontend Type Check
        run: npm run typecheck:frontend
```

## Error Handling

### Exit Codes
- **0**: Success
- **1**: Generation failed (build/code errors)
- **2**: Drift detected (uncommitted changes)
- **3**: Breaking changes detected (needs review)
- **4**: Spec validation failed (implementation mismatch)

### Error Messages

#### Drift Detection
```bash
❌ GENERATOR DRIFT DETECTED
Uncommitted changes found after running generators.

Files changed:
  M  packages/shared/types/api.ts
  M  api/openapi.json

To fix:
1. Run: npm run gen:openapi && npm run gen:api-types
2. Review the generated changes
3. Commit the changes: git add . && git commit -m "Update API contracts"
4. Push changes and re-run CI

This ensures API contracts stay in sync between backend and frontend.
```

#### Breaking Changes
```bash
❌ BREAKING API CHANGES DETECTED

The following breaking changes were found:
• Endpoint removed: DELETE /api/bookings/{id}
• Required field added: timezone (POST /api/availability)
• Type changed: userId (string → number)

Impact:
- Frontend components using deleted endpoints will break
- New required fields need frontend updates

Next steps:
1. Review breaking changes with Frontend team
2. Update frontend code to handle changes
3. Add breaking change labels to PR
4. Consider API versioning for major changes

Frontend team notified via Slack.
```

## Scripts Required

### package.json Scripts
```json
{
  "scripts": {
    "gen:openapi": "node scripts/generate-openapi.js",
    "gen:api-types": "node scripts/generate-api-types.js",
    "check:breaking-changes": "node scripts/check-breaking-changes.js",
    "validate:api-types": "node scripts/validate-api-types.js",
    "typecheck:frontend": "cd packages/frontend && npx tsc --noEmit"
  }
}
```

### Backend: OpenAPI Generation
**File**: `scripts/generate-openapi.js`

**Requirements**:
- Deterministic output (sorted properties, no timestamps)
- Breaking change metadata
- Validation against actual implementation

**Output Format**:
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "AutoSched API",
    "version": "1.2.0",
    "x-generated-at": "stable-timestamp"
  },
  "paths": {
    "/api/bookings": {
      "post": {
        "x-breaking-change": false,
        "x-change-type": "addition",
        "requestBody": { "..." }
      }
    }
  }
}
```

### Frontend: Type Generation
**File**: `scripts/generate-api-types.js`

**Requirements**:
- Generate TypeScript interfaces from OpenAPI
- Validate type quality (minimize `any` usage)
- Check Frontend compilation after generation

**Quality Checks**:
- Fail if >10% of generated types are `any`
- Ensure all endpoints have corresponding interfaces
- Validate response types match documentation

### Breaking Change Detection
**File**: `scripts/check-breaking-changes.js`

**Logic**:
```javascript
const breakingChanges = [
  'Required field additions',
  'Field removals', 
  'Endpoint removals',
  'Type changes (string → number)',
  'Response format changes'
];

const nonBreakingChanges = [
  'Optional field additions',
  'New endpoints',
  'Documentation updates',
  'Example updates'
];
```

## Performance Optimization

### Caching Strategy
- Cache `node_modules` between runs
- Cache TypeScript compilation output
- Only regenerate if source files changed

### File Watching
```bash
# Only run generators if relevant files changed
CHANGED_FILES=$(git diff --name-only HEAD~1)
if echo "$CHANGED_FILES" | grep -E "(api/|packages/backend/)" ; then
  echo "API files changed, running generators..."
  npm run gen:openapi && npm run gen:api-types
else
  echo "No API changes detected, skipping generation"
fi
```

## Troubleshooting

### Common Issues

#### "Generation takes too long"
- Check for network calls in generator scripts
- Ensure TypeScript compilation is cached
- Profile script performance with `time`

#### "Frequent drift failures"
- Verify generators are deterministic
- Check for OS-specific line endings
- Ensure consistent property ordering

#### "Breaking change false positives"
- Review breaking change detection logic
- Add exceptions for safe changes
- Improve change classification

### Manual Override

For urgent fixes, CI can be bypassed:
```yaml
# Add to PR description to skip generator checks
[skip-generators] - Emergency hotfix for production issue
```

**⚠️ Use sparingly and require team lead approval**

## Monitoring

### Metrics to Track
- Generator pipeline runtime
- Drift detection frequency
- Breaking change frequency
- False positive rate for breaking changes

### Alerts
- Pipeline runtime >10 seconds
- Breaking changes detected (Slack notification)
- Generator failures (immediate notification)

---

**Implementation Status**: Ready for AUT-9  
**Next Steps**: Create GitHub workflow files in `docs/ci-cd/workflows/`