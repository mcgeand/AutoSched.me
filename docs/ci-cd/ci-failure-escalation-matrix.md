# CI Failure Escalation Matrix Implementation Guide

**Related**: [AUT-88 Spike Decisions](../spikes/AUT-88-ci-failure-escalation-matrix-decisions.md)  
**Status**: Ready for Implementation  
**Owner**: QA Team with cross-functional specialist coordination

## Overview

This guide covers implementing the comprehensive CI failure escalation matrix with automated triage, intelligent routing, and SLA tracking across all domains established in AUT-85, AUT-86, and AUT-87.

## Failure Detection and Categorization

### Automated Failure Classification
```bash
#!/bin/bash
# scripts/classify-ci-failure.sh

analyze_failure() {
  local failure_type=""
  local exit_code=$1
  local job_logs="$2"
  local changed_files="$3"
  
  # Categorize based on exit codes from previous spikes
  case $exit_code in
    2)  failure_type="generator_drift" ;;      # From AUT-85
    10) failure_type="security_critical" ;;   # From AUT-87
    11) failure_type="security_secrets" ;;    # From AUT-87
    12) failure_type="security_high" ;;       # From AUT-87
    13) failure_type="security_advisory" ;;   # From AUT-87
    *)  failure_type="unknown" ;;
  esac
  
  # Additional classification based on logs and context
  if grep -q "database.*connection" "$job_logs"; then
    failure_type="database_connectivity"
  elif grep -q "container.*timeout" "$job_logs"; then
    failure_type="infrastructure_timeout"
  elif grep -q "npm.*audit.*failed" "$job_logs"; then
    failure_type="dependency_vulnerability"
  elif grep -q "test.*failed" "$job_logs"; then
    failure_type="test_failure"
  elif grep -q "compilation.*error" "$job_logs"; then
    failure_type="build_failure"
  fi
  
  echo "$failure_type"
}

route_failure() {
  local failure_type="$1"
  local pr_number="$2"
  local failure_details="$3"
  
  case $failure_type in
    "generator_drift")
      notify_teams "backend_dev,frontend_dev" "🚨 Generator drift in PR #$pr_number"
      create_linear_ticket "CRITICAL" "Generator Drift" "$failure_details" "backend_dev"
      start_sla_timer "2_hours"
      ;;
    "security_secrets")
      notify_teams "security_team" "🚨 SECRET DETECTED in PR #$pr_number"
      create_linear_ticket "CRITICAL" "Secret Exposure" "$failure_details" "security_team"
      start_sla_timer "1_hour"
      trigger_credential_rotation
      ;;
    "database_connectivity")
      notify_teams "devops,database_specialist" "⚠️ Database connectivity issue"
      create_linear_ticket "HIGH" "Database Connectivity" "$failure_details" "devops"
      start_sla_timer "30_minutes"
      attempt_auto_recovery "database"
      ;;
    "test_failure")
      get_code_author "$pr_number"
      notify_teams "qa_analyst,$code_author" "⚠️ Test failure in PR #$pr_number"
      create_linear_ticket "MEDIUM" "Test Failure" "$failure_details" "$code_author"
      start_sla_timer "4_hours"
      ;;
  esac
}
```

### Integration with CI Pipeline
```yaml
# .github/workflows/failure-escalation.yml
name: CI Failure Escalation
on:
  workflow_run:
    workflows: ["CI Pipeline"]
    types: [completed]

jobs:
  escalate-failure:
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Download failure logs
        uses: actions/download-artifact@v4
        with:
          name: failure-logs
          run-id: ${{ github.event.workflow_run.id }}
      
      - name: Classify and route failure
        run: |
          FAILURE_TYPE=$(./scripts/classify-ci-failure.sh \
            "${{ github.event.workflow_run.conclusion }}" \
            "./failure-logs" \
            "${{ github.event.workflow_run.head_commit.id }}")
          
          ./scripts/route-failure.sh \
            "$FAILURE_TYPE" \
            "${{ github.event.workflow_run.pull_requests[0].number }}" \
            "$(cat failure-logs/summary.txt)"
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Team Notification System

### Slack Integration
```bash
#!/bin/bash
# scripts/notify-teams.sh

