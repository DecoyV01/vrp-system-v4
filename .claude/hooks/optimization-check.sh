#!/bin/bash

# Optimization Gatekeeper Hook for VRP System v4
# Enforces LEVER framework and optimization principles
# Last updated: July 2025

# Path to optimization principles file
PRINCIPLES_FILE="/mnt/c/projects/vrp-system/v4/docs/04-development/master-optimization-principles.md"
PROJECT_ROOT="/mnt/c/projects/vrp-system/v4"

# Read JSON input from stdin
input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name')
file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""')

# Skip checks for documentation files
if [[ "$file_path" =~ \.(md|txt|rst)$ ]] || [[ "$file_path" =~ docs/ ]]; then
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

# If we get here, allow the operation but provide optimization reminders
if [[ "$tool_name" =~ Edit|Write|MultiEdit ]]; then
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