# Test Database Architecture Implementation Guide

**Related**: [AUT-86 Spike Decisions](../spikes/AUT-86-test-database-architecture-decisions.md)  
**Status**: Ready for Implementation  
**Owner**: DevOps Team with Database/QA/Backend coordination

## Overview

This guide covers implementing the container-per-run test database architecture with OAuth integration, semantic versioned fixtures, and performance optimization for CI/CD pipelines.

## Container Architecture

### PostgreSQL Service Configuration
```yaml
# GitHub Actions service configuration
services:
  postgres:
    image: autosched/postgres:15-optimized
    env:
      POSTGRES_DB: autosched_test_${{ github.run_id }}
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_pass
      POSTGRES_HOST_AUTH_METHOD: trust
    ports:
      - 5432:5432
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
      --shm-size=256mb
    volumes:
      - /tmp/postgres-data:/var/lib/postgresql/data

  mock-calendar-api:
    image: autosched/mock-calendar-api:latest
    ports:
      - 8080:8080
    env:
      MOCK_SCENARIO_PATH: /app/fixtures/mock-scenarios
    volumes:
      - ./fixtures/mock-scenarios:/app/fixtures/mock-scenarios
```

### Resource Allocation Strategy
```yaml
# Resource limits for optimal performance
postgres:
  deploy:
    resources:
      limits:
        memory: 2G
        cpus: '1.0'
      reservations:
        memory: 1G
        cpus: '0.5'

app:
  deploy:
    resources:
      limits:
        memory: 1G
        cpus: '0.5'
      reservations:
        memory: 512M
        cpus: '0.25'
```

## Database Container Optimization

### Pre-built Base Image
```dockerfile
# autosched/postgres:15-optimized
FROM postgres:15

# Install extensions
RUN apt-get update && apt-get install -y postgresql-15-pgcrypto

# Copy optimized PostgreSQL configuration
COPY postgresql.conf /etc/postgresql/postgresql.conf
COPY pg_hba.conf /etc/postgresql/pg_hba.conf

# Pre-create base schema (empty tables with indexes)
COPY base-schema.sql /docker-entrypoint-initdb.d/01-base-schema.sql

# Optimize for CI workloads
RUN echo "shared_preload_libraries = 'pg_stat_statements'" >> /etc/postgresql/postgresql.conf
RUN echo "max_connections = 50" >> /etc/postgresql/postgresql.conf
RUN echo "shared_buffers = 256MB" >> /etc/postgresql/postgresql.conf
RUN echo "effective_cache_size = 1GB" >> /etc/postgresql/postgresql.conf
```

### Fast Startup Configuration
```conf
# postgresql.conf optimizations for CI
fsync = off                    # Fast startup (acceptable for CI)
synchronous_commit = off       # Don't wait for disk writes
checkpoint_completion_target = 0.9
wal_buffers = 16MB
random_page_cost = 1.1         # SSD optimization
effective_io_concurrency = 200 # SSD optimization
maintenance_work_mem = 256MB   # Faster migrations
```

## Fixture Management System

### Fixture Repository Structure
```
fixtures/
├── versions/
│   ├── v1.0.0/
│   │   ├── schema.sql
│   │   ├── minimal/
│   │   │   ├── users.sql
│   │   │   ├── bookings.sql
│   │   │   └── availability.sql
│   │   ├── realistic/
│   │   │   └── [larger datasets]
│   │   └── performance/
│   │       └── [stress test data]
│   └── v1.1.0/
│       ├── migration-from-v1.0.0.sql
│       └── [updated fixtures]
├── mock-scenarios/
│   ├── google-calendar-responses.json
│   ├── microsoft-calendar-responses.json
│   └── oauth-flow-responses.json
└── scripts/
    ├── load-fixtures.sh
    ├── validate-fixtures.sh
    └── migrate-fixtures.sh
```

### Fixture Loading Scripts
```bash
#!/bin/bash
# scripts/load-fixtures.sh

set -e

FIXTURE_VERSION=${1:-"current"}
FIXTURE_TYPE=${2:-"minimal"}
DATABASE_URL=${3:-"postgresql://test_user@localhost:5432/autosched_test"}

echo "Loading fixtures v${FIXTURE_VERSION} (${FIXTURE_TYPE})"

# Validate inputs
if [ ! -d "fixtures/versions/${FIXTURE_VERSION}" ]; then
    echo "Error: Fixture version ${FIXTURE_VERSION} not found"
    exit 1
fi

# Load schema
echo "Loading schema..."
psql "${DATABASE_URL}" -f "fixtures/versions/${FIXTURE_VERSION}/schema.sql"

# Load fixture data
echo "Loading ${FIXTURE_TYPE} fixtures..."
for sql_file in fixtures/versions/${FIXTURE_VERSION}/${FIXTURE_TYPE}/*.sql; do
    if [ -f "$sql_file" ]; then
        echo "  Loading $(basename $sql_file)..."
        psql "${DATABASE_URL}" -f "$sql_file"
    fi
done

# Record what was loaded
psql "${DATABASE_URL}" -c "
    INSERT INTO fixture_metadata (version, type, loaded_at) 
    VALUES ('${FIXTURE_VERSION}', '${FIXTURE_TYPE}', NOW())
    ON CONFLICT (version, type) DO UPDATE SET loaded_at = NOW();
"

echo "Fixtures loaded successfully"
```