notify_teams() {
  local teams="$1"
  local message="$2"
  local failure_type="$3"
  local pr_number="$4"
  
  IFS=',' read -ra TEAM_ARRAY <<< "$teams"
  
  for team in "${TEAM_ARRAY[@]}"; do
    case $team in
      "backend_dev")
        slack_channel="#backend-dev"
        slack_user="@backend-oncall"
        ;;
      "frontend_dev")
        slack_channel="#frontend-dev"
        slack_user="@frontend-oncall"
        ;;
      "security_team")
        slack_channel="#security-alerts"
        slack_user="@security-oncall"
        ;;
      "devops")
        slack_channel="#devops-alerts"
        slack_user="@devops-oncall"
        ;;
      "qa_analyst")
        slack_channel="#qa-team"
        slack_user="@qa-lead"
        ;;
    esac
    
    # Format message based on failure severity
    if [[ "$failure_type" =~ ^(security_secrets|generator_drift|database_connectivity)$ ]]; then
      urgency="🚨 URGENT"
      color="danger"
    else
      urgency="⚠️ Standard"
      color="warning"
    fi
    
    curl -X POST "$SLACK_WEBHOOK" \
      -H 'Content-type: application/json' \
      -d "{
        \"channel\": \"$slack_channel\",
        \"username\": \"CI Escalation Bot\",
        \"color\": \"$color\",
        \"text\": \"$urgency: $message\",
        \"blocks\": [
          {
            \"type\": \"section\",
            \"text\": {
              \"type\": \"mrkdwn\",
              \"text\": \"$message\\n*PR*: #$pr_number\\n*Owner*: $slack_user\"
            }
          },
          {
            \"type\": \"actions\",
            \"elements\": [
              {
                \"type\": \"button\",
                \"text\": {\"type\": \"plain_text\", \"text\": \"View PR\"},
                \"url\": \"https://github.com/repo/pull/$pr_number\"
              },
              {
                \"type\": \"button\",
                \"text\": {\"type\": \"plain_text\", \"text\": \"Override (if applicable)\"},
                \"value\": \"override_$failure_type\"
              }
            ]
          }
        ]
      }"
  done
}
```

### Linear Ticket Integration
```bash
#!/bin/bash
# scripts/create-linear-ticket.sh

create_linear_ticket() {
  local priority="$1"
  local title="$2" 
  local description="$3"
  local assignee="$4"
  local failure_type="$5"
  
  # Map priority to Linear priority values
  case $priority in
    "CRITICAL") linear_priority=1 ;;
    "HIGH") linear_priority=2 ;;
    "MEDIUM") linear_priority=3 ;;
    "LOW") linear_priority=4 ;;
  esac
  
  # Get team ID for assignee
  team_id=$(get_linear_team_id "$assignee")
  
  # Create ticket with escalation metadata
  curl -X POST https://api.linear.app/graphql \
    -H "Authorization: Bearer $LINEAR_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"query\": \"mutation {
        issueCreate(input: {
          title: \\\"CI Failure: $title\\\",
          description: \\\"$description\\\\n\\\\n**Failure Type**: $failure_type\\\\n**SLA Timer**: Started at $(date -u +%Y-%m-%dT%H:%M:%SZ)\\\\n**Auto-escalation**: Enabled\\\",
          priority: $linear_priority,
          teamId: \\\"$team_id\\\",
          labels: [\\\"ci-failure\\\", \\\"escalation-active\\\", \\\"$failure_type\\\"]
        }) {
          success
          issue {
            id
            url
            identifier
          }
        }
      }\"
    }" | jq -r '.data.issueCreate.issue.url'
}
```

## SLA Timer and Escalation Automation

### SLA Tracking System
```bash
#!/bin/bash
# scripts/sla-timer.sh

