# Email Service Fix Guide - Password Reset Not Working

## 🔍 Problem Summary

The forgot password and admin reset password features were not sending emails because:

1. **`EMAIL_SERVICE_ENABLED` was not set to `true`** in Render environment variables
2. When disabled, the EmailService only logged to console and returned `true` (misleading success)
3. The system thought emails were sent, but they were only being logged

---

## ✅ What We Fixed

### 1. **Robust Boolean Parsing** (`config.ts`)
- Now accepts: `"true"`, `"TRUE"`, `"1"`, `"yes"`, `"y"`, `"on"` (case-insensitive)
- Previously only accepted exactly `"true"`

### 2. **Proper Error Reporting** (`email.ts`)
- Now **throws an error** when email service is disabled
- No longer returns misleading `true` when disabled
- Frontend/API will properly report email failures

### 3. **Startup Logging** (`index.ts`)
- Shows email configuration on server startup
- Displays:
  - EMAIL_SERVICE_ENABLED status
  - EMAIL_USER, EMAIL_FROM
  - EMAIL_PASSWORD status (SET or NOT SET)
  - FRONTEND_URL

### 4. **Admin Test Endpoint** (`admin.ts`)
- New endpoint: `POST /api/admin/test-email`
- Instantly test email configuration without going through full reset flow
- Admin-only access

### 5. **Updated Documentation** (`.env.example`)
- Added email configuration examples
- Added FRONTEND_URL configuration

---

## 🚀 Deployment Steps for Render

### Step 1: Set Environment Variables in Render

1. Go to **Render Dashboard** → **escashop-backend** → **Environment**

2. Add/Update these environment variables:

   ```
   EMAIL_SERVICE_ENABLED = true
   EMAIL_USER = jefor16@gmail.com
   EMAIL_FROM = jefor16@gmail.com
   EMAIL_PASSWORD = your-gmail-app-password
   FRONTEND_URL = https://your-frontend-url.onrender.com
   ```

   **Important Notes:**
   - `EMAIL_PASSWORD` must be a **Gmail App Password**, NOT your regular Gmail password
   - Get App Password: Google Account → Security → 2-Step Verification → App passwords
   - `FRONTEND_URL` should be your deployed frontend URL (for password reset links)

3. Click **Save Changes**

### Step 2: Deploy the Code Changes

1. **Commit and push your changes:**
   ```powershell
   git add .
   git commit -m "Fix: Enable email service for password reset functionality"
   git push origin main
   ```

2. **Trigger Manual Deploy in Render:**
   - Go to Render Dashboard → escashop-backend
   - Click **Manual Deploy** → **Clear build cache & deploy**
   - Wait for deployment to complete

### Step 3: Verify Configuration

1. **Check startup logs in Render:**
   - Go to **Logs** tab
   - Look for the email configuration section:
   ```
   ============================================================
   📧 EMAIL SERVICE CONFIGURATION
   ============================================================
   EMAIL_SERVICE_ENABLED: true
   EMAIL_USER: jefor16@gmail.com
   EMAIL_FROM: jefor16@gmail.com
   EMAIL_PASSWORD: ✅ SET
   FRONTEND_URL: https://your-frontend-url.onrender.com
   ✅ Email service is ENABLED - Emails will be sent
   ============================================================
   ```

2. **If you see `❌ NOT SET` or `Email service is DISABLED`:**
   - Double-check environment variables in Render
   - Make sure `EMAIL_SERVICE_ENABLED` is exactly `true` (lowercase)
   - Redeploy after fixing

---

## 🧪 Testing

### Test 1: Admin Test Email Endpoint

Use this endpoint to quickly test email functionality:

```powershell
# Replace with your actual backend URL and admin token
$backendUrl = "https://escashop-backend.onrender.com"
$adminToken = "your-admin-jwt-token"

$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

$body = @{
    email = "jefor16@gmail.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$backendUrl/api/admin/test-email" -Method POST -Headers $headers -Body $body
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully to jefor16@gmail.com",
  "timestamp": "2025-10-15T06:51:00.000Z"
}
```

