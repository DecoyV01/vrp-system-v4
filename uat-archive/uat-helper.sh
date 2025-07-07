#!/bin/bash

UAT_DIR="/mnt/c/projects/vrp-system/v4/uat"
SCREENSHOTS_DIR="$UAT_DIR/screenshots"

# Function to call PowerShell script
uat_screenshot() {
    local name=$1
    local test_name=${2:-"uat-test"}
    powershell.exe -File "$UAT_DIR/uat-recorder.ps1" -action screenshot -filename "$name" -testName "$test_name"
}

uat_start_recording() {
    powershell.exe -File "$UAT_DIR/uat-recorder.ps1" -action start-recording
}

uat_stop_recording() {
    powershell.exe -File "$UAT_DIR/uat-recorder.ps1" -action stop-recording
}

# Create video from screenshots
uat_create_video() {
    local test_name=${1:-"uat-test"}
    cd "$SCREENSHOTS_DIR"
    ffmpeg -framerate 1 -pattern_type glob -i "$test_name-*.png" -c:v libx264 -pix_fmt yuv420p "$UAT_DIR/videos/$test_name-$(date +%Y%m%d-%H%M%S).mp4"
}

# Clean up screenshots
uat_clean() {
    powershell.exe -File "$UAT_DIR/uat-recorder.ps1" -action clean
}

# Execute if called directly
if [ "${1}" ]; then
    case "$1" in
        screenshot) uat_screenshot "$2" "$3" ;;
        start) uat_start_recording ;;
        stop) uat_stop_recording ;;
        video) uat_create_video "$2" ;;
        clean) uat_clean ;;
        *) echo "Usage: $0 {screenshot|start|stop|video|clean} [args]" ;;
    esac
fi