start_sla_timer() {
  local duration="$1"
  local failure_id="$2"
  local failure_type="$3"
  local assigned_teams="$4"
  
  # Convert duration to seconds
  case $duration in
    "30_minutes") sla_seconds=1800 ;;
    "1_hour") sla_seconds=3600 ;;
    "2_hours") sla_seconds=7200 ;;
    "4_hours") sla_seconds=14400 ;;
    "8_hours") sla_seconds=28800 ;;
    "24_hours") sla_seconds=86400 ;;
  esac
  
  # Create SLA tracking record
  echo "{
    \"failure_id\": \"$failure_id\",
    \"failure_type\": \"$failure_type\",
    \"assigned_teams\": \"$assigned_teams\",
    \"sla_deadline\": \"$(date -u -d \"+$sla_seconds seconds\" +%Y-%m-%dT%H:%M:%SZ)\",
    \"status\": \"active\",
    \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }" >> /tmp/sla-tracking.jsonl
  
  # Schedule escalation check
  schedule_sla_check "$failure_id" "$sla_seconds"
}

check_sla_compliance() {
  local failure_id="$1"
  
  # Check if issue is still open and SLA exceeded
  issue_status=$(get_linear_issue_status "$failure_id")
  sla_deadline=$(get_sla_deadline "$failure_id")
  current_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  
  if [[ "$issue_status" != "Done" ]] && [[ "$current_time" > "$sla_deadline" ]]; then
    escalate_sla_miss "$failure_id"
  fi
}

escalate_sla_miss() {
  local failure_id="$1"
  local failure_details=$(get_failure_details "$failure_id")
  
  # Notify scrum master and management
  notify_teams "scrum_master" "🚨 SLA MISS: $failure_details"
  
  # Update Linear ticket with escalation
  update_linear_ticket "$failure_id" "SLA_MISSED" "Escalating to management review"
  
  # Log for pattern analysis
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): SLA MISS - $failure_id" >> /var/log/sla-misses.log
}
```

### Override Request System
```bash
#!/bin/bash
# scripts/handle-override-request.sh

handle_override_request() {
  local failure_id="$1"
  local requesting_user="$2"
  local justification="$3"
  local failure_type="$4"
  
  # Check if override is allowed for this failure type
  case $failure_type in
    "security_secrets"|"generator_drift"|"security_critical")
      echo "Override denied: Zero tolerance policy for $failure_type"
      notify_user "$requesting_user" "❌ Override denied for $failure_type (zero tolerance policy)"
      return 1
      ;;
    "infrastructure_timeout"|"database_connectivity")
      if infrastructure_issue_confirmed "$failure_id"; then
        approve_override "$failure_id" "$requesting_user" "$justification"
      else
        request_infrastructure_confirmation "$failure_id" "$requesting_user"
      fi
      ;;
    "test_failure"|"build_failure")
      if is_hotfix_approved "$failure_id"; then
        approve_override "$failure_id" "$requesting_user" "$justification"
      else
        request_hotfix_approval "$failure_id" "$requesting_user"
      fi
      ;;
  esac
}

approve_override() {
  local failure_id="$1"
  local approver="$2"
  local justification="$3"
  
  # Log override for accountability
  echo "{
    \"failure_id\": \"$failure_id\",
    \"approver\": \"$approver\",
    \"justification\": \"$justification\",
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"requires_followup\": true
  }" >> /var/log/ci-overrides.jsonl
  
  # Create follow-up ticket
  create_linear_ticket "HIGH" "Override Follow-up" \
    "Fix required for overridden CI failure: $failure_id\\nJustification: $justification" \
    "$approver"
  
  # Notify teams
  notify_teams "scrum_master,qa_analyst" \
    "✅ Override approved for $failure_id by $approver"
  
  # Allow CI to proceed
  mark_override_approved "$failure_id"
}
```

## Auto-Recovery and Retry Logic

### Infrastructure Auto-Recovery
```bash
#!/bin/bash
# scripts/auto-recovery.sh

