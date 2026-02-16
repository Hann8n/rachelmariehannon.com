# Rachel Marie Hannon Website

A simple, editable website with **Pages CMS** for easy, user-friendly content management.

## 🎯 Content Management with Pages CMS

This site uses **Pages CMS** - a simple, user-friendly CMS that's much easier to use than Decap CMS!

### ✨ Quick Start for Editing:

1. Go to **[app.pagescms.org](https://app.pagescms.org/)**
2. Sign in with your **GitHub account**
3. Connect this repository
4. Start editing!

**That's it!** No complicated setup needed. Pages CMS is:
- 🎨 Cleaner, simpler interface
- 📱 Mobile-friendly
- ⚡ Faster and more intuitive
- 🆓 100% free

See [PAGES_CMS_SETUP.md](./PAGES_CMS_SETUP.md) for detailed instructions.

---

## 🚀 Deployment Options

### Option 1: Netlify (Recommended - Easiest)

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com) and sign up (free)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repo
5. Deploy settings:
   - Build command: (leave empty)
   - Publish directory: `/` (root)
6. Done! Your site is live at `your-site.netlify.app`

---

### Option 2: Cloudflare Pages

1. Push code to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
3. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
4. Select your GitHub repository
5. Deploy settings:
   - **Framework preset**: None
   - **Build command**: (leave empty)
   - **Build output directory**: `/` (root)
6. Done! Your site is live

## Editing Content

### Using Pages CMS (Current Setup)

1. Go to **[app.pagescms.org](https://app.pagescms.org/)**
2. Sign in with GitHub
3. Select your repository
4. Click on "Site Content"
5. Edit any field you want
6. Click "Save" - changes are committed to GitHub automatically

The interface is much simpler and cleaner than before!

## File Structure

```
├── admin/
│   └── index.html      # Admin redirect page (points to Pages CMS)
├── .pages.yml          # Pages CMS configuration
├── content/
│   └── site.json       # Editable content (managed by Pages CMS)
├── index.html          # Main site (loads content from JSON)
├── styles.css          # Site styles
├── PAGES_CMS_SETUP.md  # Setup guide for Pages CMS
└── _redirects          # Cloudflare Pages redirects
```


## Support

For issues with:
- **Pages CMS**: [Pages CMS Documentation](https://pagescms.org/docs/)
- **Cloudflare Pages**: [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- **Netlify**: [Netlify Docs](https://docs.netlify.com/)
