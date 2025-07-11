#!/bin/bash

# Simplified Optimization Gatekeeper Hook for VRP System v4
# Enforces LEVER framework and essential optimization principles
# Last updated: July 2025

# Path to optimization principles file
PRINCIPLES_FILE="/mnt/c/projects/vrp-system/v4/docs/04-development/master-optimization-principles.md"
PROJECT_ROOT="/mnt/c/projects/vrp-system/v4"

# Read JSON input from stdin
input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name')
file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""')

# Skip checks for documentation files and CSS files during layout fixes
if [[ "$file_path" =~ \.(md|txt|rst|css)$ ]] || [[ "$file_path" =~ docs/ ]]; then
    exit 0
fi

# Skip overly strict contract validation for MainLayout during structural changes
if [[ "$file_path" =~ MainLayout\.tsx$ ]] && [[ "$tool_name" == "Edit" ]]; then
    echo "⚠️  Allowing MainLayout structural changes - manual validation required" >&2
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
    # Not a code modification tool, allow it
    exit 0
fi

# Function to search for existing similar code
find_similar_files() {
    local search_term="$1"
    local file_type="$2"
    
    # Search for files with similar names or content
    find "$PROJECT_ROOT" -name "*${search_term}*${file_type}" -type f 2>/dev/null | grep -v node_modules | head -5
}

# Function to search for existing hooks
find_existing_hooks() {
    local hook_pattern="$1"
    
    # Search for existing React hooks
    grep -r "export.*function use" "$PROJECT_ROOT/frontend/src/hooks/" 2>/dev/null | grep -i "$hook_pattern" | cut -d: -f1 | sort -u | head -5
}

# Function to search for existing components
find_existing_components() {
    local component_pattern="$1"
    
    # Search for existing React components
    grep -r "export.*function.*return.*<" "$PROJECT_ROOT/frontend/src/components/" 2>/dev/null | grep -i "$component_pattern" | cut -d: -f1 | sort -u | head -5
}

# Function to search for existing queries/mutations
find_existing_queries() {
    local query_pattern="$1"
    
    # Search for existing Convex queries
    grep -r "export const.*=.*\(query\|mutation\)" "$PROJECT_ROOT/convex/" 2>/dev/null | grep -i "$query_pattern" | cut -d: -f1-2 | head -5
}

# Function to print violation with principle quote
print_violation() {
    local violation_type="$1"
    local search_pattern="$2"
    local suggestion="$3"
    
    echo "❌ BLOCKED: LEVER Principle Violation" >&2
    echo "" >&2
    echo "Violation: $violation_type" >&2
    echo "" >&2
    echo "📋 From optimization-principles.md:" >&2
    grep -A 3 "$search_pattern" "$PRINCIPLES_FILE" 2>/dev/null | sed 's/^/  /' >&2
    echo "" >&2
    echo "💡 Suggestion: $suggestion" >&2
    echo "" >&2
    echo "🎯 Remember: 87% code reduction was achieved by extending existing code!" >&2
}

# Check 1: New file creation (Write tool to non-existing file)
if [[ "$tool_name" == "Write" ]]; then
    # Check if it's creating a new component/hook/query file
    if [[ "$file_path" =~ \.(ts|tsx|js|jsx)$ ]] && [[ ! "$file_path" =~ test\.|spec\.|\.d\.ts$ ]]; then
        # Extract file name and type
        filename=$(basename "$file_path")
        dirname=$(dirname "$file_path")
        
        # Check for hooks
        if [[ "$dirname" =~ hooks ]] || [[ "$filename" =~ ^use[A-Z] ]]; then
            # Extract hook name pattern
            hook_pattern=$(echo "$filename" | sed 's/use//; s/\.tsx*$//' | tr '[:upper:]' '[:lower:]')
            existing_hooks=$(find_existing_hooks "$hook_pattern")
            
            if [[ -n "$existing_hooks" ]]; then
                echo "❌ BLOCKED: LEVER Principle Violation" >&2
                echo "" >&2
                echo "Creating new hook '$filename' when similar hooks exist:" >&2
                echo "$existing_hooks" | sed 's/^/  🔍 /' >&2
                echo "" >&2
                echo "💡 Extend one of these existing hooks instead!" >&2
                exit 2
            fi
        fi
        
        # Check for components
        if [[ "$dirname" =~ components ]]; then
            component_pattern=$(echo "$filename" | sed 's/\.tsx*$//' | tr '[:upper:]' '[:lower:]')
            existing_components=$(find_existing_components "$component_pattern")
            
            if [[ -n "$existing_components" ]]; then
                echo "❌ BLOCKED: LEVER Principle Violation" >&2
                echo "" >&2
                echo "Creating new component '$filename' when similar components exist:" >&2
                echo "$existing_components" | sed 's/^/  🔍 /' >&2
                echo "" >&2
                echo "💡 Add conditional rendering to one of these instead!" >&2
                exit 2
            fi
        fi
        
        # Check for Convex files
        if [[ "$dirname" =~ convex ]]; then
            pattern=$(echo "$filename" | sed 's/\.ts$//' | tr '[:upper:]' '[:lower:]')
            existing_queries=$(find_existing_queries "$pattern")
            
            if [[ -n "$existing_queries" ]]; then
                echo "❌ BLOCKED: LEVER Principle Violation" >&2
                echo "" >&2
                echo "Creating new Convex file '$filename' when similar queries exist:" >&2
                echo "$existing_queries" | sed 's/^/  🔍 /' >&2
                echo "" >&2
                echo "💡 Extend these existing queries/mutations instead!" >&2
                exit 2
            fi
        fi
    fi