attempt_auto_recovery() {
  local failure_type="$1"
  local failure_context="$2"
  
  case $failure_type in
    "database")
      echo "Attempting database auto-recovery..."
      
      # Check container health
      if ! docker exec postgres-container pg_isready; then
        echo "Restarting PostgreSQL container..."
        docker restart postgres-container
        sleep 30
        
        if docker exec postgres-container pg_isready; then
          echo "✅ Database auto-recovery successful"
          update_failure_status "$failure_context" "auto_recovered"
          return 0
        fi
      fi
      
      # Check connection pool
      if connection_pool_exhausted; then
        echo "Resetting connection pool..."
        reset_connection_pool
        if test_database_connectivity; then
          echo "✅ Connection pool reset successful"
          update_failure_status "$failure_context" "auto_recovered"
          return 0
        fi
      fi
      
      echo "❌ Database auto-recovery failed, escalating to DevOps"
      return 1
      ;;
      
    "ci_runner")
      echo "Attempting CI runner auto-recovery..."
      
      # Check GitHub Actions status
      if github_actions_degraded; then
        echo "GitHub Actions degraded, scheduling retry in 10 minutes"
        schedule_retry "$failure_context" "10_minutes"
        return 0
      fi
      
      # Check resource usage
      if runner_resource_exhausted; then
        echo "Runner resources exhausted, waiting for cleanup"
        wait_for_resource_cleanup
        schedule_retry "$failure_context" "5_minutes"
        return 0
      fi
      
      echo "❌ CI runner auto-recovery failed, escalating to DevOps"
      return 1
      ;;
  esac
}

intelligent_retry() {
  local failure_type="$1"
  local retry_count="$2"
  local max_retries="$3"
  
  if [ "$retry_count" -ge "$max_retries" ]; then
    echo "Max retries exceeded, escalating to human intervention"
    return 1
  fi
  
  # Calculate backoff delay
  backoff_delay=$((2 ** retry_count * 60))  # Exponential backoff in seconds
  
  echo "Scheduling intelligent retry #$((retry_count + 1)) in $backoff_delay seconds"
  sleep "$backoff_delay"
  
  # Check if conditions have improved
  case $failure_type in
    "external_api")
      if external_service_healthy "snyk"; then
        return 0
      fi
      ;;
    "resource_contention")
      if system_resources_available; then
        return 0
      fi
      ;;
  esac
  
  return 1
}
```

## Dashboard and Monitoring Integration

### Real-Time CI Health Dashboard
```javascript
// public/dashboard/ci-health.js
class CIHealthDashboard {
  constructor() {
    this.refreshInterval = 30000; // 30 seconds
    this.initializeComponents();
    this.startAutoRefresh();
  }
  
  async loadFailureData() {
    const response = await fetch('/api/ci-health');
    const data = await response.json();
    
    this.updateFailureMetrics(data.failures);
    this.updateSLAStatus(data.slaTracking);
    this.updateTeamOwnership(data.ownership);
    this.updatePerformanceTrends(data.performance);
  }
  
  updateFailureMetrics(failures) {
    const categorizedFailures = {
      generator_drift: failures.filter(f => f.type === 'generator_drift'),
      security: failures.filter(f => f.type.startsWith('security_')),
      database: failures.filter(f => f.type.includes('database')),
      infrastructure: failures.filter(f => f.type.includes('infrastructure')),
      test_failure: failures.filter(f => f.type === 'test_failure')
    };
    
    // Update dashboard metrics
    Object.entries(categorizedFailures).forEach(([category, failureList]) => {
      document.getElementById(`${category}-count`).textContent = failureList.length;
      
      // Show SLA urgency
      const urgentFailures = failureList.filter(f => f.slaTimeRemaining < 3600);
      if (urgentFailures.length > 0) {
        document.getElementById(`${category}-status`).className = 'status-urgent';
      }
    });
  }
  
