# AUT-86: Test Database Architecture Strategy - Decision Record

**Date**: 2025-08-16  
**Participants**: DevOps Specialist (lead), Database Specialist, QA Analyst, Backend Developer  
**Status**: ✅ Decisions Finalized  
**Related**: [AUT-9 CI Baseline](../../ops/linear/README.md)

## Problem Statement

Multiple teams need test database integration for AUT-9 CI baseline, but requirements conflict between performance, reliability, and isolation across DevOps, Database, QA, and Backend teams.

## Key Decisions Made

### 1. Database Provisioning Strategy

**Decision**: **Container-per-CI-run with isolated PostgreSQL instances**

**Architecture**:
```yaml
services:
  postgres:
    image: postgres:15-optimized  # Pre-built with base schema
    environment:
      POSTGRES_DB: autosched_test_${GITHUB_RUN_ID}
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_pass
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    resources:
      mem_limit: 2GB
      cpus: 1.0
```

**Benefits**:
- Complete isolation between parallel CI runs
- No shared state or cleanup complexity
- Deterministic starting point for every test
- Can run migrations from scratch every time

### 2. OAuth + API Mocking Strategy

**Decision**: **Hybrid Mock + Real Token Approach**

**Implementation**:
- **Service Account + Mock Responses**: Real OAuth tokens with mocked calendar API responses
- **GitHub Secrets**: Encrypted test tokens with monthly rotation
- **Separate Mock Layer**: External API responses handled independently from database fixtures
- **Weekly Real Integration**: Actual OAuth flow testing with real APIs

**Benefits**:
- Fast CI execution without external API dependencies
- Deterministic test results with consistent mock data
- Real integration validation for critical OAuth flows
- Easy scenario creation for complex calendar integration testing

### 3. Performance Baseline Targets

**Decision**: **Infrastructure-adjusted performance targets accounting for GitHub Actions constraints**

**Daily CI (Fast Feedback)**:
- Database setup: <30s
- Minimal fixtures: <20s  
- Backend test suite: <8 minutes
- Individual test average: <300ms

**Weekly CI (Comprehensive)**:
- Realistic fixtures: <90s
- Full integration suite: <15 minutes
- Performance validation with trend monitoring

**Release CI (Stress Testing)**:
- Performance fixtures: <10 minutes
- Comprehensive testing: <30 minutes total
- Full infrastructure stress testing

### 4. Test Data Versioning Strategy

**Decision**: **Semantic Versioned Fixtures with Multi-Version Support**

**Versioning Format**: MAJOR.MINOR.PATCH
- **MAJOR**: Breaking changes to existing test scenarios
- **MINOR**: New test scenarios added (backward compatible)  
- **PATCH**: Data corrections, bug fixes (no behavior change)

**Implementation**:
```
fixtures/
├── v1.0.0/
│   ├── schema.sql          # Database schema for this version
│   ├── minimal.sql         # Core test data
│   ├── realistic.sql       # Integration test data
│   └── performance.sql     # Load test data
├── v1.1.0/
│   ├── schema.sql          # Updated schema
│   ├── migration.sql       # Migration from v1.0.0
│   └── ...
└── current -> v1.1.0       # Symlink to latest version
```

### 5. Tiered Test Data Strategy

**Decision**: **Three-tier fixture approach optimized for different testing needs**

**Minimal Fixtures** (Daily CI):
- Core schema + 10-50 records per table
- <20s loading time
- Essential for fast feedback loops

**Realistic Fixtures** (Weekly CI):
- 1K-10K records with realistic relationships
- <90s loading time
- Integration and complexity testing

**Performance Fixtures** (Release CI):
- 100K+ records for load testing
- <10 minutes loading time
- Stress testing and performance validation

## Implementation Commitments

### DevOps Specialist Commitments:
- ✅ Container-per-run isolation with <30s setup time
- ✅ GitHub Secrets management with automated OAuth token rotation
- ✅ Docker optimization with pre-built base images
- ✅ Resource monitoring and performance benchmarking
- ✅ Mock server container integration for API responses

### Database Specialist Commitments:
- ✅ Semantic versioned fixture repository with migration scripts
- ✅ Schema compatibility validation for each fixture version
- ✅ Tiered fixture strategy with performance optimization
- ✅ Migration testing suite with forward/rollback validation
- ✅ Pre-built container images with optimized PostgreSQL config