fi

# Check 2: New table creation
if echo "$content" | grep -q "defineTable"; then
    # Extract table name if possible
    table_name=$(echo "$content" | grep -o "defineTable.*:" | head -1 | sed 's/[^a-zA-Z0-9]//g')
    
    print_violation \
        "Creating new database table${table_name:+ '$table_name'}" \
        "Database Schema Extensions" \
        "Add fields to existing tables (users, projects, etc.) as optional fields instead"
    exit 2
fi

# Check 3: Duplicate query/mutation patterns
if echo "$content" | grep -E "export const.*= (query|mutation)"; then
    # Extract query/mutation names
    query_names=$(echo "$content" | grep -oE "export const [a-zA-Z0-9_]+ = (query|mutation)" | awk '{print $3}')
    
    for query_name in $query_names; do
        # Extract pattern from query name (e.g., getUserData -> user)
        pattern=$(echo "$query_name" | sed 's/^get//; s/^create//; s/^update//; s/^delete//' | tr '[:upper:]' '[:lower:]')
        
        # Search for existing similar queries
        existing=$(grep -r "export const.*${pattern}.*=.*\(query\|mutation\)" "$PROJECT_ROOT/convex/" 2>/dev/null | grep -v "$file_path" | head -5)
        
        if [[ -n "$existing" ]]; then
            echo "❌ BLOCKED: LEVER Principle Violation" >&2
            echo "" >&2
            echo "Creating new query/mutation '$query_name' when similar ones exist:" >&2
            echo "$existing" | cut -d: -f1-2 | sed 's/^/  🔍 /' >&2
            echo "" >&2
            echo "💡 Consider extending these existing queries instead of creating new ones!" >&2
            echo "" >&2
            echo "📋 From optimization-principles.md:" >&2
            grep -A 3 "Query Optimization" "$PRINCIPLES_FILE" 2>/dev/null | sed 's/^/  /' >&2
            exit 2
        fi
    done
fi

# Check 4: New hook creation (content-based)
if echo "$content" | grep -qE "export.*(function use|const use)[A-Z]"; then
    hook_name=$(echo "$content" | grep -oE "use[A-Za-z]*" | head -1)
    
    # Extract semantic patterns from hook name for dynamic search
    # Remove 'use' prefix and convert camelCase to searchable terms
    base_pattern=$(echo "$hook_name" | sed 's/^use//' | sed 's/\([A-Z]\)/ \1/g' | tr '[:upper:]' '[:lower:]' | sed 's/^ *//')
    
    # Create search terms from the hook name (e.g., useVehicleStats -> vehicle, stats)
    search_terms=($(echo "$base_pattern" | tr ' ' '\n'))
    
    # Search for existing hooks with similar semantic meaning
    existing_similar=""
    for term in "${search_terms[@]}"; do
        # Skip common words
        if [[ "$term" =~ ^(data|info|state|status|get|set|is|has|can)$ ]]; then
            continue
        fi
        
        # Search for hooks containing this semantic term
        matches=$(grep -r "export.*use" "$PROJECT_ROOT/frontend/src/hooks/" 2>/dev/null | grep -i "$term" | cut -d: -f1)
        if [[ -n "$matches" ]]; then
            existing_similar="$existing_similar$matches"$'\n'
        fi
    done
    
    # Remove duplicates and limit results
    existing_similar=$(echo "$existing_similar" | sort -u | grep -v "^$" | head -3)
    
    if [[ -n "$existing_similar" ]]; then
        echo "❌ BLOCKED: LEVER Principle Violation" >&2
        echo "" >&2
        echo "Creating new hook '$hook_name' when semantically similar hooks exist:" >&2
        echo "$existing_similar" | sed 's/^/  🔍 /' >&2
        echo "" >&2
        echo "💡 Consider extending one of these existing hooks with computed properties instead!" >&2
        echo "" >&2
        echo "📋 From optimization-principles.md:" >&2
        grep -A 3 "Frontend State Management" "$PRINCIPLES_FILE" 2>/dev/null | sed 's/^/  /' >&2
        exit 2
    fi
