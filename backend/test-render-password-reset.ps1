# Test password reset on Render production environment
Write-Host "Testing password reset on Render..." -ForegroundColor Yellow
Write-Host ""

# First, let's get a user ID to test with
Write-Host "Step 1: Testing if we can trigger password reset..." -ForegroundColor Cyan

$testEmail = "cashier.employe01@gmail.com"

# Try to trigger password reset (this endpoint should exist even in old deployment)
try {
    $response = Invoke-WebRequest -Uri "https://escashop-backend.onrender.com/api/auth/request-password-reset" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{email = $testEmail} | ConvertTo-Json) `
        -UseBasicParsing

    Write-Host "✅ Password reset request sent successfully!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "👉 Now check the email inbox for: $testEmail" -ForegroundColor Yellow
    Write-Host "   (Also check spam/junk folder)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Password reset request failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Note: This tests the OLD deployment on Render (Aug 20th)" -ForegroundColor Yellow
Write-Host "To test with the NEW email password, you need to:" -ForegroundColor Yellow
Write-Host "1. Go to Render Dashboard" -ForegroundColor Yellow
Write-Host "2. Manually deploy the latest commit" -ForegroundColor Yellow
Write-Host "3. Or update EMAIL_PASSWORD environment variable directly in Render settings" -ForegroundColor Yellow
