# Deploy to GitHub Pages

This project can be deployed to GitHub Pages for free static hosting.

## 🚀 Quick Deploy

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/stock-monitor.git
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section (or click "Pages" in left sidebar)
4. Under "Source", select **GitHub Actions**

### 3. Trigger Deployment

GitHub Actions will automatically deploy when you push to main branch.

Or manually trigger:
- Go to **Actions** tab
- Select "Build and Deploy to GitHub Pages"
- Click **Run workflow**

### 4. Access Your Site

After deployment (usually 1-2 minutes), your site will be available at:
```
https://yourusername.github.io/stock-monitor/
```

## 📋 How It Works

### Workflow Process

1. **Build**: GitHub Actions runs on Ubuntu virtual machine
   - Installs Node.js 20
   - Runs `npm ci` to install dependencies
   - Builds React app with `npm run build`
   - Generates static HTML/CSS/JS files

2. **Deploy**: GitHub Pages hosts the static files
   - No server-side code (no Node.js backend)
   - Files served from CDN
   - HTTPS enabled by default
   - Custom domain support (optional)

### Demo Mode

Since GitHub Pages only supports static files, the app runs in **Demo Mode**:
- ✅ Shows default stocks (Nintendo, etc.)
- ✅ Displays simulated price data
- ✅ All UI features work
- ❌ No real-time API data (no backend server)

To use real data, deploy the backend separately.

## 🔧 Customization

### Change Default Stocks

Edit `src/StockFetcher.tsx`:

```typescript
const DEFAULT_STOCKS: StockInfo[] = [
  { key: '7974', code: '7974.T', name: 'Nintendo', exchange: 'TSE' },
  { key: '7203', code: '7203.T', name: 'Toyota', exchange: 'TSE' },
  // Add your stocks here
];
```

### Add Real Data (Optional)

To use real stock data, you have options:

**Option 1: Client-side API calls**
```typescript
// Call Yahoo Finance directly from browser
const response = await fetch(
  'https://query1.finance.yahoo.com/v8/finance/chart/7974.T'
);
```
Note: May have CORS issues.

**Option 2: Deploy backend separately**
- Deploy backend to: Heroku, Railway, Render, or VPS
- Update API_BASE_URL in frontend
- Enable CORS on backend

**Option 3: Use serverless functions**
- Use Cloudflare Workers
- Use Vercel Edge Functions
- Use Netlify Functions

### Custom Domain

1. Go to repository **Settings** > **Pages**
2. Under "Custom domain", enter your domain
3. Add DNS record pointing to GitHub Pages
4. Wait for SSL certificate (automatic)

## 📊 Features on GitHub Pages

| Feature | Status | Notes |
|---------|--------|-------|
| Static HTML | ✅ | Works perfectly |
| React SPA | ✅ | Client-side routing |
| CSS/Tailwind | ✅ | Fully styled |
| Responsive | ✅ | Mobile-friendly |
| Charts | ✅ | Recharts works |
| Real-time data | ❌ | No backend |
| Price alerts | ❌ | No backend |
| Notifications | ❌ | No service worker |

## 🐛 Troubleshooting

### 404 errors on refresh

Already fixed! The workflow copies `index.html` to `404.html` for SPA routing.

### Changes not showing

1. Clear browser cache (Ctrl+Shift+R)
2. Check if Actions workflow succeeded
3. Verify Pages source is set to "GitHub Actions"

### Build fails

Check Actions log:
```bash
# Click red X on commit or go to Actions tab
```

Common issues:
- Missing `homepage` in package.json (should be fine with default)
- Build errors in React code

### CORS errors (if adding real API)

Add to backend if you deploy one:
```javascript
app.use(cors({
  origin: 'https://yourusername.github.io'
}));
```

## 💰 Cost

**Completely FREE!**
- GitHub Actions: 2,000 minutes/month (more than enough)
- GitHub Pages: Unlimited for public repos
- HTTPS certificate: Free and auto-renewed
- CDN: Global edge servers

## 🔗 Links

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/#github-pages)

## 📝 Next Steps

1. ✅ Deploy to GitHub Pages (free)
2. ⭐ Star this repository
3. 🔧 Customize stocks and UI
4. 🚀 Share your deployed link!
