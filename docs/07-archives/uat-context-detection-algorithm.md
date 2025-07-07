# UAT Context Detection Algorithm

**Document ID**: uat-context-detection-algorithm  
**Created**: July 5, 2025  
**Purpose**: Algorithm design for detecting UAT context from user messages

## Overview

The UAT context detection algorithm automatically identifies when users want to perform UAT testing based on their natural language input and tool usage patterns. This eliminates the need for external initialization while ensuring accurate detection of UAT intentions.

## Detection Strategy

### Multi-Layer Detection Approach
1. **Primary Detection**: Natural language analysis of user messages
2. **Secondary Detection**: Browser MCP tool usage patterns
3. **Context Validation**: Scenario existence and validity checks
4. **Confidence Scoring**: Weighted scoring for decision making

## Keyword Pattern Analysis

### High-Confidence Patterns (95-100% confidence)
```bash
# Explicit UAT requests
"test.*scenario"
"run.*uat"
"execute.*scenario"
"perform.*uat.*test"

# Scenario-specific patterns
"test.*login.*flow"
"test.*vehicle.*crud"
"run.*login.*scenario"
"execute.*vehicle.*test"

# Action-specific UAT patterns
"test.*authentication"
"verify.*login.*functionality"
"validate.*user.*flow"
"check.*crud.*operations"
```

### Medium-Confidence Patterns (70-94% confidence)
```bash
# General testing language
"test.*functionality"
"verify.*feature"
"validate.*system"
"check.*application"

# Navigation with testing intent
"navigate.*and.*test"
"go.*to.*login.*and.*verify"
"open.*page.*and.*check"

# Browser automation patterns
"take.*screenshot.*of"
"fill.*form.*and.*submit"
"click.*button.*and.*verify"
```

### Low-Confidence Patterns (50-69% confidence)
```bash
# Simple navigation
"navigate.*to"
"go.*to.*page"
"open.*application"

# Basic interactions
"click.*button"
"fill.*form"
"take.*screenshot"
```

### Exclusion Patterns (0% confidence)
```bash
# General development tasks
"create.*file"
"update.*code"
"fix.*bug"
"install.*package"

# Documentation requests
"explain.*how"
"show.*me.*example"
"what.*is.*difference"
```

## Scenario Name Extraction

### Direct Scenario References
```bash
# Pattern: "scenario-name" or "scenario_name"
"login-flow" → scenario: "login-flow"
"vehicle-crud" → scenario: "vehicle-crud"
"user-registration" → scenario: "user-registration"

# Pattern: "test X scenario"
"test login flow scenario" → scenario: "login-flow"
"test vehicle crud scenario" → scenario: "vehicle-crud"
"run user registration scenario" → scenario: "user-registration"
```

### Contextual Scenario Inference
```bash
# Authentication-related keywords → login-flow
"login", "authentication", "sign in", "auth", "credentials"
→ scenario: "login-flow"

# Vehicle-related keywords → vehicle-crud
"vehicle", "fleet", "car", "truck", "capacity", "route"
→ scenario: "vehicle-crud"

# User management keywords → user-registration  
"user", "register", "signup", "profile", "account"
→ scenario: "user-registration"
```

### Scenario Validation
```bash
# Check if extracted scenario exists
validate_scenario() {
    local scenario_name="$1"
    local scenario_file="/uat/scenarios/${scenario_name}.js"
    
    if [[ -f "$scenario_file" ]]; then
        # Validate scenario structure
        if node -e "require('$scenario_file')" 2>/dev/null; then
            return 0  # Valid scenario
        fi
    fi
    return 1  # Invalid or missing scenario
}
```

## Tool Usage Pattern Analysis

### Browser MCP Tool Patterns
```bash
# High UAT likelihood tools
"mcp__playwright__playwright_navigate" + authentication URLs
"mcp__playwright__playwright_fill" + login form patterns
"mcp__playwright__playwright_click" + submit button patterns
"mcp__playwright__playwright_screenshot" + verification context

# Medium UAT likelihood tools
"mcp__playwright__playwright_evaluate" + validation scripts
"mcp__playwright__playwright_hover" + interactive elements
"mcp__playwright__playwright_select" + form interactions
```

### URL Pattern Analysis
```bash
# Authentication URLs (high UAT likelihood)
"/auth/login"
"/login"
"/signin"
"/authentication"

# Application URLs (medium UAT likelihood)  
"/dashboard"
"/projects"
"/vehicles"
"/users"

# API URLs (low UAT likelihood)
"/api/"
"/graphql"
"/rest/"
```

## Confidence Scoring Algorithm

### Scoring Components
```bash
calculate_confidence_score() {
    local user_message="$1"
    local tool_name="$2"
    local tool_params="$3"
    
    local score=0
    
    # Message analysis (0-50 points)
    score=$((score + analyze_message_patterns "$user_message"))
    
    # Tool analysis (0-30 points)
    score=$((score + analyze_tool_patterns "$tool_name" "$tool_params"))
    
    # Context analysis (0-20 points)
    score=$((score + analyze_context_patterns "$user_message" "$tool_name"))
    
    echo $score
}
```