### Fixture Validation Script
```bash
#!/bin/bash
# scripts/validate-fixtures.sh

FIXTURE_VERSION=${1:-"current"}
DATABASE_URL=${2:-"postgresql://test_user@localhost:5432/autosched_test"}

echo "Validating fixtures v${FIXTURE_VERSION}..."

# Check schema integrity
psql "${DATABASE_URL}" -c "
    SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
" > /tmp/schema_actual.txt

# Compare with expected schema
if [ -f "fixtures/versions/${FIXTURE_VERSION}/expected_schema.txt" ]; then
    if ! diff -q /tmp/schema_actual.txt "fixtures/versions/${FIXTURE_VERSION}/expected_schema.txt" > /dev/null; then
        echo "ERROR: Schema mismatch detected"
        diff /tmp/schema_actual.txt "fixtures/versions/${FIXTURE_VERSION}/expected_schema.txt"
        exit 1
    fi
fi

# Check data integrity
psql "${DATABASE_URL}" -c "
    -- Validate foreign key constraints
    SELECT conname, conrelid::regclass 
    FROM pg_constraint 
    WHERE contype = 'f' AND NOT convalidated;
    
    -- Check for orphaned records
    SELECT 'users' as table_name, COUNT(*) as orphaned_count
    FROM users u 
    LEFT JOIN calendar_integrations ci ON u.id = ci.user_id 
    WHERE u.calendar_provider IS NOT NULL AND ci.user_id IS NULL;
"

echo "Fixture validation completed successfully"
```

## OAuth Integration Implementation

### GitHub Secrets Management
```yaml
# Required GitHub Secrets
secrets:
  GOOGLE_TEST_CLIENT_ID
  GOOGLE_TEST_CLIENT_SECRET
  GOOGLE_TEST_REFRESH_TOKEN
  MICROSOFT_TEST_CLIENT_ID
  MICROSOFT_TEST_CLIENT_SECRET
  MICROSOFT_TEST_REFRESH_TOKEN
  LINEAR_API_KEY
```

### OAuth Token Rotation Workflow
```yaml
# .github/workflows/oauth-token-rotation.yml
name: OAuth Token Rotation
on:
  schedule:
    - cron: '0 0 1 * *'  # First day of each month
  workflow_dispatch:     # Manual trigger

jobs:
  rotate-tokens:
    runs-on: ubuntu-latest
    steps:
      - name: Refresh Google OAuth Token
        run: |
          RESPONSE=$(curl -s -X POST https://oauth2.googleapis.com/token \
            -d "client_id=${{ secrets.GOOGLE_TEST_CLIENT_ID }}" \
            -d "client_secret=${{ secrets.GOOGLE_TEST_CLIENT_SECRET }}" \
            -d "refresh_token=${{ secrets.GOOGLE_TEST_REFRESH_TOKEN }}" \
            -d "grant_type=refresh_token")
          
          NEW_TOKEN=$(echo $RESPONSE | jq -r '.access_token')
          if [ "$NEW_TOKEN" != "null" ]; then
            # Update secret via GitHub API
            echo "Google token refreshed successfully"
          fi
      
      - name: Refresh Microsoft OAuth Token
        run: |
          # Similar token refresh for Microsoft Graph API
          echo "Microsoft token rotation logic"
      
      - name: Validate New Tokens
        run: |
          # Test API calls with new tokens
          echo "Token validation logic"
```

### Mock API Server Implementation
```javascript
// mock-calendar-api/server.js
const express = require('express');
const app = express();
const fs = require('fs');

// Load mock scenarios
const mockScenarios = JSON.parse(fs.readFileSync('/app/fixtures/mock-scenarios/google-calendar-responses.json'));

app.use(express.json());

// Google Calendar API Mock
app.get('/calendar/v3/freeBusy', (req, res) => {
  const scenarioId = req.headers['x-mock-scenario'] || 'default';
  const scenario = mockScenarios.freeBusy[scenarioId];
  
  if (scenario) {
    res.json(scenario);
  } else {
    res.status(404).json({ error: 'Mock scenario not found' });
  }
});

// Microsoft Graph API Mock
app.get('/v1.0/me/calendar/getSchedule', (req, res) => {
  const scenarioId = req.headers['x-mock-scenario'] || 'default';
  const scenario = mockScenarios.microsoftFreeBusy[scenarioId];
  
  if (scenario) {
    res.json(scenario);
  } else {
    res.status(404).json({ error: 'Mock scenario not found' });
  }
});

app.listen(8080, () => {
  console.log('Mock Calendar API server running on port 8080');
});
```

