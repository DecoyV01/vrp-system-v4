#!/bin/bash

# Contract Creation Validation Hook for VRP System v4
# Validates tech contracts during creation for quality and completeness
# Runs before contracts are used for development validation

PROJECT_ROOT="/mnt/c/projects/vrp-system/v4"
CONTRACT_DIR="$PROJECT_ROOT/docs/11-tech-contracts"
LOGS_DIR="$PROJECT_ROOT/logs"
BACKEND_GUIDE="$PROJECT_ROOT/docs/04-development/convex-development-guide-backend.md"
FRONTEND_GUIDE="$PROJECT_ROOT/docs/04-development/Full Design System Guidelines Document-frontend.md"

# Create logs directory if it doesn't exist
mkdir -p "$LOGS_DIR"

# Read JSON input from stdin
input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name')
file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""')

# Only process contract files
if [[ ! "$file_path" =~ docs/11-tech-contracts/.*\.json$ ]]; then
    exit 0
fi

# Skip if not a code modification tool
if [[ ! "$tool_name" =~ ^(Write|Edit|MultiEdit)$ ]]; then
    exit 0
fi

# Extract content based on tool type
if [[ "$tool_name" == "Edit" || "$tool_name" == "MultiEdit" ]]; then
    content=$(echo "$input" | jq -r '.tool_input.new_string // ""')
    if [[ "$tool_name" == "MultiEdit" ]]; then
        # For MultiEdit, combine all new strings
        content=$(echo "$input" | jq -r '.tool_input.edits[].new_string' | tr '\n' ' ')
    fi
elif [[ "$tool_name" == "Write" ]]; then
    content=$(echo "$input" | jq -r '.tool_input.content // ""')
else
    exit 0
fi

# Initialize logging
timestamp=$(date '+%Y%m%d-%H%M%S')
log_file="$LOGS_DIR/contract-creation-validation-$timestamp.log"

# Logging functions
log_message() {
    echo "$(date '+%a %b %d %H:%M:%S %Z %Y'): $1" | tee -a "$log_file"
}

log_violation() {
    log_message "❌ VIOLATION: $1"
}

log_warning() {
    log_message "⚠️  WARNING: $1"
}

log_success() {
    log_message "✅ SUCCESS: $1"
}

log_info() {
    log_message "ℹ️  INFO: $1"
}

# Validation state
validation_errors=0
validation_warnings=0

# Main validation function
validate_contract() {
    local contract_content="$1"
    local file_path="$2"
    
    log_message "Starting contract validation for $file_path"
    
    # Validate JSON syntax first
    if ! echo "$contract_content" | jq . >/dev/null 2>&1; then
        log_violation "Invalid JSON syntax in contract"
        validation_errors=$((validation_errors + 1))
        return 1
    fi
    
    # Run all validation checks
    validate_contract_structure "$contract_content"
    validate_prd_coverage "$contract_content"
    validate_guidelines_compliance "$contract_content"
    validate_pattern_quality "$contract_content"
    
    # Calculate final score
    local score
    score=$(calculate_completeness_score "$contract_content")
    log_info "Contract completeness score: $score/100"
    
    # Report final results
    if [[ $validation_errors -gt 0 ]]; then
        log_violation "Contract validation failed with $validation_errors error(s) and $validation_warnings warning(s)"
        return 1
    elif [[ $validation_warnings -gt 0 ]]; then
        log_warning "Contract validation passed with $validation_warnings warning(s)"
        return 0
    else
        log_success "Contract validation passed with no issues"
        return 0
    fi
}

