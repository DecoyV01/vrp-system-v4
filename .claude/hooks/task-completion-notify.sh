#!/bin/bash
# Task completion notification hook for WSL/Ubuntu in Windows
# Plays a satisfying sound and voice announcement when Claude Code finishes tasks

# Parse JSON input to check for stop_hook_active
input=$(cat)
stop_hook_active=$(echo "$input" | jq -r '.stop_hook_active // false' 2>/dev/null)

# Skip if this is already a stop hook continuation (prevents infinite loops)
if [ "$stop_hook_active" = "true" ]; then
    exit 0
fi

# Windows notification through PowerShell from WSL
# Double beep sound using Console.Beep for pure tone (not Windows system sound)
/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -Command "
[Console]::Beep(800, 200); 
Start-Sleep -Milliseconds 500; 
[Console]::Beep(1000, 200)
" 2>/dev/null || \
echo -e "\a\a"

# Voice announcement using Windows Speech API with Eva voice
# For MORE VOICES: Install additional voices via Windows Settings > Time & Language > Speech
# Or install third-party TTS engines like: Ivona, NaturalReader, or Windows 11 Neural voices
/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -Command "
Add-Type -AssemblyName System.Speech; 
\$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; 
\$synth.Rate = 1; 
\$synth.Volume = 100; 
try { \$synth.SelectVoice('Microsoft Eva Desktop') } catch { 
  try { \$synth.SelectVoice('Microsoft Zira Desktop') } catch { }
}; 
\$synth.Speak('Hey Gjisbert, your task is complete!')
" 2>/dev/null || \
echo "🎉 Task complete!"

# Always exit successfully to avoid blocking Claude Code
exit 0