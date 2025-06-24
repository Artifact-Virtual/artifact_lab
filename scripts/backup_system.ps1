# Comprehensive Backup System for Artifact Lab
# This script implements the full backup strategy with integrity checks

param(
    [Parameter(Mandatory=$false)]
    [string]$BackupType = "incremental",
    [Parameter(Mandatory=$false)]
    [string]$BackupLocation = "L:\devops\backups\artifact_lab",
    [Parameter(Mandatory=$false)]
    [switch]$VerifyIntegrity,
    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

# Configuration
$WorkspaceRoot = "L:\devops\artifact_lab"
$LogFile = "$WorkspaceRoot\logs\backup_log.json"
$ChecksumFile = "$WorkspaceRoot\logs\file_checksums.json"
$LargeFileThreshold = 10MB

# Create directories if they don't exist
New-Item -ItemType Directory -Force -Path $BackupLocation | Out-Null
New-Item -ItemType Directory -Force -Path "$WorkspaceRoot\logs" | Out-Null

# Logging function
function Write-BackupLog {
    param($Level, $Message, $Data = $null)
    
    $LogEntry = @{
        timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffffffK"
        level = $Level
        message = $Message
        data = $Data
        user = $env:USERNAME
        machine = $env:COMPUTERNAME
    }
      # Append to log file
    if (Test-Path $LogFile) {
        $Logs = Get-Content $LogFile | ConvertFrom-Json
        if ($Logs -is [System.Object[]]) {
            $Logs = @($Logs)
        } else {
            $Logs = @($Logs)
        }
    } else {
        $Logs = @()
    }
    
    $Logs = $Logs + $LogEntry
    
    # Keep only last 1000 entries
    if ($Logs.Count -gt 1000) {
        $Logs = $Logs[-1000..-1]
    }
    
    $Logs | ConvertTo-Json -Depth 10 | Out-File $LogFile -Encoding UTF8
    
    # Also output to console
    Write-Host "[$Level] $(Get-Date -Format 'HH:mm:ss') $Message" -ForegroundColor $(
        switch ($Level) {
            "ERROR" { "Red" }
            "WARN" { "Yellow" }
            "INFO" { "Green" }
            default { "White" }
        }
    )
}

# Calculate file checksum
function Get-FileChecksum {
    param($FilePath)
    
    try {
        $Hash = Get-FileHash -Path $FilePath -Algorithm SHA256
        return $Hash.Hash
    } catch {
        Write-BackupLog "ERROR" "Failed to calculate checksum for $FilePath" $_.Exception.Message
        return $null
    }
}

# Generate checksums for all files
function Update-FileChecksums {
    Write-BackupLog "INFO" "Generating file checksums..."
    
    $Checksums = @{}
    $LargeFiles = @()
    
    Get-ChildItem -Path $WorkspaceRoot -Recurse -File | ForEach-Object {
        $RelativePath = $_.FullName.Replace($WorkspaceRoot, "").TrimStart("\")
        $Checksum = Get-FileChecksum $_.FullName
        
        if ($Checksum) {
            $Checksums[$RelativePath] = @{
                checksum = $Checksum
                size = $_.Length
                lastModified = $_.LastWriteTime.ToString("yyyy-MM-ddTHH:mm:ss.fffffffK")
            }
            
            if ($_.Length -gt $LargeFileThreshold) {
                $LargeFiles += @{
                    path = $RelativePath
                    size = $_.Length
                    checksum = $Checksum
                }
            }
        }
    }
      # Calculate total size properly
    $TotalSize = 0
    foreach ($ChecksumInfo in $Checksums.Values) {
        $TotalSize += $ChecksumInfo.size
    }

    $ChecksumData = @{
        generated = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffffffK"
        checksums = $Checksums
        largeFiles = $LargeFiles
        stats = @{
            totalFiles = $Checksums.Count
            largeFileCount = $LargeFiles.Count
            totalSize = $TotalSize
        }
    }
    
    $ChecksumData | ConvertTo-Json -Depth 10 | Out-File $ChecksumFile -Encoding UTF8
    
    Write-BackupLog "INFO" "Generated checksums for $($Checksums.Count) files" $ChecksumData.stats
    return $ChecksumData
}

# Verify file integrity
function Test-FileIntegrity {
    Write-BackupLog "INFO" "Starting integrity verification..."
    
    if (-not (Test-Path $ChecksumFile)) {
        Write-BackupLog "WARN" "No checksum file found, generating new checksums"
        Update-FileChecksums
        return $true
    }
    
    $StoredChecksums = Get-Content $ChecksumFile | ConvertFrom-Json
    $Issues = @()
    $VerifiedCount = 0
    
    foreach ($RelativePath in $StoredChecksums.checksums.PSObject.Properties.Name) {
        $FullPath = Join-Path $WorkspaceRoot $RelativePath
        $StoredData = $StoredChecksums.checksums.$RelativePath
        
        if (Test-Path $FullPath) {
            $CurrentChecksum = Get-FileChecksum $FullPath
            $CurrentSize = (Get-Item $FullPath).Length
            
            if ($CurrentChecksum -ne $StoredData.checksum) {
                $Issues += @{
                    file = $RelativePath
                    issue = "checksum_mismatch"
                    expected = $StoredData.checksum
                    actual = $CurrentChecksum
                }
            } elseif ($CurrentSize -ne $StoredData.size) {
                $Issues += @{
                    file = $RelativePath
                    issue = "size_mismatch"
                    expected = $StoredData.size
                    actual = $CurrentSize
                }
            } else {
                $VerifiedCount++
            }
        } else {
            $Issues += @{
                file = $RelativePath
                issue = "file_missing"
            }
        }
    }
    
    if ($Issues.Count -eq 0) {
        Write-BackupLog "INFO" "Integrity verification passed - $VerifiedCount files verified"
        return $true
    } else {
        Write-BackupLog "ERROR" "Integrity verification failed - $($Issues.Count) issues found" $Issues
        return $false
    }
}

# Create backup
function New-Backup {
    param($Type)
    
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $BackupName = "artifact_lab_${Type}_${Timestamp}"
    $BackupPath = Join-Path $BackupLocation $BackupName
    
    Write-BackupLog "INFO" "Starting $Type backup to $BackupPath"
    
    if ($DryRun) {
        Write-BackupLog "INFO" "DRY RUN: Would create backup at $BackupPath"
        return $true
    }
    
    try {
        # Create backup directory
        New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null
        
        # Copy files with progress
        $SourceFiles = Get-ChildItem -Path $WorkspaceRoot -Recurse -File
        $TotalFiles = $SourceFiles.Count
        $CurrentFile = 0
        
        foreach ($File in $SourceFiles) {
            $RelativePath = $File.FullName.Replace($WorkspaceRoot, "").TrimStart("\")
            $DestPath = Join-Path $BackupPath $RelativePath
            $DestDir = Split-Path $DestPath -Parent
            
            # Create destination directory if needed
            if (-not (Test-Path $DestDir)) {
                New-Item -ItemType Directory -Force -Path $DestDir | Out-Null
            }
            
            # Copy file
            Copy-Item $File.FullName $DestPath -Force
            
            $CurrentFile++
            if ($CurrentFile % 100 -eq 0) {
                $Progress = [math]::Round(($CurrentFile / $TotalFiles) * 100, 2)
                Write-Progress -Activity "Creating Backup" -Status "$Progress% Complete" -PercentComplete $Progress
            }
        }
        
        Write-Progress -Activity "Creating Backup" -Completed
        
        # Copy checksum file
        if (Test-Path $ChecksumFile) {
            Copy-Item $ChecksumFile (Join-Path $BackupPath "file_checksums.json") -Force
        }
        
        # Create backup manifest
        $Manifest = @{
            created = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffffffK"
            type = $Type
            source = $WorkspaceRoot
            fileCount = $TotalFiles
            user = $env:USERNAME
            machine = $env:COMPUTERNAME
        }
        
        $Manifest | ConvertTo-Json -Depth 10 | Out-File (Join-Path $BackupPath "backup_manifest.json") -Encoding UTF8
        
        Write-BackupLog "INFO" "Backup completed successfully" @{
            path = $BackupPath
            fileCount = $TotalFiles
            type = $Type
        }
        
        return $true
    } catch {
        Write-BackupLog "ERROR" "Backup failed" $_.Exception.Message
        return $false
    }
}

# Main execution
Write-BackupLog "INFO" "Starting backup system" @{
    type = $BackupType
    location = $BackupLocation
    verifyIntegrity = $VerifyIntegrity.IsPresent
    dryRun = $DryRun.IsPresent
}

# Step 1: Update checksums
$ChecksumData = Update-FileChecksums

# Step 2: Verify integrity if requested
if ($VerifyIntegrity) {
    $IntegrityOk = Test-FileIntegrity
    if (-not $IntegrityOk) {
        Write-BackupLog "ERROR" "Integrity check failed - aborting backup"
        exit 1
    }
}

# Step 3: Create backup
$BackupSuccess = New-Backup $BackupType

if ($BackupSuccess) {
    Write-BackupLog "INFO" "Backup system completed successfully"
    exit 0
} else {
    Write-BackupLog "ERROR" "Backup system failed"
    exit 1
}