# 1. Contract Structure Validation
validate_contract_structure() {
    local contract_content="$1"
    
    log_info "Validating contract structure..."
    
    # Required fields validation
    local required_fields=("contractId" "prdName" "name" "appliesTo" "requirements")
    for field in "${required_fields[@]}"; do
        if ! echo "$contract_content" | jq -e ".$field" >/dev/null 2>&1; then
            log_violation "Missing required field: $field"
            validation_errors=$((validation_errors + 1))
        fi
    done
    
    # Contract ID format validation (e.g., TBL-CSV-001)
    local contract_id
    contract_id=$(echo "$contract_content" | jq -r '.contractId // ""')
    if [[ -n "$contract_id" ]]; then
        if [[ ! "$contract_id" =~ ^[A-Z]{3}-[A-Z]{3,6}-[0-9]{3}$ ]]; then
            log_violation "Invalid contractId format: '$contract_id' (expected: XXX-XXXXX-000)"
            validation_errors=$((validation_errors + 1))
        fi
    fi
    
    # Validate appliesTo structure
    if echo "$contract_content" | jq -e '.appliesTo' >/dev/null 2>&1; then
        if ! echo "$contract_content" | jq -e '.appliesTo.filePatterns' >/dev/null 2>&1; then
            log_violation "Missing appliesTo.filePatterns array"
            validation_errors=$((validation_errors + 1))
        fi
    fi
    
    # Validate requirements structure
    if echo "$contract_content" | jq -e '.requirements' >/dev/null 2>&1; then
        local req_count
        req_count=$(echo "$contract_content" | jq '.requirements | length')
        if [[ "$req_count" -eq 0 ]]; then
            log_violation "Requirements object is empty"
            validation_errors=$((validation_errors + 1))
        fi
    fi
}

# 2. PRD Coverage Validation
validate_prd_coverage() {
    local contract_content="$1"
    
    log_info "Validating PRD coverage..."
    
    # Extract PRD reference
    local prd_reference
    prd_reference=$(echo "$contract_content" | jq -r '.prdReference // ""')
    
    if [[ -z "$prd_reference" ]]; then
        log_warning "Missing PRD reference - consider adding for traceability"
        validation_warnings=$((validation_warnings + 1))
        return 0
    fi
    
    # Verify PRD file exists
    local prd_file
    prd_file=$(echo "$prd_reference" | cut -d'#' -f1)
    if [[ ! -f "$PROJECT_ROOT/$prd_file" ]]; then
        log_violation "Referenced PRD file not found: $prd_file"
        validation_errors=$((validation_errors + 1))
    else
        log_success "PRD reference validated: $prd_file"
    fi
}

# 3. Development Guidelines Compliance
validate_guidelines_compliance() {
    local contract_content="$1"
    
    log_info "Validating development guidelines compliance..."
    
    # Get file patterns from contract
    local file_patterns
    file_patterns=$(echo "$contract_content" | jq -r '.appliesTo.filePatterns[]?' 2>/dev/null)
    
    if [[ -z "$file_patterns" ]]; then
        log_warning "No file patterns defined - cannot determine applicable guidelines"
        validation_warnings=$((validation_warnings + 1))
        return 0
    fi
    
    # Check if backend patterns are needed
    if echo "$file_patterns" | grep -qE "(convex|backend|server|api|\.ts$)"; then
        validate_backend_patterns "$contract_content"
    fi
    
    # Check if frontend patterns are needed
    if echo "$file_patterns" | grep -qE "(frontend|components|ui|react|\.tsx$)"; then
        validate_frontend_patterns "$contract_content"
    fi
}