## CI Pipeline Integration

### Complete CI Workflow
```yaml
name: Test Database Integration
on: [push, pull_request]

jobs:
  test-database:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: autosched/postgres:15-optimized
        env:
          POSTGRES_DB: autosched_test_${{ github.run_id }}
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      mock-calendar-api:
        image: autosched/mock-calendar-api:latest
        ports:
          - 8080:8080
    
    strategy:
      matrix:
        fixture-type: [minimal, realistic]
        node-version: [20]
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Load Test Fixtures
        run: |
          chmod +x ./fixtures/scripts/load-fixtures.sh
          ./fixtures/scripts/load-fixtures.sh current ${{ matrix.fixture-type }} \
            "postgresql://test_user@localhost:5432/autosched_test_${{ github.run_id }}"
        env:
          PGPASSWORD: test_pass
      
      - name: Validate Fixtures
        run: |
          chmod +x ./fixtures/scripts/validate-fixtures.sh
          ./fixtures/scripts/validate-fixtures.sh current \
            "postgresql://test_user@localhost:5432/autosched_test_${{ github.run_id }}"
      
      - name: Run Database Migrations
        run: npm run migrate:test
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/autosched_test_${{ github.run_id }}
      
      - name: Run Integration Tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/autosched_test_${{ github.run_id }}
          MOCK_CALENDAR_API_URL: http://localhost:8080
          OAUTH_STRATEGY: mock
      
      - name: Performance Benchmark
        run: npm run test:performance
        if: matrix.fixture-type == 'realistic'
```

## Performance Monitoring

### Database Performance Tracking
```sql
-- Performance monitoring queries
CREATE OR REPLACE FUNCTION track_test_performance() RETURNS TABLE (
  test_name VARCHAR(100),
  duration_ms INTEGER,
  query_count INTEGER,
  avg_query_time_ms NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'fixture_loading' as test_name,
    EXTRACT(EPOCH FROM NOW() - pg_postmaster_start_time()) * 1000 as duration_ms,
    (SELECT COUNT(*) FROM pg_stat_statements) as query_count,
    (SELECT AVG(mean_exec_time) FROM pg_stat_statements) as avg_query_time_ms;
END;
$$ LANGUAGE plpgsql;
```

### CI Performance Alerts
```yaml
# Performance regression detection
- name: Check Performance Regression
  run: |
    CURRENT_TIME=$(npm run test:performance:timing)
    BASELINE_TIME=8000  # 8 second baseline for test suite
    
    if [ "$CURRENT_TIME" -gt $((BASELINE_TIME * 150 / 100)) ]; then
      echo "Performance regression detected: ${CURRENT_TIME}ms > ${BASELINE_TIME}ms"
      echo "::warning::Test suite took ${CURRENT_TIME}ms, exceeding baseline by $(($CURRENT_TIME - $BASELINE_TIME))ms"
    fi
```

## Troubleshooting Guide

### Common Issues

#### Container Startup Failures
```bash
# Debug container health
docker logs postgres_container_id
docker exec postgres_container_id pg_isready -U test_user

# Check resource constraints
docker stats postgres_container_id
```

#### Fixture Loading Errors
```bash
# Validate fixture SQL syntax
psql --dry-run -f fixtures/versions/v1.0.0/minimal/users.sql

# Check fixture version compatibility
./fixtures/scripts/validate-fixtures.sh v1.0.0
```

#### OAuth Integration Issues
```bash
# Test mock API connectivity
curl -H "x-mock-scenario: default" http://localhost:8080/calendar/v3/freeBusy

# Validate OAuth token
curl -H "Authorization: Bearer $GOOGLE_TEST_TOKEN" \
  https://www.googleapis.com/calendar/v3/users/me/settings
```

### Performance Optimization

#### Slow Fixture Loading
- Use `COPY` instead of `INSERT` for bulk data
- Create indexes after data loading, not before
- Use connection pooling for multiple fixture files
- Pre-compress large fixture files

#### Container Resource Issues
- Monitor memory usage with `docker stats`
- Adjust PostgreSQL shared_buffers for available memory
- Use SSD-optimized PostgreSQL settings
- Implement connection limits to prevent resource exhaustion

---

**Implementation Status**: Ready for AUT-9 integration  
**Next Steps**: Container image builds and fixture repository setup