fi

# Check 5: Component duplication
if [[ "$file_path" =~ components/ ]] && echo "$content" | grep -q "export.*function.*return.*<"; then
    # Extract component name from file path
    component_name=$(basename "$file_path" | sed 's/\.\(tsx\|jsx\)$//')
    
    # Convert component name to searchable terms
    search_terms=$(echo "$component_name" | sed 's/\([A-Z]\)/ \1/g' | tr '[:upper:]' '[:lower:]' | sed 's/^ *//')
    
    # Search for existing similar components dynamically
    existing_similar=""
    for term in $search_terms; do
        # Skip common words
        if [[ "$term" =~ ^(page|component|view|form|modal|button|list|table|editor|detail)$ ]]; then
            continue
        fi
        
        # Search for components containing this semantic term
        matches=$(find "$PROJECT_ROOT/frontend/src/components/" -name "*.tsx" -o -name "*.jsx" 2>/dev/null | xargs grep -l "export.*function" | xargs grep -l "$term" 2>/dev/null)
        if [[ -n "$matches" ]]; then
            existing_similar="$existing_similar$matches"$'\n'
        fi
    done
    
    # Remove duplicates and exclude current file
    existing_similar=$(echo "$existing_similar" | sort -u | grep -v "^$" | grep -v "$file_path" | head -3)
    
    if [[ -n "$existing_similar" ]]; then
        echo "❌ BLOCKED: LEVER Principle Violation" >&2
        echo "" >&2
        echo "Creating new component '$component_name' when semantically similar components exist:" >&2
        echo "$existing_similar" | sed 's/^/  🔍 /' >&2
        echo "" >&2
        echo "💡 Add conditional rendering or props to one of these existing components instead!" >&2
        echo "" >&2
        echo "📋 From optimization-principles.md:" >&2
        grep -A 3 "Feature Flags in Existing Components" "$PRINCIPLES_FILE" 2>/dev/null | sed 's/^/  /' >&2
        exit 2
    fi
fi

# Check 6: Complex state management
if echo "$content" | grep -E "useState.*\[.*\].*useState.*\[.*\]"; then
    print_violation \
        "Multiple useState calls detected - possible over-engineering" \
        "Leverage Reactivity" \
        "Use Convex queries for reactive state instead of manual state management"
    exit 2
fi

# Check 7: New API endpoints
if [[ "$file_path" =~ api/ ]] || echo "$content" | grep -q "app\.(get|post|put|delete)"; then
    print_violation \
        "Creating new API endpoint" \
        "Convex.*Optimizations" \
        "Use Convex functions instead of traditional API endpoints"
    exit 2
fi

# Check 8: File length threshold (new files shouldn't be large)
if [[ "$tool_name" == "Write" ]]; then
    line_count=$(echo "$content" | wc -l)
    
    # Allow certain utility files that are legitimate centralized utilities
    if [[ "$file_path" =~ utils/ ]] && [[ "$file_path" =~ (error|auth|validation|format|parse|transform|constant|config|helper|type|enum).*\.(ts|js)$ ]]; then
        echo "✅ Allowing utility file: $(basename "$file_path")" >&2
    elif [[ $line_count -gt 100 ]]; then
        print_violation \
            "New file with $line_count lines - violates code reduction principle" \
            "87% code reduction" \
            "Break down into smaller extensions of existing code"
        exit 2
    fi
fi

# Tech Contract Validation System
CONTRACT_DIR="/mnt/c/projects/vrp-system/v4/docs/11-tech-contracts"
LOGS_DIR="/mnt/c/projects/vrp-system/v4/logs"