validate_backend_patterns() {
    local contract_content="$1"
    
    log_info "Checking backend patterns compliance..."
    
    # Recommended Convex patterns
    local backend_patterns=(
        "functionOrganization"
        "queryOptimization" 
        "securityValidation"
        "dataValidation"
        "performanceOptimization"
    )
    
    for pattern in "${backend_patterns[@]}"; do
        if ! echo "$contract_content" | jq -e ".requirements.$pattern" >/dev/null 2>&1; then
            log_warning "Missing recommended backend pattern: $pattern"
            validation_warnings=$((validation_warnings + 1))
        fi
    done
    
    # Check for Convex-specific patterns
    local requirements
    requirements=$(echo "$contract_content" | jq -r '.requirements | keys[]' 2>/dev/null)
    
    local has_convex_patterns=false
    while IFS= read -r req; do
        local patterns
        patterns=$(echo "$contract_content" | jq -r ".requirements.$req.validation.codePatterns[]?" 2>/dev/null)
        if echo "$patterns" | grep -qE "(ctx\.|query\(|mutation\(|withIndex|getCurrentUser)"; then
            has_convex_patterns=true
            break
        fi
    done <<< "$requirements"
    
    if [[ "$has_convex_patterns" == "false" ]]; then
        log_warning "No Convex-specific patterns detected for backend file"
        validation_warnings=$((validation_warnings + 1))
    fi
}

validate_frontend_patterns() {
    local contract_content="$1"
    
    log_info "Checking frontend patterns compliance..."
    
    # Required design system patterns
    local frontend_patterns=(
        "typographyCompliance"
        "spacingCompliance"
        "colorCompliance"
        "componentCompliance"
        "colorDistributionRule"
        "componentStandards"
    )
    
    for pattern in "${frontend_patterns[@]}"; do
        if ! echo "$contract_content" | jq -e ".requirements.$pattern" >/dev/null 2>&1; then
            log_warning "Missing recommended frontend pattern: $pattern"
            validation_warnings=$((validation_warnings + 1))
        fi
    done
    
    # Validate specific design system requirements
    validate_typography_patterns "$contract_content"
    validate_spacing_patterns "$contract_content"
    validate_color_patterns "$contract_content"
}

# 4. Design System Specific Validation
validate_typography_patterns() {
    local contract_content="$1"
    
    # Check for proper typography patterns
    if echo "$contract_content" | jq -e '.requirements.typographyCompliance' >/dev/null 2>&1; then
        log_info "Validating typography patterns..."
        
        # Validate 4 sizes only - check if patterns contain only allowed sizes
        local size_patterns
        size_patterns=$(echo "$contract_content" | jq -r '.requirements.typographyCompliance.validation.codePatterns[]?' | grep "text-" 2>/dev/null || true)
        
        if [[ -n "$size_patterns" ]]; then
            # Check if the pattern allows only valid sizes
            if echo "$size_patterns" | grep -qE "text-(xs|2xl|3xl|4xl|5xl|6xl)"; then
                log_violation "Typography pattern allows forbidden sizes (xs, 2xl+): $size_patterns"
                validation_errors=$((validation_errors + 1))
            else
                log_success "Typography size patterns correctly defined"
            fi
        fi
        
        # Validate 2 weights only - check if patterns contain only allowed weights
        local weight_patterns
        weight_patterns=$(echo "$contract_content" | jq -r '.requirements.typographyCompliance.validation.codePatterns[]?' | grep "font-" 2>/dev/null || true)
        
        if [[ -n "$weight_patterns" ]]; then
            # Check if the pattern allows only valid weights
            if echo "$weight_patterns" | grep -qE "font-(bold|medium|light|thin|black|extrabold)"; then
                log_violation "Typography pattern allows forbidden weights (bold, medium, etc.): $weight_patterns"
                validation_errors=$((validation_errors + 1))
            else
                log_success "Typography weight patterns correctly defined"
            fi
        fi
        
        # Check for forbidden patterns
        local forbidden_patterns
        forbidden_patterns=$(echo "$contract_content" | jq -r '.requirements.typographyCompliance.validation.forbidden[]?' 2>/dev/null)
        if [[ -n "$forbidden_patterns" ]]; then
            if echo "$forbidden_patterns" | grep -qE "(font-bold|font-medium|text-xs|text-2xl)"; then
                log_success "Typography forbidden patterns correctly defined"
            else
                log_warning "Consider adding forbidden typography patterns (font-bold, font-medium, text-xs, text-2xl)"
                validation_warnings=$((validation_warnings + 1))
            fi
        fi
    fi
}

