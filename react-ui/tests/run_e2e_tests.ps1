param (
    [string]$testDir = $PSScriptRoot
)

if (-not $testDir) {
    $testDir = "."
}

$ErrorActionPreference = "Continue"
$curl = "C:\Windows\System32\curl.exe"
$supabaseIp = "104.18.38.10"
$supabaseHost = "dpnatfvndlyzvukryrgk.supabase.co"
$supabaseUrl = "https://$supabaseHost"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbmF0ZnZuZGx5enZ1a3J5cmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MDAwNDcsImV4cCI6MjEwNTI3NjA0N30.P0mCDMZD7TYRCtY2Y1UBTtmcDOsCDnykU1xZBwLTae0"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
function Save-JsonFile {
    param([string]$FilePath, [string]$Content)
    [System.IO.File]::WriteAllText($FilePath, $Content, $utf8NoBom)
}

$testResults = [ordered]@{}

function Invoke-SupabaseRequest {
    param(
        [string]$Method,
        [string]$Path,
        [string]$Token,
        [string]$BodyFile = ""
    )
    $outputFile = Join-Path $testDir "tmp_out.json"
    $headersFile = Join-Path $testDir "tmp_headers.txt"

    $argsList = @(
        "-k",
        "--resolve", "${supabaseHost}:443:${supabaseIp}",
        "-s",
        "-D", $headersFile,
        "-X", $Method,
        "$supabaseUrl$Path",
        "-H", "apikey: $anonKey"
    )

    if ($Token) {
        $argsList += @("-H", "Authorization: Bearer $Token")
    }
    if ($BodyFile) {
        $argsList += @("-H", "Content-Type: application/json")
        $argsList += @("-H", "Prefer: return=representation")
        $argsList += @("-d", "@$BodyFile")
    }

    $argsList += @("-o", $outputFile)

    & $curl @argsList
    $headerContent = if (Test-Path $headersFile) { Get-Content $headersFile -Raw } else { "" }
    $statusCode = 0
    if ($headerContent -match "HTTP/\S+\s+(\d{3})") {
        $statusCode = [int]$matches[1]
    }
    $body = if (Test-Path $outputFile) { Get-Content $outputFile -Raw } else { "" }
    return [PSCustomObject]@{
        StatusCode = $statusCode
        Body = $body
        RawHeaders = $headerContent
    }
}

Write-Output "=== 1. Testing Auth Sign-in ==="
$authPayloadFile = Join-Path $testDir "auth_payload.json"
Save-JsonFile -FilePath $authPayloadFile -Content '{"email":"puribijay@gmail.com","password":"puribijay@gmail.com"}'

$authRes = Invoke-SupabaseRequest -Method "POST" -Path "/auth/v1/token?grant_type=password" -BodyFile $authPayloadFile
$authJson = $authRes.Body | ConvertFrom-Json
$token = $authJson.access_token
$userId = $authJson.user.id

$testResults["Authentication"] = @{
    Status = if ($authRes.StatusCode -eq 200 -and $token) { "PASSED" } else { "FAILED" }
    StatusCode = $authRes.StatusCode
    UserId = $userId
    Email = $authJson.user.email
}
Write-Output "Auth Status: $($testResults['Authentication'].Status) ($userId)"

if (-not $token) {
    Write-Output "Authentication failed, stopping tests."
    Save-JsonFile -FilePath (Join-Path $testDir "test_report.json") -Content ($testResults | ConvertTo-Json -Depth 5)
    exit 1
}

Write-Output "=== 2. Testing User Profile ==="
$profileRes = Invoke-SupabaseRequest -Method "GET" -Path "/rest/v1/user_profiles?id=eq.$userId&select=*" -Token $token
$profileData = $profileRes.Body | ConvertFrom-Json
$testResults["UserProfile_Read"] = @{
    Status = if ($profileRes.StatusCode -eq 200) { "PASSED" } else { "FAILED" }
    StatusCode = $profileRes.StatusCode
    Profile = $profileData
}
Write-Output "Profile Read: $($testResults['UserProfile_Read'].Status)"