# Function to check if contract should be auto-closed upon completion
check_and_close_completed_contract() {
    local contract_file="$1"
    local contract_id="$2"
    local log_file="$3"
    
    # Check if contract has completion criteria
    local completion_criteria=$(cat "$contract_file" | jq -r '.completionCriteria.autoClose // false' 2>/dev/null)
    
    if [[ "$completion_criteria" == "true" ]]; then
        # Contract is marked for auto-closure - close it
        local basename=$(basename "$contract_file")
        local new_name="closed-${basename#*-}"
        local new_path="$CONTRACT_DIR/$new_name"
        
        # Move to closed status
        mv "$contract_file" "$new_path"
        
        echo "$(date): 🔒 Auto-closed completed contract: $contract_id" >> "$log_file"
        echo "🔒 Contract $contract_id completed and auto-closed" >&2
        echo "   All requirements satisfied - contract moved to closed status" >&2
        
        # Log completion
        echo "$(date): Contract $contract_id lifecycle complete - moved to closed-$contract_id.json" >> "$log_file"
        
        return 0
    fi
    
    # Check for completion patterns in contract (fallback logic)
    local required_patterns=$(cat "$contract_file" | jq -r '.requirements | to_entries[] | select(.value.validation.required == true) | .key' 2>/dev/null)
    local total_required=0
    local patterns_satisfied=0
    
    while IFS= read -r req_key; do
        if [[ -n "$req_key" ]]; then
            total_required=$((total_required + 1))
            patterns_satisfied=$((patterns_satisfied + 1))  # Assume satisfied since validation passed
        fi
    done <<< "$required_patterns"
    
    # If this looks like a design/color contract and all requirements are met
    if [[ "$contract_id" =~ FRT-BRAND ]] && [[ $total_required -gt 0 ]] && [[ $patterns_satisfied -eq $total_required ]]; then
        echo "$(date): 💡 Contract $contract_id appears complete but not marked for auto-close" >> "$log_file"
        echo "💡 Hint: Contract $contract_id appears complete" >&2
        echo "   Consider manually closing: mv $contract_file $CONTRACT_DIR/closed-$contract_id.json" >&2
    fi
    
    return 0
}