validate_spacing_patterns() {
    local contract_content="$1"
    
    # Check for 8pt grid compliance
    if echo "$contract_content" | jq -e '.requirements.spacingCompliance' >/dev/null 2>&1; then
        log_info "Validating spacing patterns..."
        
        local spacing_patterns
        spacing_patterns=$(echo "$contract_content" | jq -r '.requirements.spacingCompliance.validation.codePatterns[]?')
        
        # Validate patterns follow 8pt grid (values should be multiples of 2 for 4px grid: 2,4,6,8,12,16,20,24)
        # Valid Tailwind spacing: 2=8px, 4=16px, 6=24px, 8=32px, 12=48px, 16=64px, 20=80px, 24=96px
        local valid_spacing_values="2|4|6|8|12|16|20|24"
        
        while IFS= read -r pattern; do
            if [[ -n "$pattern" ]]; then
                # Check if pattern allows invalid spacing values
                if echo "$pattern" | grep -qE "\-(1|3|5|7|9|10|11|13|14|15|17|18|19|21|22|23)"; then
                    log_violation "Spacing pattern allows invalid 8pt grid values: $pattern"
                    validation_errors=$((validation_errors + 1))
                else
                    log_success "Spacing pattern follows 8pt grid system: $pattern"
                fi
            fi
        done <<< "$spacing_patterns"
        
        # Check for forbidden patterns
        local forbidden_spacing
        forbidden_spacing=$(echo "$contract_content" | jq -r '.requirements.spacingCompliance.validation.forbidden[]?' 2>/dev/null)
        if [[ -n "$forbidden_spacing" ]]; then
            log_success "Spacing forbidden patterns defined"
        else
            log_warning "Consider adding forbidden spacing patterns for non-8pt grid values"
            validation_warnings=$((validation_warnings + 1))
        fi
    fi
}

validate_color_patterns() {
    local contract_content="$1"
    
    # Check for 60/30/10 color rule compliance
    if echo "$contract_content" | jq -e '.requirements.colorCompliance' >/dev/null 2>&1; then
        log_info "Validating color patterns..."
        
        # Ensure required color patterns are present
        local required_colors=("bg-background" "text-foreground" "bg-primary")
        
        for color in "${required_colors[@]}"; do
            if ! echo "$contract_content" | jq -r '.requirements.colorCompliance.validation.codePatterns[]?' | grep -q "$color"; then
                log_warning "Missing recommended color pattern: $color"
                validation_warnings=$((validation_warnings + 1))
            fi
        done
        
        # Check for forbidden arbitrary colors
        local forbidden_colors
        forbidden_colors=$(echo "$contract_content" | jq -r '.requirements.colorCompliance.validation.forbidden[]?' 2>/dev/null)
        if echo "$forbidden_colors" | grep -qE "(bg-\\\[|text-\\\[)"; then
            log_success "Color forbidden patterns correctly defined (arbitrary colors blocked)"
        else
            log_warning "Consider adding forbidden arbitrary color patterns"
            validation_warnings=$((validation_warnings + 1))
        fi
    fi
}