### QA Analyst Commitments:
- ✅ Comprehensive mock scenarios for calendar integration edge cases
- ✅ Test scenario library shared with Backend team
- ✅ Fixture validation framework for database state checking
- ✅ Weekly real integration test suite for OAuth validation
- ✅ Test data versioning coordination with Database team

### Backend Developer Commitments:
- ✅ TestDataBuilder API for standardized test scenario creation
- ✅ Migration validation ensuring API contracts preserved
- ✅ Test optimization for container overhead (batched scenarios)
- ✅ Performance benchmarking adjusted for CI environment
- ✅ Integration with OAuth token management and mock layer

## Technical Architecture

### Container Resource Allocation
```yaml
Resource Distribution (GitHub Actions 7GB total):
- PostgreSQL container: 2GB memory, 1.0 CPU
- Application container: 1GB memory, 0.5 CPU  
- Mock API server: 256MB memory, 0.25 CPU
- Buffer for system: ~4GB memory, remaining CPU
```

### OAuth Integration Architecture
```typescript
// CI Environment Setup
const OAUTH_STRATEGY = process.env.CI ? 'mock' : 'real';

if (OAUTH_STRATEGY === 'mock') {
  // Use committed mock responses for calendar API calls
  mockCalendarAPI.setup(fixtures.calendarResponses);
} else {
  // Use real test tokens for local development/weekly integration
  setupRealCalendarAPI(testTokens);
}
```

### Test Data Management
```sql
-- Fixture metadata tracking
CREATE TABLE fixture_versions (
  version VARCHAR(20) PRIMARY KEY,
  schema_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  compatible_app_versions TEXT[],
  breaking_changes TEXT[]
);
```

## Migration Testing Workflow

### Schema Change Validation
1. **Forward migrations**: 0 → latest schema testing
2. **Rollback testing**: latest → previous version validation
3. **Migration idempotency**: safe to run same migration twice
4. **Data preservation**: existing data survives schema changes
5. **Performance benchmarking**: migration runtime on realistic data

### Fixture Migration Process
1. **Schema compatibility validation** for new fixture versions
2. **Automated fixture migration** using database migration tools
3. **Fixture diffing** to identify breaking vs non-breaking changes
4. **Rollback capability** to previous fixture versions
5. **CI integration** with performance optimization

## Success Metrics

### Performance Targets
- Container startup: <30 seconds (including health checks)
- Minimal fixture loading: <20 seconds
- Backend test suite: <8 minutes (daily CI)
- Integration testing: <15 minutes (weekly CI)
- Stress testing: <30 minutes (release CI)

### Reliability Targets
- 99%+ test reproducibility with same fixture versions
- Zero cross-test contamination between parallel CI runs
- <5% performance variance across CI runs
- 100% migration testing coverage (forward + rollback)

### Quality Targets
- Complete OAuth flow coverage (mock + real integration)
- Comprehensive calendar integration scenarios
- Multi-timezone and DST edge case coverage
- Performance regression detection with automated alerting

## Edge Cases Addressed

### OAuth Integration Edge Cases
- Expired tokens, revoked permissions, invalid scopes
- Calendar API variations across different providers
- Network failures, rate limits, malformed responses
- Timezone complexity with DST transitions

### Database Migration Edge Cases
- Large data volume migrations with performance constraints
- Complex foreign key relationships during schema changes
- Concurrent migration execution in parallel CI runs
- Migration rollback with data preservation requirements

### Test Data Edge Cases
- Fixture version compatibility across application versions
- Cross-service test data coordination for integration scenarios
- Performance fixture loading within CI time constraints
- Mock scenario consistency with real external API behavior

## Next Steps

1. **DevOps**: Implement container orchestration with resource optimization
2. **Database**: Create semantic versioned fixture repository
3. **QA**: Define comprehensive mock scenarios and test validation framework
4. **Backend**: Implement TestDataBuilder API and OAuth integration
5. **All Teams**: Integration testing with AUT-9 CI baseline implementation

## Success Criteria Met

- ✅ Test database provisioning strategy defined (container-per-run)
- ✅ Test data management approach documented (tiered + versioned fixtures)
- ✅ Migration testing workflow established (forward/rollback validation)
- ✅ Performance benchmarks set (infrastructure-adjusted targets)
- ✅ CI integration plan created (OAuth + mock strategy)

---

**Status**: Ready for implementation in AUT-9  
**Next Review**: After initial CI implementation and performance validation