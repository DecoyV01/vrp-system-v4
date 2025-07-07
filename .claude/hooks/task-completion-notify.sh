#!/bin/bash
# Task completion notification hook for Ubuntu
# Plays a satisfying sound and voice announcement when Claude Code finishes tasks

# Parse JSON input to check for stop_hook_active
input=$(cat)
stop_hook_active=$(echo "$input" | jq -r '.stop_hook_active // false' 2>/dev/null)

# Skip if this is already a stop hook continuation (prevents infinite loops)
if [ "$stop_hook_active" = "true" ]; then
    exit 0
fi

# Play satisfying completion sound
# Try system sound first, fallback to terminal bell
paplay /usr/share/sounds/alsa/Front_Left.wav 2>/dev/null || \
paplay /usr/share/sounds/sound-icons/glass-water-1.wav 2>/dev/null || \
echo -e "\a"

# Voice announcement - customize the name as needed
espeak "Hey Gjisbert, your task is complete!" 2>/dev/null || \
echo "🎉 Task complete!"

# Always exit successfully to avoid blocking Claude Code
exit 0