# AUT-85: Generator Pipeline Dependency Chain Design - Decision Record

**Date**: 2025-08-16  
**Participants**: CI/CD Specialist (lead), Backend Developer, Frontend Developer  
**Status**: ✅ Decisions Finalized  
**Related**: [AUT-9 CI Baseline](../../ops/linear/README.md)

## Problem Statement

AUT-9 CI baseline requires deterministic generator workflow, but cross-team dependencies were unclear. Need to establish reliable `npm run gen:openapi` → `npm run gen:api-types` pipeline with drift detection.

## Key Decisions Made

### 1. Generator Job Sequencing Strategy

**Decision**: **Sequential CI jobs with clear dependencies**

**Architecture**:
```yaml
jobs:
  generators:
    steps:
      1. Checkout & setup
      2. Install dependencies 
      3. Compile TypeScript
      4. Generate OpenAPI (with breaking change detection)
      5. Generate API types
      6. Check for drift (git diff --exit-code)
      7. Validate type usage in Frontend
```

**Rationale**: 
- Frontend types directly depend on Backend OpenAPI spec
- Cannot parallelize due to strict dependency chain
- Clear failure isolation for easier debugging

### 2. Drift Detection Approach

**Decision**: **Block PRs completely on any uncommitted generator changes**

**Policy**:
- Any `git diff` after generators = CI failure
- Manual commit workflow required for review visibility
- No auto-commit to ensure type changes are reviewed

**Exit Code Strategy**:
- Exit 1: Generation failed (code/build errors)
- Exit 2: Drift detected (uncommitted changes)
- Exit 3: Breaking changes detected (needs Frontend review)
- Exit 4: Spec validation failed (implementation mismatch)

**Rationale**: Better to fail fast in CI than have broken production builds

### 3. Breaking Change Detection

**Decision**: **Separate CI job with metadata-driven detection**

**Implementation**:
- Backend adds OpenAPI extensions for change tracking:
  ```yaml
  x-breaking-change: true/false
  x-change-type: "addition" | "modification" | "deprecation" | "removal"
  x-change-description: "Added required field 'timezone' to booking request"
  ```
- Semantic versioning in OpenAPI info
- Clear breaking vs non-breaking change classification

**Breaking Change Criteria**:
- Required field additions = breaking
- Field removals = breaking  
- Endpoint removals = breaking
- Type changes (string → number) = breaking
- Optional field additions = non-breaking

### 4. Performance Targets

**Decision**: **<8 seconds total generator pipeline runtime**

**Individual Targets**:
- OpenAPI generation: <5 seconds
- Type generation: <3 seconds
- Drift detection: <10 seconds from job start

**Optimizations**:
- Cache TypeScript compilation results
- Only regenerate if API files changed
- Incremental validation instead of full rebuild

### 5. Error Handling & Communication

**Decision**: **Multi-tier notification strategy**

**Notification Levels**:
- **Breaking changes**: GitHub PR + Slack (#frontend-team)
- **Drift/generation failures**: GitHub only
- **Critical failures**: Broader engineering team

**Error Message Examples**:
```bash
# Breaking change detected
❌ BREAKING API CHANGES DETECTED:
- Endpoint DELETE /bookings/{id} removed
- Field 'timezone' now required in POST /availability
Run: npm run gen:api-types
Review: Generated type changes before committing

# Non-breaking change
✅ API updated with non-breaking changes:
- Added optional field 'description' to Booking
- New endpoint GET /health
```

## Implementation Commitments

### Backend Developer Commitments:
- ✅ Fix deterministic OpenAPI generation (property sorting, no timestamps)
- ✅ Implement breaking change detection with metadata
- ✅ Add spec-to-implementation validation
- ✅ <5 second OpenAPI generation performance target

### Frontend Developer Commitments:
- ✅ Enhance type generation with quality validation
- ✅ Frontend compilation check as part of generator pipeline
- ✅ Breaking change workflow documentation
- ✅ <3 second type generation performance target

### CI/CD Specialist Commitments:
- ✅ Implement sequential CI pipeline with drift detection
- ✅ Multi-tier error messaging and notifications
- ✅ Performance monitoring and optimization
- ✅ GitHub workflow implementation

## Edge Cases Considered

1. **Parallel PR Conflicts**: Each PR validates against current `dev` branch
2. **Large API Refactors**: "Breaking change mode" flag for temporary bypass
3. **Generated Type Merge Conflicts**: Separate directories + clear resolution docs
4. **Pipeline Recovery**: Manual re-trigger preferred, no auto-retry
5. **Type Quality**: Fail if >10% of types are `any`, validate interface coverage

## Next Steps

1. **Backend**: Implement deterministic OpenAPI generation (immediate)
2. **Frontend**: Set up type quality validation (immediate)  
3. **CI/CD**: Create GitHub workflow implementation (AUT-9)
4. **All**: Document breaking change workflow for team

## Success Metrics

- Generator pipeline completes in <8 seconds
- Zero runtime type errors due to stale generated code
- Clear communication on breaking vs non-breaking API changes
- 100% drift detection (no uncommitted generated files reach main)

---

**Status**: Ready for implementation in AUT-9  
**Next Review**: After initial CI implementation and team feedback