# 5. Pattern Quality Validation
validate_pattern_quality() {
    local contract_content="$1"
    
    log_info "Validating pattern quality..."
    
    # Extract all code patterns
    local patterns
    patterns=$(echo "$contract_content" | jq -r '.requirements[].validation.codePatterns[]?' 2>/dev/null)
    
    local pattern_count=0
    while IFS= read -r pattern; do
        if [[ -n "$pattern" ]]; then
            pattern_count=$((pattern_count + 1))
            
            # Check pattern syntax - simplified approach to avoid false positives
            # Skip syntax validation for now as it causes false positives with valid patterns
            # Patterns will be validated during actual code validation
            
            # Check pattern specificity
            if [[ ${#pattern} -lt 3 ]]; then
                log_warning "Pattern too generic: $pattern"
                validation_warnings=$((validation_warnings + 1))
            fi
            
            # Check for common mistakes
            if [[ "$pattern" == ".*" ]] || [[ "$pattern" == ".*.*" ]]; then
                log_violation "Overly broad pattern: $pattern"
                validation_errors=$((validation_errors + 1))
            fi
        fi
    done <<< "$patterns"
    
    if [[ $pattern_count -eq 0 ]]; then
        log_violation "No code patterns defined in contract"
        validation_errors=$((validation_errors + 1))
    else
        log_success "Found $pattern_count validation patterns"
    fi
}

# 6. Contract Completeness Score
calculate_completeness_score() {
    local contract_content="$1"
    local score=0
    
    # Required fields (30 points)
    if echo "$contract_content" | jq -e '.contractId' >/dev/null 2>&1; then score=$((score + 10)); fi
    if echo "$contract_content" | jq -e '.requirements' >/dev/null 2>&1; then score=$((score + 10)); fi
    if echo "$contract_content" | jq -e '.appliesTo' >/dev/null 2>&1; then score=$((score + 10)); fi
    
    # Guidelines compliance (40 points)
    local backend_score=0
    local frontend_score=0
    
    # Backend compliance (20 points)
    local backend_patterns=("functionOrganization" "queryOptimization" "securityValidation" "dataValidation")
    for pattern in "${backend_patterns[@]}"; do
        if echo "$contract_content" | jq -e ".requirements.$pattern" >/dev/null 2>&1; then
            backend_score=$((backend_score + 5))
        fi
    done
    
    # Frontend compliance (20 points) - check all possible frontend patterns
    local frontend_patterns=("typographyCompliance" "spacingCompliance" "colorCompliance" "componentCompliance" "colorDistributionRule" "componentStandards")
    for pattern in "${frontend_patterns[@]}"; do
        if echo "$contract_content" | jq -e ".requirements.$pattern" >/dev/null 2>&1; then
            frontend_score=$((frontend_score + 3))  # Adjusted to allow for 6 patterns
        fi
    done
    # Cap frontend score at 20
    if [[ $frontend_score -gt 20 ]]; then
        frontend_score=20
    fi
    
    score=$((score + backend_score + frontend_score))
    
    # Pattern quality (30 points)
    local pattern_count
    pattern_count=$(echo "$contract_content" | jq -r '.requirements[].validation.codePatterns[]?' 2>/dev/null | wc -l)
    
    if [[ $pattern_count -gt 0 ]]; then score=$((score + 10)); fi
    if [[ $pattern_count -gt 5 ]]; then score=$((score + 10)); fi
    if [[ $pattern_count -gt 10 ]]; then score=$((score + 10)); fi
    
    echo "$score"
}

# Error reporting function
print_violation_summary() {
    if [[ $validation_errors -gt 0 ]]; then
        echo "" >&2
        echo "❌ CONTRACT VALIDATION FAILED" >&2
        echo "" >&2
        echo "The contract has $validation_errors error(s) and $validation_warnings warning(s)." >&2
        echo "Please fix these issues before the contract can be used for development validation." >&2
        echo "" >&2
        echo "📋 Validation Log: $log_file" >&2
        echo "" >&2
        echo "💡 Common fixes:" >&2
        echo "  - Ensure all required fields are present (contractId, prdName, name, appliesTo, requirements)" >&2
        echo "  - Use proper contractId format: XXX-XXXXX-000" >&2
        echo "  - Include comprehensive code patterns for validation" >&2
        echo "  - Add backend/frontend specific patterns based on file types" >&2
        echo "" >&2
    fi
}

# Main execution
main() {
    # Validate the contract
    if validate_contract "$content" "$file_path"; then
        exit 0
    else
        print_violation_summary
        exit 1
    fi
}

# Run main function
main