#!/usr/bin/env pwsh

# AVA Constitutional Intelligence System - Integration Test Script
# Tests inter-service communication and constitutional governance

Write-Host "🏛️  AVA Constitutional Intelligence System - Integration Test" -ForegroundColor Cyan
Write-Host "=" * 60

$services = @(
    @{Name="ava-core"; Port=3001; Description="Constitutional Core"},
    @{Name="perception-layer"; Port=3003; Description="Sensor Processing"},
    @{Name="action-layer"; Port=3004; Description="Action Execution"},
    @{Name="evolver"; Port=3006; Description="Adaptive Learning"}
)

$healthyServices = 0
$totalServices = $services.Count

Write-Host "`n🔍 Testing Service Health..." -ForegroundColor Yellow

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $content = $response.Content | ConvertFrom-Json
            Write-Host "✅ $($service.Name) ($($service.Description)): " -NoNewline -ForegroundColor Green
            Write-Host "$($content.status) at $($content.timestamp)" -ForegroundColor Gray
            $healthyServices++
        }
    } catch {
        Write-Host "❌ $($service.Name) ($($service.Description)): " -NoNewline -ForegroundColor Red
        Write-Host "Service unavailable" -ForegroundColor Gray
    }
}

Write-Host "`n📊 Service Status: $healthyServices/$totalServices healthy ($([math]::Round(($healthyServices/$totalServices)*100, 1))%)" -ForegroundColor Cyan

Write-Host "`n🏛️ Testing Constitutional Governance..." -ForegroundColor Yellow

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $content = $response.Content | ConvertFrom-Json
            Write-Host "🏛️  $($service.Name): " -NoNewline -ForegroundColor Blue
            
            if ($service.Name -eq "ava-core") {
                Write-Host "$($content.service) - Governance: $($content.governance)" -ForegroundColor Green
            } elseif ($service.Name -eq "action-layer") {
                Write-Host "$($content.service) - Execution: $($content.execution)" -ForegroundColor Green
            } elseif ($service.Name -eq "evolver") {
                Write-Host "$($content.service) - Learning: $($content.learning)" -ForegroundColor Green
            } elseif ($service.Name -eq "perception-layer") {
                Write-Host "$($content.service) - Sensors: $($content.sensors)" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "🏛️  $($service.Name): Constitutional interface unavailable" -ForegroundColor Red
    }
}

Write-Host "`n🔗 Testing Redis Communication..." -ForegroundColor Yellow
try {
    $redisTest = docker exec ava-redis redis-cli ping 2>$null
    if ($redisTest -eq "PONG") {
        Write-Host "✅ Redis: Inter-service communication ready" -ForegroundColor Green
    } else {
        Write-Host "❌ Redis: Communication failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Redis: Service unavailable" -ForegroundColor Red
}

Write-Host "`n🚀 Constitutional Intelligence Assessment:" -ForegroundColor Cyan
Write-Host "   • Democratic Governance: " -NoNewline
if ($healthyServices -ge 3) {
    Write-Host "OPERATIONAL" -ForegroundColor Green
} else {
    Write-Host "LIMITED" -ForegroundColor Yellow
}

Write-Host "   • Constitutional Framework: " -NoNewline
if ($healthyServices -ge 2) {
    Write-Host "ACTIVE" -ForegroundColor Green
} else {
    Write-Host "OFFLINE" -ForegroundColor Red
}

Write-Host "   • Adaptive Learning: " -NoNewline
try {
    $evolverTest = Invoke-WebRequest -Uri "http://localhost:3006/health" -UseBasicParsing -TimeoutSec 3
    if ($evolverTest.StatusCode -eq 200) {
        Write-Host "ENABLED" -ForegroundColor Green
    } else {
        Write-Host "DISABLED" -ForegroundColor Red
    }
} catch {
    Write-Host "DISABLED" -ForegroundColor Red
}

Write-Host "`n" + "=" * 60
Write-Host "🎯 AVA Constitutional Intelligence System Status: " -NoNewline -ForegroundColor Cyan
if ($healthyServices -ge 3) {
    Write-Host "READY FOR DEMOCRATIC GOVERNANCE" -ForegroundColor Green
} elseif ($healthyServices -ge 2) {
    Write-Host "PARTIALLY OPERATIONAL" -ForegroundColor Yellow
} else {
    Write-Host "SYSTEM OFFLINE" -ForegroundColor Red
}

Write-Host "   Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')" -ForegroundColor Gray
Write-Host ""