  updateSLAStatus(slaData) {
    const slaContainer = document.getElementById('sla-tracking');
    slaContainer.innerHTML = '';
    
    slaData.forEach(sla => {
      const timeRemaining = new Date(sla.deadline) - new Date();
      const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
      
      const slaElement = document.createElement('div');
      slaElement.className = `sla-item ${hoursRemaining < 1 ? 'urgent' : ''}`;
      slaElement.innerHTML = `
        <div class="sla-failure-type">${sla.failureType}</div>
        <div class="sla-owner">${sla.assignedTeam}</div>
        <div class="sla-timer">${hoursRemaining}h remaining</div>
        <div class="sla-actions">
          <button onclick="viewFailureDetails('${sla.failureId}')">Details</button>
          ${this.canRequestOverride(sla.failureType) ? 
            `<button onclick="requestOverride('${sla.failureId}')">Request Override</button>` : ''}
        </div>
      `;
      slaContainer.appendChild(slaElement);
    });
  }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  new CIHealthDashboard();
});
```

### Metrics Collection and Analysis
```bash
#!/bin/bash
# scripts/collect-escalation-metrics.sh

collect_daily_metrics() {
  local date=$(date +%Y-%m-%d)
  local metrics_file="/var/log/escalation-metrics-$date.json"
  
  # SLA compliance metrics
  total_failures=$(wc -l < /tmp/sla-tracking.jsonl)
  sla_hits=$(grep '"status":"resolved_within_sla"' /tmp/sla-tracking.jsonl | wc -l)
  sla_misses=$(grep '"status":"sla_exceeded"' /tmp/sla-tracking.jsonl | wc -l)
  
  # Override usage metrics
  total_overrides=$(wc -l < /var/log/ci-overrides.jsonl)
  emergency_overrides=$(grep '"justification":".*emergency.*"' /var/log/ci-overrides.jsonl | wc -l)
  
  # Failure type distribution
  generator_failures=$(grep '"failure_type":"generator_drift"' /tmp/sla-tracking.jsonl | wc -l)
  security_failures=$(grep '"failure_type":"security_' /tmp/sla-tracking.jsonl | wc -l)
  infrastructure_failures=$(grep '"failure_type":".*infrastructure.*"' /tmp/sla-tracking.jsonl | wc -l)
  
  # Team performance metrics
  avg_resolution_time=$(calculate_avg_resolution_time)
  fastest_resolving_team=$(get_fastest_resolving_team)
  
  # Generate metrics report
  cat > "$metrics_file" << EOF
{
  "date": "$date",
  "sla_compliance": {
    "total_failures": $total_failures,
    "sla_hits": $sla_hits,
    "sla_misses": $sla_misses,
    "compliance_rate": $(echo "scale=2; $sla_hits * 100 / $total_failures" | bc)
  },
  "override_usage": {
    "total_overrides": $total_overrides,
    "emergency_overrides": $emergency_overrides,
    "override_rate": $(echo "scale=2; $total_overrides * 100 / $total_failures" | bc)
  },
  "failure_distribution": {
    "generator_drift": $generator_failures,
    "security": $security_failures,
    "infrastructure": $infrastructure_failures
  },
  "team_performance": {
    "avg_resolution_time_hours": $avg_resolution_time,
    "fastest_resolving_team": "$fastest_resolving_team"
  }
}
EOF

  # Send to monitoring system
  if [ -n "$METRICS_ENDPOINT" ]; then
    curl -X POST "$METRICS_ENDPOINT/escalation-metrics" \
      -H "Content-Type: application/json" \
      -d @"$metrics_file"
  fi
}

