param(
    [Parameter(Mandatory=$true)]
    [string]$action,
    
    [string]$filename = "",
    [string]$testName = "uat-test"
)

$outputPath = "C:\projects\vrp-system\v4\uat\screenshots"

# Create output directory if it doesn't exist
if (!(Test-Path $outputPath)) {
    New-Item -ItemType Directory -Path $outputPath | Out-Null
}

function Take-Screenshot {
    param($name)
    
    Add-Type -AssemblyName System.Drawing
    Add-Type -AssemblyName System.Windows.Forms
    
    $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $bitmap = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen(0, 0, 0, 0, $screen.Size)
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss-fff"
    $filepath = "$outputPath\$testName-$name-$timestamp.png"
    $bitmap.Save($filepath)
    $graphics.Dispose()
    $bitmap.Dispose()
    
    Write-Output $filepath
}

function Start-Recording {
    # Use Windows Game Bar (Win+Alt+R)
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("^%{r}")
    
    # Also start taking periodic screenshots
    $script:recordingJob = Start-Job -ScriptBlock {
        while ($true) {
            Start-Sleep -Seconds 2
            # Take periodic screenshots during recording
        }
    }
    
    Write-Output "Recording started"
}

function Stop-Recording {
    # Stop Windows Game Bar recording
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("^%{r}")
    
    if ($script:recordingJob) {
        Stop-Job -Job $script:recordingJob
        Remove-Job -Job $script:recordingJob
    }
    
    Write-Output "Recording stopped"
}

# Execute requested action
switch ($action) {
    "screenshot" {
        $filepath = Take-Screenshot -name $filename
        Write-Output "Screenshot saved: $filepath"
    }
    "start-recording" {
        Start-Recording
    }
    "stop-recording" {
        Stop-Recording
    }
    "clean" {
        Remove-Item "$outputPath\*" -Force
        Write-Output "Screenshots cleaned"
    }
    default {
        Write-Error "Unknown action: $action"
    }
}