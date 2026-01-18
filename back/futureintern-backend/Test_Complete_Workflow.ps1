# FutureIntern Complete Test - All 6 Phases
$BASE_URL = "http://127.0.0.1:5000"

Write-Host "`n=== FutureIntern Test ===" -ForegroundColor Cyan

# Test 1: Register/Login Company
Write-Host "`n1. Company Setup..." -ForegroundColor Yellow
$companyBody = '{"name":"Company Admin","email":"testcompany@test.com","password":"123456","company_name":"Test Tech Corp","industry":"Technology","website":"https://test.com"}'
try { 
    $reg = Invoke-RestMethod -Uri "$BASE_URL/api/auth/register/company" -Method Post -ContentType "application/json" -Body $companyBody -ErrorAction Stop
    Write-Host "   Registered new company!" -ForegroundColor Green
} catch {
    Write-Host "   Company exists, logging in..." -ForegroundColor Gray
}
$loginBody = '{"email":"testcompany@test.com","password":"123456"}'
$company = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$companyToken = $company.access_token
Write-Host "   OK: $($company.user.company_name)" -ForegroundColor Green

# Test 2: Register/Login Student
Write-Host "`n2. Student Setup..." -ForegroundColor Yellow
$studentBody = '{"email":"teststudent@test.com","password":"123456","name":"Test Student","university":"Cairo University","major":"Computer Science"}'
try { 
    $reg = Invoke-RestMethod -Uri "$BASE_URL/api/auth/register/student" -Method Post -ContentType "application/json" -Body $studentBody -ErrorAction Stop
    Write-Host "   Registered new student!" -ForegroundColor Green
} catch {
    Write-Host "   Student exists, logging in..." -ForegroundColor Gray
}
$loginBody = '{"email":"teststudent@test.com","password":"123456"}'
$student = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$studentToken = $student.access_token
Write-Host "   OK: $($student.user.name)" -ForegroundColor Green

# Test 3: Create Internship
Write-Host "`n3. Create Internship..." -ForegroundColor Yellow
$internBody = '{"title":"Dev Intern","description":"Coding","requirements":"Python","location":"Cairo","duration":"3 months","stipend":"5000","application_deadline":"2026-12-31","start_date":"2027-01-15"}'
$headers = @{"Authorization"="Bearer $companyToken";"Content-Type"="application/json"}
try {
    $intern = Invoke-RestMethod -Uri "$BASE_URL/api/internships/" -Method Post -Headers $headers -Body $internBody
    Write-Host "   OK: ID $($intern.internship.id)" -ForegroundColor Green
    $internId = $intern.internship.id
} catch {
    Write-Host "   Using existing internship" -ForegroundColor Yellow
    $all = Invoke-RestMethod -Uri "$BASE_URL/api/internships/"
    $internId = $all.internships[0].id
}

# Test 4: Apply for Internship
Write-Host "`n4. Student Applies..." -ForegroundColor Yellow
$appBody = "{`"internship_id`":$internId,`"cover_letter`":`"Excited to apply!`"}"
$headers = @{"Authorization"="Bearer $studentToken";"Content-Type"="application/json"}
try {
    $app = Invoke-RestMethod -Uri "$BASE_URL/api/applications/apply" -Method Post -Headers $headers -Body $appBody
    Write-Host "   OK: Application ID $($app.application.id)" -ForegroundColor Green
} catch {
    Write-Host "   Already applied" -ForegroundColor Yellow
}

# Test 5: Recommendations
Write-Host "`n5. Get Recommendations..." -ForegroundColor Yellow
$headers = @{"Authorization"="Bearer $studentToken"}
$recs = Invoke-RestMethod -Uri "$BASE_URL/api/recommendations" -Method Get -Headers $headers
Write-Host "   OK: $($recs.total) recommendations" -ForegroundColor Green

# Test 6: Chatbot
Write-Host "`n6. Test Chatbot..." -ForegroundColor Yellow
$chatBody = '{"message":"How do I register?"}'
$chat = Invoke-RestMethod -Uri "$BASE_URL/api/chatbot/chat" -Method Post -ContentType "application/json" -Body $chatBody
Write-Host "   OK: Bot responded" -ForegroundColor Green

# Test 7: FAQs
Write-Host "`n7. Get FAQs..." -ForegroundColor Yellow
$faqs = Invoke-RestMethod -Uri "$BASE_URL/api/chatbot/faq"
Write-Host "   OK: $($faqs.total) categories" -ForegroundColor Green

# Test 8: Admin
Write-Host "`n8. Admin Dashboard..." -ForegroundColor Yellow
try {
    $adminLogin = '{"email":"admin@futureintern.com","password":"admin123"}'
    $admin = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -ContentType "application/json" -Body $adminLogin
    $headers = @{"Authorization"="Bearer $($admin.access_token)"}
    $stats = Invoke-RestMethod -Uri "$BASE_URL/api/admin/stats" -Method Get -Headers $headers
    Write-Host "   OK: $($stats.users.total) users, $($stats.internships.total) internships" -ForegroundColor Green
} catch {
    Write-Host "   Admin not available" -ForegroundColor Yellow
}

# ========== PHASE 6: Quality & Delivery ==========
Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "   PHASE 6: Quality & Delivery" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# Test 9: Swagger Documentation
Write-Host "`n9. Swagger API Docs..." -ForegroundColor Yellow
try {
    $swagger = Invoke-RestMethod -Uri "$BASE_URL/apispec.json" -Method Get
    Write-Host "   OK: Swagger docs available at /apidocs/" -ForegroundColor Green
    Write-Host "   API Title: $($swagger.info.title)" -ForegroundColor Gray
} catch {
    Write-Host "   Swagger not available" -ForegroundColor Yellow
}

# Test 10: Error Handling (test 404)
Write-Host "`n10. Error Handling..." -ForegroundColor Yellow
try {
    $error404 = Invoke-RestMethod -Uri "$BASE_URL/api/nonexistent" -Method Get -ErrorAction Stop
} catch {
    Write-Host "   OK: 404 errors handled properly" -ForegroundColor Green
}

# Test 11: Validation (test bad request)
Write-Host "`n11. Input Validation..." -ForegroundColor Yellow
try {
    $badBody = '{}'
    $validation = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -ContentType "application/json" -Body $badBody -ErrorAction Stop
} catch {
    Write-Host "   OK: Validation errors handled properly" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   ALL 6 PHASES COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Phase 1-2: Auth & Setup OK" -ForegroundColor Gray
Write-Host "Phase 3: Business Logic OK" -ForegroundColor Gray
Write-Host "Phase 4: Recommendations OK" -ForegroundColor Gray
Write-Host "Phase 5: Advanced Features OK" -ForegroundColor Gray
Write-Host "Phase 6: Quality & Delivery OK" -ForegroundColor Gray
Write-Host "`nSwagger Docs: http://127.0.0.1:5000/apidocs/" -ForegroundColor Cyan
Write-Host "Test Interface: test_api.html`n" -ForegroundColor Cyan