#!/bin/bash
# assign-missing-milestones.sh
# Intelligently assign milestones to all issues in Linear based on content analysis
# Usage: ./assign-missing-milestones.sh

# --- Milestone UUIDs ---
# M1 — Platform Foundations
CORE_BACKEND_APIS="ad332a2f-f981-4812-8104-86216948418c"
FRONTEND_INTEGRATION="9587db4f-8120-493a-8877-fe207019b624"
CI_CD_QA_BASELINE="70acfbbf-1fcf-4a85-a8a7-be660db22527"
INFRA_SETUP="a82d0c7b-083b-4ab5-9259-d38a56f6812e"
OPS="fb15740e-d290-47af-807a-c25a5dc93441"

LINEAR_API_KEY=$(grep LINEAR_API_KEY .env.local | cut -d '=' -f2)

# Function to analyze issue and determine appropriate milestone
determine_milestone() {
  local title="$1"
  local description="$2"
  local labels="$3"
  local combined_text="$title $description $labels"
  
  # Convert to lowercase for case-insensitive matching
  local text_lower=$(echo "$combined_text" | tr '[:upper:]' '[:lower:]')
  
  echo "    Analyzing: $text_lower" >&2
  
  # M1 — Platform Foundations patterns
  # Core Backend APIs
  if echo "$text_lower" | grep -E "(backend|api|endpoint|prisma|database|db|session|auth|calendar|oauth|schema|migration)" > /dev/null; then
    echo "$CORE_BACKEND_APIS"
    return
  fi
  
  # Frontend Integration 
  if echo "$text_lower" | grep -E "(frontend|fe|ui|ux|react|component|interface|type.*alignment|client.*codegen)" > /dev/null; then
    echo "$FRONTEND_INTEGRATION"
    return
  fi
  
  # CI/CD & QA Baseline
  if echo "$text_lower" | grep -E "(ci|cd|workflow|test|qa|integration.*test|pipeline|build|node.*version|dependency|baseline|drift)" > /dev/null; then
    echo "$CI_CD_QA_BASELINE"
    return
  fi
  
  # Infra Setup
  if echo "$text_lower" | grep -E "(docker|infra|infrastructure|aws|deployment|environment|env|secrets|production)" > /dev/null; then
    echo "$INFRA_SETUP"
    return
  fi
  
  # Ops
  if echo "$text_lower" | grep -E "(ops|operations|documentation|readme|hub\.md|linear|milestone|triage|handoff)" > /dev/null; then
    echo "$OPS"
    return
  fi
  
  # If no clear pattern matches, default to Core Backend APIs for M1 foundation work
  echo "$CORE_BACKEND_APIS"
}

# Fetch all issues with detailed information for analysis (up to 100 at a time)
RESPONSE=$(curl -s https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{
    "query": "query AllIssues($first: Int!) { issues(first: $first) { nodes { id identifier title description projectMilestone { id name } labels { nodes { name } } } } }",
    "variables": { "first": 100 }
  }')

# Use jq to parse JSON and check for null projectMilestone
if ! command -v jq &> /dev/null; then
  echo "jq is required for this script. Please install jq (https://stedolan.github.io/jq/) and rerun."
  exit 1
fi

ISSUE_COUNT=$(echo "$RESPONSE" | jq '.data.issues.nodes | length')
if [ "$ISSUE_COUNT" -eq 0 ]; then
  echo "No issues found."
  exit 0
fi

for i in $(seq 0 $((ISSUE_COUNT-1))); do
  ID=$(echo "$RESPONSE" | jq -r ".data.issues.nodes[$i].id")
  KEY=$(echo "$RESPONSE" | jq -r ".data.issues.nodes[$i].identifier")
  TITLE=$(echo "$RESPONSE" | jq -r ".data.issues.nodes[$i].title")
  DESCRIPTION=$(echo "$RESPONSE" | jq -r ".data.issues.nodes[$i].description // \"\"")
  LABELS=$(echo "$RESPONSE" | jq -r ".data.issues.nodes[$i].labels.nodes[].name" | tr '\n' ' ')
  MILESTONE_ID=$(echo "$RESPONSE" | jq -r ".data.issues.nodes[$i].projectMilestone.id")
  
  if [ "$MILESTONE_ID" = "null" ]; then
    echo "\n$KEY: $TITLE"
    echo "  No milestone attached."
    echo "  Description: ${DESCRIPTION:0:100}..."
    echo "  Labels: $LABELS"
    
    # Determine appropriate milestone based on content analysis
    CHOSEN_MILESTONE=$(determine_milestone "$TITLE" "$DESCRIPTION" "$LABELS")
    
    # Get milestone name for display
    case "$CHOSEN_MILESTONE" in
      "$CORE_BACKEND_APIS") MILESTONE_NAME="Core Backend APIs" ;;
      "$FRONTEND_INTEGRATION") MILESTONE_NAME="Frontend Integration" ;;
      "$CI_CD_QA_BASELINE") MILESTONE_NAME="CI/CD & QA Baseline" ;;
      "$INFRA_SETUP") MILESTONE_NAME="Infra Setup" ;;
      "$OPS") MILESTONE_NAME="Ops" ;;
      *) MILESTONE_NAME="Unknown" ;;
    esac
    
    echo "  → Assigning to: $MILESTONE_NAME"
    
    curl -s https://api.linear.app/graphql \
      -H "Content-Type: application/json" \
      -H "Authorization: $LINEAR_API_KEY" \
      -d '{
        "query": "mutation UpdateIssue($id: String!, $milestoneId: String) { issueUpdate(id: $id, input: { projectMilestoneId: $milestoneId }) { success issue { id identifier title projectMilestone { id name } } } }",
        "variables": {
          "id": "'$ID'",
          "milestoneId": "'$CHOSEN_MILESTONE'"
        }
      }' | grep -q '"success":true' && echo "    ✓ Success!" || echo "    ✗ Failed."
  else
    MILESTONE_NAME=$(echo "$RESPONSE" | jq -r ".data.issues.nodes[$i].projectMilestone.name")
    echo "\n$KEY: $TITLE"
    echo "  ✓ Already assigned to: $MILESTONE_NAME"
  fi
done

echo "\nAll done."