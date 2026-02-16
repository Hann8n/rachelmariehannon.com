# Pages CMS Setup Guide

## ✅ What's Changed

Your website now uses **Pages CMS** instead of Decap CMS. Pages CMS is:
- ✨ Much simpler and cleaner interface
- 📱 Mobile-friendly
- 🎯 Easier for non-technical users
- 🆓 100% free
- ⚡ Faster and more intuitive

## 🚀 Quick Start

### Step 1: Go to Pages CMS
Visit: **https://app.pagescms.org/**

### Step 2: Sign In
Click "Sign in with GitHub" and authorize Pages CMS to access your repository.

### Step 3: Connect Your Repository
1. Pages CMS will show you a list of your GitHub repositories
2. Find and select your repository (rachelmariehannon.com)
3. Click "Connect"

### Step 4: Start Editing!
Once connected, you'll see your "Site Content" file. Click on it to start editing.

## 📝 How to Edit

### Editing Basic Info
- **Site Title**: Your book/site title
- **Subtitle**: The tagline
- **Author Name**: Your name

### Adding/Editing Sections

1. Scroll to **"Page Sections"**
2. Click **"+"** to add a new section
3. Choose a **Section Type**:
   - **text**: For paragraphs of text
   - **quote**: For quotes with attribution
   - **list**: For lists of items
   - **two-column**: For side-by-side content
   - **substack**: For Substack embeds

4. Fill in only the fields relevant to that section type
5. Click **"Save"** at the top

### Reordering Sections
- Use the **drag handle** (⋮⋮) on the left to reorder sections
- The order you see is the order on your website

### Deleting Sections
- Click the **trash icon** to delete a section

## 🎨 Tips

- **Don't worry about empty fields** - Only fill in what you need
- **Changes save to GitHub** - Your site will update automatically
- **Mobile-friendly** - Edit from your phone or tablet
- **Visual editor** - See your content as you edit it

## 🔧 Technical Details

- Configuration file: `.pages.yml` (already set up)
- Content file: `content/site.json`
- Media folder: `images/`

## ❓ Need Help?

- Pages CMS Docs: https://pagescms.org/docs/
- Support: Check the Pages CMS GitHub issues

## 🔄 Switching Back (if needed)

If you ever need to switch back to Decap CMS:
1. Restore `admin/config.yml` from git history
2. Restore `admin/index.html` from git history
3. Remove `.pages.yml`

But you probably won't want to - Pages CMS is much better! 😊
