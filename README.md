# Rachel Marie Hannon Website

A simple, editable website hosted on Cloudflare Pages with Decap CMS for easy content management.

## 🎯 Recommended: Use Netlify (Easiest Setup)

**Netlify is the easiest option** - it has built-in support for Decap CMS with no OAuth setup required. Both Netlify and Cloudflare Pages are free, so you can choose either!

### Quick Netlify Setup:
1. Push code to GitHub (see step 1 below)
2. Go to [netlify.com](https://netlify.com) and sign up (free)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repo
5. Deploy settings:
   - Build command: (leave empty)
   - Publish directory: `/` (root)
6. Go to Site settings → Identity → Enable Identity service
7. Go to Identity → Services → Git Gateway → Enable Git Gateway
8. Done! Your sister can now go to `your-site.netlify.app/admin` and login!

---

## Alternative: Cloudflare Pages Setup (More Complex)

If you prefer Cloudflare Pages, follow these steps:

### 1. Push to GitHub

1. Create a new GitHub repository
2. Push this code to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### 2. Configure Decap CMS for Cloudflare

1. Uncomment the GitHub backend section in `admin/config.yml`
2. Comment out the git-gateway section
3. Update:
   - `repo`: Your GitHub username and repo name
   - `base_url`: Your Cloudflare Pages URL

### 3. Set up GitHub OAuth (Required for Cloudflare)

Decap CMS needs GitHub OAuth to work with Cloudflare Pages:

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Your site name
   - **Homepage URL**: Your Cloudflare Pages URL
   - **Authorization callback URL**: `https://your-site.pages.dev/api/auth`
4. Register and copy the **Client ID**
5. Generate a **Client Secret**
6. Add these as environment variables in Cloudflare Pages settings

### 4. Deploy to Cloudflare Pages

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Select your GitHub repository
4. Configure build settings:
   - **Framework preset**: None (or "Other")
   - **Build command**: (leave empty or use `echo "No build"`)
   - **Build output directory**: `/` (root)
   - **Root directory**: `/` (root)
5. Click **Save and Deploy**

### 5. Set up OAuth Proxy (Required for Cloudflare)

Cloudflare Pages needs a proxy to handle GitHub OAuth. You have a few options:

**Option A: Use Decap CMS Proxy Server (Easiest)**

Run this locally when editing (or deploy as a service):
```bash
npx decap-server
```

Then update `admin/config.yml`:
```yaml
backend:
  name: github
  repo: YOUR_USERNAME/YOUR_REPO_NAME
  branch: main
  proxy_url: http://localhost:8081/api
```

**Option B: Use a Cloudflare Worker (More complex)**

The `functions/api/auth.ts` file provides a starting point, but you'll need to implement the full OAuth flow.

**Option C: Use Netlify Instead (Recommended!)**

Seriously, Netlify makes this so much easier - no OAuth setup needed!

### 6. Access the Admin Interface

Once deployed, your sister can access the admin at:
- `https://your-site.pages.dev/admin`

She'll need to:
1. Click "Login with GitHub"
2. Authorize the GitHub OAuth app
3. Start editing content!

## Editing Content

1. Go to `/admin` on your site
2. Login with GitHub
3. Click on "Site Content" collection
4. Edit the fields
5. Click "Save" - changes will be committed to GitHub and trigger a new Cloudflare Pages deployment

## File Structure

```
├── admin/
│   ├── index.html      # Decap CMS admin interface
│   └── config.yml      # CMS configuration
├── content/
│   └── site.json       # Editable content (managed by CMS)
├── index.html          # Main site (loads content from JSON)
├── styles.css          # Site styles
└── _redirects          # Cloudflare Pages redirects
```

## Alternative: Simpler Setup with Netlify

If you want an even simpler setup, consider using Netlify instead of Cloudflare Pages:

1. Netlify has built-in support for Decap CMS with Git Gateway
2. No OAuth setup required
3. Free tier is generous
4. Just connect GitHub repo and it works!

To use Netlify:
1. Push code to GitHub (same as above)
2. Go to [Netlify](https://netlify.com)
3. Click "New site from Git"
4. Select your repo
5. Deploy settings:
   - Build command: (leave empty)
   - Publish directory: `/` (root)
6. Enable "Identity" in Site settings → Identity
7. Enable "Git Gateway" in Identity settings
8. Done! Admin works at `/admin` immediately

## Support

For issues with:
- **Decap CMS**: [Decap CMS Documentation](https://decapcms.org/docs/)
- **Cloudflare Pages**: [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- **GitHub OAuth**: [GitHub OAuth Docs](https://docs.github.com/en/apps/oauth-apps)