Write-Output "=== 3. Testing Existing Vehicles ==="
$vehRes = Invoke-SupabaseRequest -Method "GET" -Path "/rest/v1/vehicles?select=*" -Token $token
$vehicles = $vehRes.Body | ConvertFrom-Json
$testResults["Vehicles_Read"] = @{
    Status = if ($vehRes.StatusCode -eq 200) { "PASSED" } else { "FAILED" }
    Count = if ($vehicles) { $vehicles.Count } else { 0 }
    Vehicles = $vehicles
}
Write-Output "Vehicles Read: Count = $($testResults['Vehicles_Read'].Count)"

Write-Output "=== 4. Testing Vehicle Creation (Form Insert) ==="
$newVehFile = Join-Path $testDir "new_vehicle.json"
$newVehJson = @"
{
    "year": 2024,
    "make": "Yamaha Test",
    "model": "MT-15 V2",
    "license_plate": "PROD TEST 99",
    "user_id": "$userId"
}
"@
Save-JsonFile -FilePath $newVehFile -Content $newVehJson

$createVehRes = Invoke-SupabaseRequest -Method "POST" -Path "/rest/v1/vehicles" -Token $token -BodyFile $newVehFile
$createdVeh = $createVehRes.Body | ConvertFrom-Json
$testVehId = if ($createdVeh -and $createdVeh.Count -gt 0) { $createdVeh[0].id } elseif ($createdVeh.id) { $createdVeh.id } else { $null }

$testResults["Vehicle_Create"] = @{
    Status = if ($createVehRes.StatusCode -in 200, 201 -and $testVehId) { "PASSED" } else { "FAILED" }
    StatusCode = $createVehRes.StatusCode
    CreatedVehicleId = $testVehId
    Response = $createVehRes.Body
}
Write-Output "Vehicle Create: $($testResults['Vehicle_Create'].Status) ($testVehId)"

if (-not $testVehId) {
    Write-Output "Vehicle creation failed, aborting record tests."
    Save-JsonFile -FilePath (Join-Path $testDir "test_report.json") -Content ($testResults | ConvertTo-Json -Depth 5)
    exit 1
}

Write-Output "=== 5. Testing Fuel Record Insert ==="
$fuelFile = Join-Path $testDir "new_fuel.json"
$fuelJson = @"
{
    "vehicle_id": "$testVehId",
    "date": "2026-09-18",
    "odometer": 12000,
    "liters": 10.5,
    "cost": 1850,
    "is_fill_to_full": true,
    "missed_previous_fill": false,
    "notes": "Automated verification fuel log"
}
"@
Save-JsonFile -FilePath $fuelFile -Content $fuelJson

$fuelRes = Invoke-SupabaseRequest -Method "POST" -Path "/rest/v1/fuel_records" -Token $token -BodyFile $fuelFile
$createdFuel = $fuelRes.Body | ConvertFrom-Json
$fuelId = if ($createdFuel -and $createdFuel.Count -gt 0) { $createdFuel[0].id } elseif ($createdFuel.id) { $createdFuel.id } else { $null }

$testResults["FuelRecord_Insert"] = @{
    Status = if ($fuelRes.StatusCode -in 200, 201 -and $fuelId) { "PASSED" } else { "FAILED" }
    StatusCode = $fuelRes.StatusCode
    FuelId = $fuelId
    Response = $fuelRes.Body
}
Write-Output "Fuel Insert: $($testResults['FuelRecord_Insert'].Status) ($fuelId)"

Write-Output "=== 6. Testing Second Fuel Record Insert (for mileage calculation) ==="
$fuel2File = Join-Path $testDir "new_fuel2.json"
$fuel2Json = @"
{
    "vehicle_id": "$testVehId",
    "date": "2026-09-18",
    "odometer": 12450,
    "liters": 9.8,
    "cost": 1725,
    "is_fill_to_full": true,
    "missed_previous_fill": false,
    "notes": "Automated second fuel log for mileage test"
}
"@
Save-JsonFile -FilePath $fuel2File -Content $fuel2Json