# Weekly pattern analysis
analyze_weekly_patterns() {
  echo "=== Weekly Escalation Pattern Analysis ===" 
  
  # Identify repeat failure patterns
  echo "Most common failure types:"
  grep -o '"failure_type":"[^"]*"' /tmp/sla-tracking.jsonl | \
    sort | uniq -c | sort -rn | head -5
  
  # Teams with highest override usage
  echo "Teams with highest override usage:"
  grep -o '"approver":"[^"]*"' /var/log/ci-overrides.jsonl | \
    sort | uniq -c | sort -rn | head -5
  
  # SLA miss patterns
  echo "SLA miss patterns by time of day:"
  grep '"status":"sla_exceeded"' /tmp/sla-tracking.jsonl | \
    grep -o '"created_at":"[^"]*"' | cut -d'T' -f2 | cut -d':' -f1 | \
    sort | uniq -c | sort -n
    
  # Recommendations for process improvement
  generate_improvement_recommendations
}
```

## Training and Documentation

### Team Training Materials
```markdown
# CI Failure Escalation Training Guide

## Quick Reference Card

### When You Get a CI Failure Alert

1. **Check the failure type** in Slack notification
2. **Estimate complexity**: Simple fix vs complex investigation
3. **Start timer**: You have an SLA to meet
4. **Need help?**: Tag the secondary owner
5. **Can't fix in time?**: Request override with justification

### SLA Quick Reference

| Failure Type | Your SLA | Override Allowed? |
|--------------|----------|-------------------|
| Secret detected | 1 hour | ❌ Never |
| Generator drift | 2 hours | ❌ Never |
| Infrastructure | 30min-1hr | ✅ With justification |
| Test failures | 4 hours | ✅ Emergency only |
| Build errors | 2 hours | ✅ Rarely needed |
| Security vulns | 24 hours | ✅ With approval |

### Override Request Process

1. Click "Request Override" in Slack notification
2. Provide clear justification
3. Wait for QA/Scrum Master approval
4. Fix the underlying issue (creates follow-up ticket)
```

## Troubleshooting Guide

### Common Escalation Issues

#### False Positive Failure Classification
```bash
# Re-classify failure if initial classification was wrong
reclassify_failure() {
  local failure_id="$1"
  local new_type="$2"
  local justification="$3"
  
  # Update classification
  update_failure_classification "$failure_id" "$new_type"
  
  # Adjust SLA timer
  adjust_sla_timer "$failure_id" "$new_type"
  
  # Re-route to correct team
  route_failure "$new_type" "$failure_id" "$justification"
  
  # Log classification change
  log_classification_change "$failure_id" "$new_type" "$justification"
}
```

#### SLA Timer Accuracy Issues
```bash
# Handle SLA timer corrections
correct_sla_timer() {
  local failure_id="$1"
  local correct_start_time="$2"
  local reason="$3"
  
  # Recalculate SLA deadline
  new_deadline=$(calculate_sla_deadline "$failure_id" "$correct_start_time")
  
  # Update tracking
  update_sla_deadline "$failure_id" "$new_deadline"
  
  # Notify affected teams
  notify_sla_correction "$failure_id" "$new_deadline" "$reason"
}
```

#### Override Approval Delays
```bash
# Escalate override approval if delayed
escalate_override_approval() {
  local override_request_id="$1"
  local waiting_time="$2"
  
  if [ "$waiting_time" -gt 900 ]; then  # 15 minutes
    notify_teams "scrum_master" "⚠️ Override approval delayed: $override_request_id"
    
    # Auto-approve for confirmed infrastructure issues
    if infrastructure_issue_confirmed "$override_request_id"; then
      auto_approve_override "$override_request_id" "infrastructure_confirmed"
    fi
  fi
}
```

---

**Implementation Status**: Ready for AUT-9 integration  
**Next Steps**: Dashboard deployment, team training, and escalation procedure testing