### Test 2: Forgot Password Flow

1. Go to your **frontend login page**
2. Click **"Forgot password?"**
3. Enter a test email address (e.g., `jefor16@gmail.com`)
4. Click **"Send Reset Link"**
5. Check your **email inbox** (and spam folder)
6. You should receive an email with subject: **"Password Reset Request - EscaShop Optical"**
7. Click the reset link and verify it works

**Watch Render logs during this test:**
```
📧 Attempting to send actual email...
Sending password reset email to: jefor16@gmail.com
✅ Password reset email sent successfully to: jefor16@gmail.com
```

### Test 3: Admin Reset Password

1. Log in as **admin**
2. Go to **User Management**
3. Select a user
4. Click **"Reset Password"** action
5. User should receive the password reset email
6. Verify the email arrives and the link works

**Watch Render logs:**
```
Sending password reset email to: user@example.com
✅ Password reset email sent successfully to: user@example.com
```

---

## 🛠️ Troubleshooting

### Issue: "Email service is disabled" error

**Cause:** `EMAIL_SERVICE_ENABLED` is not set to `true`

**Fix:**
1. Go to Render → Environment variables
2. Set `EMAIL_SERVICE_ENABLED = true` (lowercase)
3. Save and redeploy

### Issue: "Failed to send email" / SMTP errors

**Possible causes:**

1. **Invalid Gmail App Password**
   - Generate a new App Password from Google Account settings
   - Update `EMAIL_PASSWORD` in Render

2. **Gmail blocking sign-in**
   - Check your Gmail security settings
   - Make sure 2-Step Verification is enabled
   - Create a new App Password

3. **SMTP connection timeout**
   - Check Render logs for detailed error messages
   - Verify network connectivity

### Issue: Email sent but not received

**Check:**
1. **Spam/Junk folder** - Gmail might filter it
2. **Email address spelling** - Verify correct email
3. **FRONTEND_URL configuration** - Check reset link is correct
4. **Gmail sending limits** - Google has daily sending limits

### Issue: Password reset link doesn't work

**Cause:** `FRONTEND_URL` is incorrect or missing

**Fix:**
1. Set `FRONTEND_URL` to your deployed frontend URL
2. Example: `https://escashop-frontend.onrender.com`
3. Redeploy backend

---

## 📋 Quick Checklist

Before going live, ensure:

- [ ] `EMAIL_SERVICE_ENABLED = true` in Render
- [ ] `EMAIL_USER` is set to your Gmail address
- [ ] `EMAIL_PASSWORD` is a valid Gmail App Password (not your login password)
- [ ] `EMAIL_FROM` matches `EMAIL_USER`
- [ ] `FRONTEND_URL` is your deployed frontend URL
- [ ] Code changes are committed and pushed
- [ ] Backend is redeployed on Render
- [ ] Startup logs show "✅ Email service is ENABLED"
- [ ] Test email endpoint works
- [ ] Forgot password flow tested end-to-end
- [ ] Admin reset password tested end-to-end

---

## 📚 Additional Resources

### How to Get Gmail App Password

1. Go to your **Google Account** (https://myaccount.google.com/)
2. Navigate to **Security**
3. Under "How you sign in to Google," select **2-Step Verification**
4. At the bottom, select **App passwords**
5. Select **Mail** and your device
6. Click **Generate**
7. Copy the 16-character password
8. Use this in `EMAIL_PASSWORD` environment variable

### Email Template Customization

Email templates are in `backend/src/services/email.ts`:
- `sendPasswordResetEmail()` - Password reset template
- `sendWelcomeEmail()` - New user welcome email
- `sendNotificationEmail()` - General notifications

---

## 🎉 Success!

Once all tests pass, your password reset functionality is fully working!

Users can now:
✅ Reset their password via "Forgot password?" link
✅ Receive password reset emails from admins
✅ Click reset links and set new passwords

---

**Questions or issues?** Check the Render logs for detailed error messages.