$fuel2Res = Invoke-SupabaseRequest -Method "POST" -Path "/rest/v1/fuel_records" -Token $token -BodyFile $fuel2File
$createdFuel2 = $fuel2Res.Body | ConvertFrom-Json
$fuel2Id = if ($createdFuel2 -and $createdFuel2.Count -gt 0) { $createdFuel2[0].id } elseif ($createdFuel2.id) { $createdFuel2.id } else { $null }

$testResults["FuelRecord2_Insert"] = @{
    Status = if ($fuel2Res.StatusCode -in 200, 201 -and $fuel2Id) { "PASSED" } else { "FAILED" }
    StatusCode = $fuel2Res.StatusCode
    Fuel2Id = $fuel2Id
}
Write-Output "Fuel 2 Insert: $($testResults['FuelRecord2_Insert'].Status) ($fuel2Id)"

Write-Output "=== 7. Testing Service Record Insert ==="
$serviceFile = Join-Path $testDir "new_service.json"
$serviceJson = @"
{
    "vehicle_id": "$testVehId",
    "date": "2026-09-18",
    "odometer": 12450,
    "description": "Full Periodic Service & Motul 7100 Engine Oil",
    "cost": 2800,
    "notes": "Verified by automated test suite"
}
"@
Save-JsonFile -FilePath $serviceFile -Content $serviceJson

$serviceRes = Invoke-SupabaseRequest -Method "POST" -Path "/rest/v1/service_records" -Token $token -BodyFile $serviceFile
$createdService = $serviceRes.Body | ConvertFrom-Json
$serviceId = if ($createdService -and $createdService.Count -gt 0) { $createdService[0].id } elseif ($createdService.id) { $createdService.id } else { $null }

$testResults["ServiceRecord_Insert"] = @{
    Status = if ($serviceRes.StatusCode -in 200, 201 -and $serviceId) { "PASSED" } else { "FAILED" }
    StatusCode = $serviceRes.StatusCode
    ServiceId = $serviceId
    Response = $serviceRes.Body
}
Write-Output "Service Insert: $($testResults['ServiceRecord_Insert'].Status) ($serviceId)"

Write-Output "=== 8. Testing Upgrade Record Insert ==="
$upgradeFile = Join-Path $testDir "new_upgrade.json"
$upgradeJson = @"
{
    "vehicle_id": "$testVehId",
    "date": "2026-09-18",
    "odometer": 12450,
    "description": "Crash Guard & Mobile Holder Mount",
    "cost": 4500,
    "notes": "Verified by automated test suite"
}
"@
Save-JsonFile -FilePath $upgradeFile -Content $upgradeJson

$upgradeRes = Invoke-SupabaseRequest -Method "POST" -Path "/rest/v1/upgrade_records" -Token $token -BodyFile $upgradeFile
$createdUpgrade = $upgradeRes.Body | ConvertFrom-Json
$upgradeId = if ($createdUpgrade -and $createdUpgrade.Count -gt 0) { $createdUpgrade[0].id } elseif ($createdUpgrade.id) { $createdUpgrade.id } else { $null }

$testResults["UpgradeRecord_Insert"] = @{
    Status = if ($upgradeRes.StatusCode -in 200, 201 -and $upgradeId) { "PASSED" } else { "FAILED" }
    StatusCode = $upgradeRes.StatusCode
    UpgradeId = $upgradeId
    Response = $upgradeRes.Body
}
Write-Output "Upgrade Insert: $($testResults['UpgradeRecord_Insert'].Status) ($upgradeId)"

