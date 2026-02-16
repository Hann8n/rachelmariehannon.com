# Troubleshooting Decap CMS on Netlify

If `/admin` isn't working, check these common issues:

## 1. Netlify Identity Not Enabled

**Symptoms:** Admin page loads but shows login errors or doesn't show login button

**Fix:**
1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Identity**
3. Click **Enable Identity service**
4. Wait for it to initialize (may take a minute)

## 2. Git Gateway Not Enabled

**Symptoms:** Can login but can't save changes, or get "Git Gateway" errors

**Fix:**
1. In Netlify dashboard, go to **Identity** → **Services**
2. Scroll to **Git Gateway**
3. Click **Enable Git Gateway**
4. This connects Identity to your GitHub repo

## 3. User Not Invited

**Symptoms:** Can login but see "Access denied" or similar

**Fix:**
1. Go to **Identity** → **Invite users**
2. Enter your sister's email address
3. She'll receive an invitation email
4. She needs to accept the invitation before she can edit

## 4. Config File Not Found

**Symptoms:** Admin page loads but shows "Config file not found" error

**Fix:**
- Make sure `admin/config.yml` exists in your repo
- Check that it's committed and pushed to GitHub
- Verify the file path is exactly `admin/config.yml` (case-sensitive)

## 5. Branch Name Mismatch

**Symptoms:** Changes don't save or wrong branch

**Fix:**
- Check `admin/config.yml` - the `branch` should match your default branch
- Common values: `main` or `master`
- Update if needed and redeploy

## 6. Browser Console Errors

**Check the browser console (F12) for errors:**
- Open `/admin` page
- Press F12 to open Developer Tools
- Look at the Console tab for error messages
- Common errors:
  - `netlifyIdentity is not defined` → Identity not enabled
  - `Config file not found` → Check config.yml path
  - `Git Gateway error` → Git Gateway not enabled

## 7. Clear Cache and Retry

Sometimes Netlify caches can cause issues:
1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy** → **Clear cache and deploy site**
3. Wait for redeploy
4. Try `/admin` again

## Quick Checklist

- [ ] Netlify Identity is enabled
- [ ] Git Gateway is enabled  
- [ ] User has been invited via Identity
- [ ] `admin/config.yml` exists and is correct
- [ ] Branch name in config matches your repo branch
- [ ] Site has been redeployed after enabling Identity
- [ ] Browser console shows no errors

## Still Not Working?

1. Check the browser console (F12) for specific error messages
2. Check Netlify's **Functions** tab for any errors
3. Verify your GitHub repo is properly connected
4. Try accessing `/admin` in an incognito/private window
5. Check Netlify's **Deploys** tab for build errors

## Test the Setup

1. Go to `https://your-site.netlify.app/admin`
2. You should see a "Login" button
3. Click it → should show Netlify Identity login modal
4. Login with invited email
5. Should see "Site Content" collection
6. Click on it → should show the editing interface
