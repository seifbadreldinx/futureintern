# Bulk Logo Upload Script - Upload all generated logos

$API_URL = "https://futureintern-production.up.railway.app/api/admin/bulk-upload-logos-ADMIN"

# Company mappings (file -> company name)
$logos = @(
    @{file="logo_intcore.png"; company="Intcore"},
    @{file="logo_eand.png"; company="e&"},
    @{file="logo_robotesta.png"; company="Robotesta"},
    @{file="logo_pwc.png"; company="PwC"},
    @{file="logo_vodafone.png"; company="Vodafone"},
    @{file="logo_paymob.png"; company="Paymob"},
    @{file="logo_milkup.png"; company="Milkup"},
    @{file="logo_unicharm.png"; company="Unicharm"},
    @{file="logo_uniparticle.png"; company="Uniparticle"},
    @{file="logo_tips_hindawi.png"; company="Tips Hindawi"},
    @{file="logo_geidea.png"; company="Geidea"},
    @{file="logo_fawry.png"; company="Fawry"},
    @{file="logo_xefort_solutions.png"; company="XEFORT SOLUTIONS"},
    @{file="logo_cultiv_bureau.png"; company="Cultiv Bureau"},
    @{file="logo_skillinfytech.png"; company="SkillInfyTech"},
    @{file="logo_codtech_it_solutions.png"; company="CODTECH IT SOLUTIONS"},
    @{file="logo_weintern.png"; company="WeIntern"},
    @{file="logo_breadfast.png"; company="Breadfast"}
)

Write-Host "=== Bulk Logo Upload ===" -ForegroundColor Cyan
Write-Host ""

# Build the form data
$form = @{}
$index = 1

foreach ($logo in $logos) {
    $filePath = Join-Path $PSScriptRoot $logo.file
    
    if (Test-Path $filePath) {
        Write-Host "Found: $($logo.file) -> $($logo.company)" -ForegroundColor Green
        $form["logo_$index"] = Get-Item -Path $filePath
        $form["company_name_$index"] = $logo.company
        $index++
    } else {
        Write-Host "Missing: $($logo.file)" -ForegroundColor Yellow
    }
}

if ($form.Count -eq 0) {
    Write-Host ""
    Write-Host "No logo files found!" -ForegroundColor Red
    Write-Host "Run: python generate_logos.py first" -ForegroundColor Yellow
    exit 1
}

$logoCount = $form.Count / 2
Write-Host ""
Write-Host "Uploading $logoCount logos to production..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $API_URL -Method Post -Form $form
    
    Write-Host "=== Upload Results ===" -ForegroundColor Cyan
    Write-Host "Total: $($response.total)" -ForegroundColor White
    Write-Host "Successful: $($response.success.Count)" -ForegroundColor Green
    Write-Host "Errors: $($response.errors.Count)" -ForegroundColor Red
    Write-Host ""
    
    if ($response.success.Count -gt 0) {
        Write-Host "Successfully uploaded:" -ForegroundColor Green
        foreach ($item in $response.success) {
            Write-Host "  $($item.company_name)" -ForegroundColor Green
        }
        Write-Host ""
    }
    
    if ($response.errors.Count -gt 0) {
        Write-Host "Errors:" -ForegroundColor Red
        foreach ($item in $response.errors) {
            Write-Host "  $($item.error)" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    Write-Host "Done! Check https://futureintern-two.vercel.app/companies" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "Upload failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}