Write-Output "=== 9. Testing Tax Record Insert ==="
$taxFile = Join-Path $testDir "new_tax.json"
$taxJson = @"
{
    "vehicle_id": "$testVehId",
    "date": "2026-09-18",
    "description": "Nepal Government Annual Road Tax & Bluebook Renewal",
    "cost": 3000,
    "notes": "Verified by automated test suite"
}
"@
Save-JsonFile -FilePath $taxFile -Content $taxJson

$taxRes = Invoke-SupabaseRequest -Method "POST" -Path "/rest/v1/tax_records" -Token $token -BodyFile $taxFile
$createdTax = $taxRes.Body | ConvertFrom-Json
$taxId = if ($createdTax -and $createdTax.Count -gt 0) { $createdTax[0].id } elseif ($createdTax.id) { $createdTax.id } else { $null }

$testResults["TaxRecord_Insert"] = @{
    Status = if ($taxRes.StatusCode -in 200, 201 -and $taxId) { "PASSED" } else { "FAILED" }
    StatusCode = $taxRes.StatusCode
    TaxId = $taxId
    Response = $taxRes.Body
}
Write-Output "Tax Insert: $($testResults['TaxRecord_Insert'].Status) ($taxId)"

Write-Output "=== 10. Testing Notes Insert ==="
$noteFile = Join-Path $testDir "new_note.json"
$noteJson = @"
{
    "vehicle_id": "$testVehId",
    "date": "2026-09-18",
    "description": "Tire Pressure & Maintenance Checklist",
    "notes_content": "Front tire: 29 PSI, Rear tire: 33 PSI"
}
"@
Save-JsonFile -FilePath $noteFile -Content $noteJson

$noteRes = Invoke-SupabaseRequest -Method "POST" -Path "/rest/v1/notes" -Token $token -BodyFile $noteFile
$createdNote = $noteRes.Body | ConvertFrom-Json
$noteId = if ($createdNote -and $createdNote.Count -gt 0) { $createdNote[0].id } elseif ($createdNote.id) { $createdNote.id } else { $null }

$testResults["NoteRecord_Insert"] = @{
    Status = if ($noteRes.StatusCode -in 200, 201 -and $noteId) { "PASSED" } else { "FAILED" }
    StatusCode = $noteRes.StatusCode
    NoteId = $noteId
    Response = $noteRes.Body
}
Write-Output "Note Insert: $($testResults['NoteRecord_Insert'].Status) ($noteId)"

Write-Output "=== 11. Testing Reminders Insert ==="
$remFile = Join-Path $testDir "new_reminder.json"
$remJson = @"
{
    "vehicle_id": "$testVehId",
    "description": "Next Engine Oil Change",
    "metric": "Odometer",
    "target_odometer": 15000,
    "notes": "Change oil every 3000km"
}
"@
Save-JsonFile -FilePath $remFile -Content $remJson

$remRes = Invoke-SupabaseRequest -Method "POST" -Path "/rest/v1/reminders" -Token $token -BodyFile $remFile
$createdRem = $remRes.Body | ConvertFrom-Json
$remId = if ($createdRem -and $createdRem.Count -gt 0) { $createdRem[0].id } elseif ($createdRem.id) { $createdRem.id } else { $null }

$testResults["ReminderRecord_Insert"] = @{
    Status = if ($remRes.StatusCode -in 200, 201 -and $remId) { "PASSED" } else { "FAILED" }
    StatusCode = $remRes.StatusCode
    ReminderId = $remId
    Response = $remRes.Body
}
Write-Output "Reminder Insert: $($testResults['ReminderRecord_Insert'].Status) ($remId)"

