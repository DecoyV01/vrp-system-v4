#!/bin/bash

# Simple contract activation script
# Usage: ./activate-contract.sh CONTRACT_ID

CONTRACT_DIR="/mnt/c/projects/vrp-system/v4/docs/11-tech-contracts"
TARGET_CONTRACT="$1"

if [[ -z "$TARGET_CONTRACT" ]]; then
    echo "Usage: ./activate-contract.sh CONTRACT_ID"
    echo "Example: ./activate-contract.sh LOC-SYS-001"
    exit 1
fi

# Move current open to staging
for open_file in "$CONTRACT_DIR"/open-*.json; do
    if [[ -f "$open_file" ]]; then
        basename=$(basename "$open_file")
        contract_id="${basename#*-}"
        mv "$open_file" "$CONTRACT_DIR/staging-$contract_id"
        echo "📦 Moved to staging: $contract_id"
    fi
done

# Find and activate target
for file in "$CONTRACT_DIR"/{staging,closed}-"$TARGET_CONTRACT".json; do
    if [[ -f "$file" ]]; then
        mv "$file" "$CONTRACT_DIR/open-$TARGET_CONTRACT.json"
        echo "🟢 Activated: $TARGET_CONTRACT"
        exit 0
    fi
done

echo "❌ Contract $TARGET_CONTRACT not found"