### Message Pattern Scoring
```bash
analyze_message_patterns() {
    local message="$1"
    local score=0
    
    # High-confidence patterns (30-50 points)
    if [[ "$message" =~ test.*scenario|run.*uat|execute.*scenario ]]; then
        score=$((score + 50))
    elif [[ "$message" =~ test.*(login|vehicle|crud|flow) ]]; then
        score=$((score + 40))
    elif [[ "$message" =~ (verify|validate|check).*(functionality|feature) ]]; then
        score=$((score + 35))
    fi
    
    # Medium-confidence patterns (15-30 points)
    if [[ "$message" =~ test.*functionality|verify.*feature ]]; then
        score=$((score + 25))
    elif [[ "$message" =~ navigate.*and.*(test|verify|check) ]]; then
        score=$((score + 20))
    fi
    
    # Low-confidence patterns (5-15 points)
    if [[ "$message" =~ take.*screenshot|fill.*form|click.*button ]]; then
        score=$((score + 10))
    fi
    
    echo $score
}
```

### Tool Pattern Scoring
```bash
analyze_tool_patterns() {
    local tool_name="$1" 
    local tool_params="$2"
    local score=0
    
    # Browser MCP tools get base score
    if [[ "$tool_name" =~ mcp__playwright__ ]]; then
        score=$((score + 10))
        
        # URL analysis
        local url=$(echo "$tool_params" | jq -r '.url // ""')
        if [[ "$url" =~ /auth/|/login|/signin ]]; then
            score=$((score + 20))  # Authentication URLs
        elif [[ "$url" =~ /(dashboard|projects|vehicles|users) ]]; then
            score=$((score + 15))  # Application URLs
        fi
        
        # Action analysis
        case "$tool_name" in
            "*navigate*")
                if [[ "$url" =~ /auth/ ]]; then score=$((score + 10)); fi
                ;;
            "*fill*")
                score=$((score + 15))  # Form interactions likely UAT
                ;;
            "*click*")
                score=$((score + 10))  # Button clicks likely UAT
                ;;
            "*screenshot*")
                score=$((score + 5))   # Screenshots often part of UAT
                ;;
        esac
    fi
    
    echo $score
}
```

### Context Pattern Scoring
```bash
analyze_context_patterns() {
    local message="$1"
    local tool_name="$2"
    local score=0
    
    # Message + tool correlation
    if [[ "$message" =~ login && "$tool_name" =~ navigate && "$tool_params" =~ /auth/ ]]; then
        score=$((score + 20))  # Perfect correlation
    elif [[ "$message" =~ test && "$tool_name" =~ mcp__playwright__ ]]; then
        score=$((score + 15))  # Good correlation
    elif [[ "$message" =~ verify && "$tool_name" =~ screenshot ]]; then
        score=$((score + 10))  # Verification correlation
    fi
    
    echo $score
}
```

## Decision Making Logic

### Confidence Thresholds
```bash
# Confidence score ranges (0-100)
THRESHOLD_HIGH=80      # Definitely UAT (auto-initialize)
THRESHOLD_MEDIUM=60    # Probably UAT (initialize with confirmation)
THRESHOLD_LOW=40       # Maybe UAT (require explicit confirmation)
THRESHOLD_NONE=20      # Probably not UAT (allow normal execution)

make_uat_decision() {
    local confidence_score="$1"
    local scenario_name="$2"
    
    if [[ $confidence_score -ge $THRESHOLD_HIGH ]]; then
        if validate_scenario "$scenario_name"; then
            echo "auto_initialize:$scenario_name"
        else
            echo "error:invalid_scenario"
        fi
    elif [[ $confidence_score -ge $THRESHOLD_MEDIUM ]]; then
        echo "confirm_initialize:$scenario_name"
    elif [[ $confidence_score -ge $THRESHOLD_LOW ]]; then
        echo "suggest_uat:$scenario_name"
    else
        echo "allow_normal"
    fi
}
```

### Auto-Initialization Conditions
```bash
should_auto_initialize() {
    local confidence_score="$1"
    local scenario_name="$2"
    local tool_name="$3"
    
    # High confidence + valid scenario + browser tool
    if [[ $confidence_score -ge $THRESHOLD_HIGH ]] && \
       validate_scenario "$scenario_name" && \
       [[ "$tool_name" =~ mcp__playwright__ ]]; then
        return 0  # Auto-initialize
    fi
    
    return 1  # Don't auto-initialize
}
```

## Scenario Mapping Logic