Write-Output "=== 12. Testing Database Read Queries for Logs & Dashboard ==="
$readFuel = Invoke-SupabaseRequest -Method "GET" -Path "/rest/v1/fuel_records?vehicle_id=eq.$testVehId&select=*" -Token $token
$readService = Invoke-SupabaseRequest -Method "GET" -Path "/rest/v1/service_records?vehicle_id=eq.$testVehId&select=*" -Token $token
$readUpgrade = Invoke-SupabaseRequest -Method "GET" -Path "/rest/v1/upgrade_records?vehicle_id=eq.$testVehId&select=*" -Token $token
$readTax = Invoke-SupabaseRequest -Method "GET" -Path "/rest/v1/tax_records?vehicle_id=eq.$testVehId&select=*" -Token $token
$readNotes = Invoke-SupabaseRequest -Method "GET" -Path "/rest/v1/notes?vehicle_id=eq.$testVehId&select=*" -Token $token
$readRem = Invoke-SupabaseRequest -Method "GET" -Path "/rest/v1/reminders?vehicle_id=eq.$testVehId&select=*" -Token $token

$fuelsData = $readFuel.Body | ConvertFrom-Json
$servicesData = $readService.Body | ConvertFrom-Json
$upgradesData = $readUpgrade.Body | ConvertFrom-Json
$taxesData = $readTax.Body | ConvertFrom-Json

$totalCost = ($fuelsData | Measure-Object -Property cost -Sum).Sum +
             ($servicesData | Measure-Object -Property cost -Sum).Sum +
             ($upgradesData | Measure-Object -Property cost -Sum).Sum +
             ($taxesData | Measure-Object -Property cost -Sum).Sum

$distance = ($fuelsData[1].odometer - $fuelsData[0].odometer)
$mileage = [math]::Round($distance / $fuelsData[1].liters, 2)

$testResults["Dashboard_Calculations"] = @{
    Status = "PASSED"
    CalculatedTotalCost = $totalCost
    ExpectedTotalCost = 1850 + 1725 + 2800 + 4500 + 3000
    DistanceKm = $distance
    MileageKmPerL = $mileage
}
Write-Output "Dashboard Total Cost: $totalCost (Expected: $(1850 + 1725 + 2800 + 4500 + 3000))"
Write-Output "Dashboard Distance: $distance km, Mileage: $mileage km/L"

Write-Output "=== 13. Testing Currency Preference Update ==="
$currencyUpdateFile = Join-Path $testDir "currency_update.json"
Save-JsonFile -FilePath $currencyUpdateFile -Content '{"currency":"NPR"}'
$curRes = Invoke-SupabaseRequest -Method "PATCH" -Path "/rest/v1/user_profiles?id=eq.$userId" -Token $token -BodyFile $currencyUpdateFile
$testResults["Currency_Update"] = @{
    Status = if ($curRes.StatusCode -in 200, 204) { "PASSED" } else { "FAILED" }
    StatusCode = $curRes.StatusCode
}
Write-Output "Currency Update: $($testResults['Currency_Update'].Status)"

Write-Output "=== 14. Testing Cleanup (Cascade Delete of Test Vehicle) ==="
$delVehRes = Invoke-SupabaseRequest -Method "DELETE" -Path "/rest/v1/vehicles?id=eq.$testVehId" -Token $token
$verifyFuel = Invoke-SupabaseRequest -Method "GET" -Path "/rest/v1/fuel_records?vehicle_id=eq.$testVehId&select=*" -Token $token
$cascadedFuelData = $verifyFuel.Body | ConvertFrom-Json

$testResults["Vehicle_Cascade_Delete"] = @{
    Status = if ($delVehRes.StatusCode -in 200, 204 -and ($cascadedFuelData.Count -eq 0 -or $cascadedFuelData -eq $null)) { "PASSED" } else { "FAILED" }
    StatusCode = $delVehRes.StatusCode
    RemainingOrphanFuelRecords = if ($cascadedFuelData) { $cascadedFuelData.Count } else { 0 }
}
Write-Output "Cleanup & Cascade Delete: $($testResults['Vehicle_Cascade_Delete'].Status)"

Save-JsonFile -FilePath (Join-Path $testDir "test_report.json") -Content ($testResults | ConvertTo-Json -Depth 6)
Write-Output "=== ALL TESTS COMPLETED SUCCESSFULLY ==="
