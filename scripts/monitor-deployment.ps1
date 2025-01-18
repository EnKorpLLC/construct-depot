# Monitor GitHub Actions Deployment
# Requires PowerShell 7.0 or later
using namespace System.Management.Automation

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Configuration
$script:owner = "EnKorpLLC"
$script:repo = "construct-depot"
$script:pollInterval = 30  # seconds between status checks

function Write-StatusMessage {
    param(
        [Parameter(Mandatory)]
        [string]$Message,
        [ValidateSet('Info', 'Success', 'Warning', 'Error')]
        [string]$Type = 'Info'
    )
    
    $colors = @{
        Info    = 'Cyan'
        Success = 'Green'
        Warning = 'Yellow'
        Error   = 'Red'
    }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp][$Type] $Message" -ForegroundColor $colors[$Type]
}

function Get-LatestCommit {
    try {
        $null = Invoke-Expression -Command 'git fetch origin 2>&1'
        $commitHash = Invoke-Expression -Command 'git rev-parse HEAD'
        return $commitHash
    }
    catch {
        Write-StatusMessage "Failed to get latest commit: $_" -Type Error
        throw
    }
}

function Get-GitHubAuthHeader {
    try {
        # First try to get from environment
        $token = $env:GITHUB_TOKEN
        
        # If not in environment, try to get from git config
        if (-not $token) {
            $token = git config --get github.token
        }
        
        if (-not $token) {
            Write-StatusMessage "No GitHub token found. Some features will be limited." -Type Warning
            return @{}
        }
        
        return @{
            Authorization = "Bearer $token"
            Accept = "application/vnd.github.v3+json"
        }
    }
    catch {
        Write-StatusMessage "Failed to get GitHub auth header: $_" -Type Warning
        return @{}
    }
}

function Get-WorkflowRuns {
    param(
        [Parameter(Mandatory)]
        [string]$CommitHash
    )
    
    $headers = Get-GitHubAuthHeader
    $apiUrl = "https://api.github.com/repos/$script:owner/$script:repo/actions/runs?head_sha=$CommitHash"
    
    try {
        $response = Invoke-RestMethod -Uri $apiUrl -Headers $headers -Method Get
        return $response.workflow_runs
    }
    catch {
        Write-StatusMessage "Failed to get workflow runs: $_" -Type Error
        throw
    }
}

function Get-WorkflowRunStatus {
    param(
        [Parameter(Mandatory)]
        [string]$RunId
    )
    
    $headers = Get-GitHubAuthHeader
    $apiUrl = "https://api.github.com/repos/$script:owner/$script:repo/actions/runs/$RunId"
    
    try {
        $response = Invoke-RestMethod -Uri $apiUrl -Headers $headers -Method Get
        return $response
    }
    catch {
        Write-StatusMessage "Failed to get workflow status: $_" -Type Error
        throw
    }
}

function Get-WorkflowRunJobs {
    param(
        [Parameter(Mandatory)]
        [string]$RunId
    )
    
    $headers = Get-GitHubAuthHeader
    $apiUrl = "https://api.github.com/repos/$script:owner/$script:repo/actions/runs/$RunId/jobs"
    
    try {
        $response = Invoke-RestMethod -Uri $apiUrl -Headers $headers -Method Get
        return $response.jobs
    }
    catch {
        Write-StatusMessage "Failed to get workflow jobs: $_" -Type Error
        throw
    }
}

function Test-GitHubActionsStatus {
    param(
        [Parameter(Mandatory)]
        [string]$CommitHash
    )
    
    Write-StatusMessage "Monitoring deployment for commit: $CommitHash" -Type Info
    
    $completed = $false
    $lastStatus = ""
    $lastStep = ""
    
    while (-not $completed) {
        $runs = Get-WorkflowRuns -CommitHash $CommitHash
        
        if ($runs.Count -eq 0) {
            Write-StatusMessage "No workflow runs found yet..." -Type Info
            Start-Sleep -Seconds $script:pollInterval
            continue
        }
        
        $latestRun = $runs[0]
        $status = $latestRun.status
        $conclusion = $latestRun.conclusion
        
        # Get detailed job information
        $jobs = Get-WorkflowRunJobs -RunId $latestRun.id.ToString()
        
        foreach ($job in $jobs) {
            $currentStep = $job.steps | Where-Object { $_.status -eq 'in_progress' } | Select-Object -First 1
            
            if ($currentStep) {
                $stepName = $currentStep.name
                if ($stepName -ne $lastStep) {
                    Write-StatusMessage "Current step: $stepName" -Type Info
                    $lastStep = $stepName
                }
            }
        }
        
        if ($status -ne $lastStatus) {
            Write-StatusMessage "Workflow status: $status" -Type Info
            $lastStatus = $status
        }
        
        if ($status -eq 'completed') {
            switch ($conclusion) {
                'success' {
                    Write-StatusMessage "Deployment completed successfully!" -Type Success
                }
                'failure' {
                    Write-StatusMessage "Deployment failed. Check the logs for details." -Type Error
                    Write-StatusMessage "URL: $($latestRun.html_url)" -Type Info
                }
                default {
                    Write-StatusMessage "Deployment completed with status: $conclusion" -Type Warning
                }
            }
            $completed = $true
        }
        else {
            Start-Sleep -Seconds $script:pollInterval
        }
    }
}

function Start-DeploymentMonitoring {
    try {
        Write-StatusMessage "Starting deployment monitoring..." -Type Info
        
        # Get the latest commit
        $commitHash = Get-LatestCommit
        
        # Monitor the deployment
        Test-GitHubActionsStatus -CommitHash $commitHash
    }
    catch {
        Write-StatusMessage "Monitoring failed: $_" -Type Error
        exit 1
    }
}

# Execute the monitoring
Start-DeploymentMonitoring 