### Available Scenarios Detection
```bash
get_available_scenarios() {
    local scenarios_dir="/uat/scenarios"
    local scenarios=()
    
    for scenario_file in "$scenarios_dir"/*.js; do
        if [[ -f "$scenario_file" ]]; then
            local scenario_name=$(basename "$scenario_file" .js)
            if validate_scenario "$scenario_name"; then
                scenarios+=("$scenario_name")
            fi
        fi
    done
    
    printf '%s\n' "${scenarios[@]}"
}
```

### Best Match Selection
```bash
find_best_scenario_match() {
    local user_message="$1"
    local available_scenarios
    available_scenarios=($(get_available_scenarios))
    
    local best_match=""
    local best_score=0
    
    for scenario in "${available_scenarios[@]}"; do
        local score=$(calculate_scenario_match_score "$user_message" "$scenario")
        if [[ $score -gt $best_score ]]; then
            best_score=$score
            best_match="$scenario"
        fi
    done
    
    if [[ $best_score -ge 30 ]]; then  # Minimum threshold for match
        echo "$best_match"
    fi
}
```

### Scenario Match Scoring
```bash
calculate_scenario_match_score() {
    local message="$1"
    local scenario="$2"
    local score=0
    
    case "$scenario" in
        "login-flow")
            if [[ "$message" =~ login|auth|signin|credential ]]; then
                score=$((score + 50))
            fi
            ;;
        "vehicle-crud")
            if [[ "$message" =~ vehicle|fleet|car|truck|crud ]]; then
                score=$((score + 50))
            fi
            ;;
        "user-registration")
            if [[ "$message" =~ user|register|signup|account ]]; then
                score=$((score + 50))
            fi
            ;;
    esac
    
    # Exact scenario name match
    if [[ "$message" =~ $scenario ]]; then
        score=$((score + 30))
    fi
    
    echo $score
}
```

## Implementation Algorithm

### Main Detection Function
```bash
detect_uat_context() {
    local user_message="$1"
    local tool_name="$2"
    local tool_params="$3"
    
    # Calculate confidence score
    local confidence_score=$(calculate_confidence_score "$user_message" "$tool_name" "$tool_params")
    
    # Extract or infer scenario name
    local scenario_name=$(extract_scenario_name "$user_message")
    if [[ -z "$scenario_name" ]]; then
        scenario_name=$(find_best_scenario_match "$user_message")
    fi
    
    # Make UAT decision
    local decision=$(make_uat_decision "$confidence_score" "$scenario_name")
    
    # Return detection result
    local result=$(jq -n \
        --arg decision "$decision" \
        --arg scenario "$scenario_name" \
        --argjson confidence "$confidence_score" \
        --arg message "$user_message" \
        --arg tool "$tool_name" \
        '{
            decision: $decision,
            scenario: $scenario,
            confidence: $confidence,
            context: {
                message: $message,
                tool: $tool,
                timestamp: now | todate
            }
        }')
    
    echo "$result"
}
```

### Integration with PreToolUse Hook
```bash
# In claude-uat-orchestrator.sh PreToolUse hook
main() {
    local hook_input=$(cat)
    local user_message=$(echo "$hook_input" | jq -r '.user_message // ""')
    local tool_name=$(echo "$hook_input" | jq -r '.tool_name // ""')
    local tool_params=$(echo "$hook_input" | jq -r '.parameters // {}')
    
    # Detect UAT context
    local detection_result=$(detect_uat_context "$user_message" "$tool_name" "$tool_params")
    local decision=$(echo "$detection_result" | jq -r '.decision')
    
    case "$decision" in
        "auto_initialize:"*)
            local scenario_name="${decision#auto_initialize:}"
            initialize_uat_session "$scenario_name"
            enhance_tool_parameters "$tool_name" "$tool_params"
            ;;
        "allow_normal")
            output_response "approve" "Normal tool execution"
            ;;
        "error:"*)
            local error_type="${decision#error:}"
            output_response "block" "UAT error: $error_type"
            ;;
    esac
}
```

## Testing and Validation

### Test Cases
```bash
# High-confidence detection tests
test_message="test login-flow scenario"
test_message="run vehicle crud UAT"
test_message="execute user registration test"

# Medium-confidence detection tests  
test_message="verify login functionality"
test_message="test vehicle management features"
test_message="validate user authentication"

# Low-confidence detection tests
test_message="navigate to login page"
test_message="take screenshot of dashboard"
test_message="fill out user form"

# Negative detection tests
test_message="create new component"
test_message="update documentation"
test_message="fix bug in code"
```

### Validation Metrics
- **Precision**: Percentage of correct UAT detections
- **Recall**: Percentage of UAT intentions successfully detected
- **False Positive Rate**: Non-UAT requests incorrectly detected as UAT
- **False Negative Rate**: UAT requests missed by detection

### Success Criteria
- Precision ≥ 95% (minimize false positives)
- Recall ≥ 90% (catch most UAT intentions)
- False Positive Rate ≤ 5%
- Response Time ≤ 2 seconds

---

**Algorithm Design Complete**: This algorithm provides robust, multi-layer detection of UAT context from natural language input.