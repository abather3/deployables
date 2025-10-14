# Render Free Tier Deployment Guide

**Issue:** Blueprint sync (render.yaml) requires payment on Render's free tier.

**Solution:** Configure services manually in Render dashboard (FREE!)

---

## 🎯 Step-by-Step Instructions

### **Step 1: Check Current Deployment**

The backend is currently running OLD code from August 20th. We need to deploy the new code with email fixes.

---

### **Step 2: Go to Render Dashboard**

1. Open browser: **https://dashboard.render.com**
2. Sign in with your account
3. You should see two services:
   - `escashop-backend`
   - `escashop-frontend`

---

### **Step 3: Configure Backend Environment Variables**

1. **Click on:** `escashop-backend` service
2. **Go to:** "Environment" tab (left sidebar)
3. **Add/Update these variables:**

| Key | Value | Notes |
|-----|-------|-------|
| `EMAIL_SERVICE_ENABLED` | `true` | Enable email service |
| `EMAIL_SERVICE` | `gmail` | Use Gmail |
| `EMAIL_USER` | `jefor16@gmail.com` | Gmail account |
| `EMAIL_FROM` | `jefor16@gmail.com` | Sender email |
| `EMAIL_PASSWORD` | `yhtykpskbzomlwib` | Gmail App Password (NEW) |
| `FRONTEND_URL` | `https://escashop-frontend.onrender.com` | Frontend URL |

4. **Click "Save Changes"** at the bottom

**Important:** After saving, the service will automatically restart with new variables (takes ~30 seconds)

---

### **Step 4: Trigger Manual Deploy**

Since Render is still running old code, we need to deploy the latest code:

1. Still in `escashop-backend` service page
2. Look for **"Manual Deploy"** button (top-right area)
3. Click **"Manual Deploy"** → Choose **"Clear build cache & deploy"** if available, or just **"Deploy latest commit"**
4. **Wait** for deployment to complete (3-5 minutes)
   - Watch the build logs in real-time
   - Look for any errors (red text)
5. Deployment is complete when you see: **"Live"** status

**Note:** Manual deployment is FREE on Render!

---

### **Step 5: Enable Auto-Deploy (Optional but Recommended)**

So you don't have to manually deploy every time:

1. In `escashop-backend` service page
2. Go to **"Settings"** tab
3. Scroll to **"Build & Deploy"** section
4. Find **"Auto-Deploy"**
5. Make sure it's set to **"Yes"** for branch: `main`
6. If not, enable it and save

Now future Git pushes will automatically deploy! (FREE feature)

---

### **Step 6: Verify Deployment**

After deployment completes, check if new code is running:

**Run this command in PowerShell:**
```powershell
Invoke-WebRequest -Uri "https://escashop-backend.onrender.com/health" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected output:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-14T...",
  "deployment": "UPDATED TIMESTAMP (NOT Aug 20)"
}
```

If you still see "2025-08-20", the deployment hasn't completed yet - wait a bit longer.

---

### **Step 7: Test Password Reset**

Once deployment is live:

#### **Test via Frontend UI:**
1. Go to: `https://escashop-frontend.onrender.com`
2. Go to **User Management** (as admin)
3. Find user: `cashier.employe01@gmail.com`
4. Click **"Reset Password"** button
5. Check the email inbox (and spam folder)

#### **Test via API directly:**
```powershell
Invoke-WebRequest -Uri "https://escashop-backend.onrender.com/api/auth/request-password-reset" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"email":"cashier.employe01@gmail.com"}' `
    -UseBasicParsing
```

**Expected:**
- Status: 200 OK
- Email arrives within 30 seconds

---

## 🔧 Troubleshooting

### **Issue: Deployment fails with error**

Check the build logs in Render dashboard:
1. Go to `escashop-backend` → "Logs" tab
2. Look for red error messages
3. Common issues:
   - **npm install fails:** Dependencies issue
   - **TypeScript build fails:** Code syntax error
   - **Database connection fails:** Database URL issue (but we skip migrations now)

### **Issue: Email still not sending**

1. **Check Render logs** for email errors:
   - Go to `escashop-backend` → "Logs" tab
   - Look for "❌ Error sending actual email"
   - Check what the error message says

2. **Verify environment variables:**
   - Go to "Environment" tab
   - Make sure `EMAIL_PASSWORD` = `yhtykpskbzomlwib`
   - Make sure `EMAIL_SERVICE_ENABLED` = `true`

3. **Check Gmail account:**
   - Make sure App Password is still valid
   - Go to: https://myaccount.google.com/apppasswords
   - Verify `yhtykpskbzomlwib` is listed
   - If revoked, create a new one

### **Issue: "Payment required" for deployment**

- Manual deployment is FREE!
- Only Blueprint sync (render.yaml) requires payment
- We removed render.yaml, so you can deploy manually for free
- Make sure you're clicking "Manual Deploy" not "Sync Blueprint"

---

## 📝 What We Fixed

### **Code Changes (Already Pushed to GitHub):**
1. ✅ Email service now returns `false` on failure (not always `true`)
2. ✅ UserService checks if email was sent successfully
3. ✅ Proper error handling and logging
4. ✅ Gmail App Password updated to working one
5. ✅ Sender format fixed: `"ESCA Shop" <jefor16@gmail.com>`

### **Test Results:**
- ✅ Test email sent successfully locally
- ✅ Configuration verified working
- ⏳ **Waiting:** Render deployment with new code

---

## 🎯 Summary

**What you need to do:**
1. ✅ Update environment variables in Render (if not done)
2. ⏳ **Manually deploy** the backend on Render
3. ⏳ Wait for deployment to complete
4. ⏳ Test password reset

**After successful deployment:**
- Password reset emails will work from production
- No more false success messages
- Proper error handling if email fails

---

## 📞 Need Help?

If deployment fails or emails still don't work:
1. Share the Render build logs (from "Logs" tab)
2. Share any error messages you see
3. Check if the `/health` endpoint shows updated deployment time

**The configuration is correct and tested - we just need to get it deployed!** 🚀