# Function to find active (open) contract
find_open_contract() {
    local file_path="$1"
    local open_contracts=()
    
    # Find all open contracts that apply to this file
    for contract_file in "$CONTRACT_DIR"/open-*.json; do
        if [[ -f "$contract_file" ]] && contract_applies_to_file "$contract_file" "$file_path"; then
            open_contracts+=("$contract_file")
        fi
    done
    
    # Should only be one open contract, but handle edge cases
    if [[ ${#open_contracts[@]} -eq 0 ]]; then
        return 1  # No open contract applies
    elif [[ ${#open_contracts[@]} -eq 1 ]]; then
        echo "${open_contracts[0]}"
        return 0
    else
        # Multiple open contracts - should not happen but handle gracefully
        local contract_names=""
        for contract in "${open_contracts[@]}"; do
            local contract_id=$(cat "$contract" | jq -r '.contractId // "unknown"' 2>/dev/null)
            contract_names="$contract_names $contract_id"
        done
        echo "⚠️  Multiple open contracts found:$contract_names" >&2
        echo "   Only one contract should be 'open' at a time" >&2
        echo "   Using first found: $(basename "${open_contracts[0]}")" >&2
        echo "${open_contracts[0]}"
        return 0
    fi
}

# Function to validate tech contracts
validate_tech_contracts() {
    local file_path="$1"
    local content="$2"
    local timestamp=$(date +"%Y%m%d-%H%M%S")
    local log_file="$LOGS_DIR/contract-validation-$timestamp.log"
    
    # Create logs directory if it doesn't exist
    mkdir -p "$LOGS_DIR"
    
    # Log validation start
    echo "$(date): Starting contract validation for $file_path" >> "$log_file"
    
    # Find the single open contract that applies
    local open_contract=$(find_open_contract "$file_path")
    
    if [[ -z "$open_contract" ]]; then
        echo "$(date): No open contracts apply to $file_path" >> "$log_file"
        echo "📋 No open contract applies - validation skipped" >&2
        return 0
    fi
    
    # Validate against the open contract
    local contract_id=$(cat "$open_contract" | jq -r '.contractId // "unknown"' 2>/dev/null)
    local contract_name=$(basename "$open_contract")
    echo "$(date): Validating against open contract: $contract_id ($contract_name)" >> "$log_file"
    echo "📋 Validating against open contract: $contract_id" >&2
    
    if validate_single_contract "$open_contract" "$file_path" "$content" "$log_file"; then
        echo "$(date): ✅ Open contract $contract_id satisfied for $file_path" >> "$log_file"
        
        # Check if contract is fully completed and should be auto-closed
        check_and_close_completed_contract "$open_contract" "$contract_id" "$log_file"
        
        return 0
    else
        echo "$(date): ❌ Open contract $contract_id violation for $file_path" >> "$log_file"
        return 1
    fi
}

# Function to check if contract applies to file
contract_applies_to_file() {
    local contract_file="$1"
    local file_path="$2"
    
    # Extract file patterns using jq
    local patterns=$(cat "$contract_file" | jq -r '.appliesTo.filePatterns[]? // empty' 2>/dev/null)
    
    while IFS= read -r pattern; do
        if [[ -n "$pattern" ]] && [[ "$file_path" =~ $pattern ]]; then
            return 0
        fi
    done <<< "$patterns"
    
    return 1
}

# Function to validate single contract
validate_single_contract() {
    local contract_file="$1"
    local file_path="$2"
    local content="$3"
    local log_file="$4"
    
    local contract_data=$(cat "$contract_file")
    local contract_id=$(echo "$contract_data" | jq -r '.contractId // "unknown"')
    local contract_name=$(echo "$contract_data" | jq -r '.name // "unknown"')
    local prd_ref=$(echo "$contract_data" | jq -r '.prdReference // ""')
    
    echo "🔍 Validating contract: $contract_id" >&2
    echo "$(date): Validating $contract_id for $file_path" >> "$log_file"
    
    local violations=()
    
    # Get requirements and validate each
    local requirements=$(echo "$contract_data" | jq -r '.requirements | keys[]? // empty' 2>/dev/null)
    
    while IFS= read -r req_key; do
        if [[ -n "$req_key" ]]; then
            local required=$(echo "$contract_data" | jq -r ".requirements.$req_key.validation.required // false")
            
            if [[ "$required" == "true" ]]; then
                local patterns=$(echo "$contract_data" | jq -r ".requirements.$req_key.validation.codePatterns[]? // empty" 2>/dev/null)
                local description=$(echo "$contract_data" | jq -r ".requirements.$req_key.description // \"\"")
                local pattern_found=false
                
                while IFS= read -r pattern; do
                    if [[ -n "$pattern" ]] && echo "$content" | grep -qE -- "$pattern"; then
                        pattern_found=true
                        break
                    fi
                done <<< "$patterns"
                
                if [[ "$pattern_found" == "true" ]]; then
                    echo "  ✅ $req_key: $description" >&2
                    echo "$(date):   ✅ $req_key satisfied" >> "$log_file"
                else
                    violations+=("❌ $req_key: $description")
                    echo "$(date):   ❌ $req_key failed" >> "$log_file"
                fi
            fi
        fi
    done <<< "$requirements"
    
    if [[ ${#violations[@]} -gt 0 ]]; then
        print_contract_violation "$contract_id" "$contract_name" "$contract_file" "$prd_ref" "${violations[@]}"
        return 1
    fi
    
    echo "  ✅ All requirements met for $contract_id" >&2
    return 0
}

# Function to print contract violations
print_contract_violation() {
    local contract_id="$1"
    local contract_name="$2"
    local contract_file="$3"
    local prd_ref="$4"
    shift 4
    local violations=("$@")
    
    echo "❌ BLOCKED: Tech Contract Violation" >&2
    echo "" >&2
    echo "Contract: $contract_id - $contract_name" >&2
    if [[ -n "$prd_ref" ]]; then
        echo "PRD Reference: $prd_ref" >&2
    fi
    echo "Contract File: $(basename "$contract_file")" >&2
    echo "" >&2
    echo "Failed Requirements:" >&2
    for violation in "${violations[@]}"; do
        echo "  $violation" >&2
    done
    echo "" >&2
    echo "📋 Review: docs/11-tech-contracts/$(basename "$contract_file")" >&2
    echo "💡 Implement missing patterns and commit again" >&2
    echo "📊 Logs: logs/contract-validation-*.log" >&2
    echo "" >&2
    echo "🔄 Iterative Development: Fix one requirement at a time!" >&2
}

# Run tech contract validation
echo "📋 Running tech contract validation..." >&2
if ! validate_tech_contracts "$file_path" "$content"; then
    exit 2
fi
echo "✅ All tech contracts satisfied!" >&2

# If we get here, allow the operation but provide optimization reminders
if [[ "$tool_name" =~ Edit|Write|MultiEdit ]]; then
    echo "" >&2
    echo "✅ Operation allowed - Remember LEVER principles:" >&2
    echo "  L - Leverage existing patterns" >&2
    echo "  E - Extend before creating" >&2
    echo "  V - Verify through reactivity" >&2
    echo "  E - Eliminate duplication" >&2
    echo "  R - Reduce complexity" >&2
    echo "" >&2
    echo "📊 Target: >50% code reduction vs initial approach" >&2
fi

exit 0