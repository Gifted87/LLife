# Deploying Lagos Life to Vercel

This project is configured for deployment to **Vercel** with static HTML/CSS/JS frontend files and a Node.js Serverless Function for the database API.

---

## ⚡ Important Note on Serverless & SQLite

- **Local Development**: Records are saved persistently to `./data.sqlite`.
- **Vercel Serverless Architecture**:
  - Vercel serverless functions run in an ephemeral container with a read-only filesystem (writable only in `/tmp`).
  - To prevent read-only crashes, `api/records.js` automatically writes to `os.tmpdir()/data.sqlite` on Vercel.
  - *Tip for production permanent persistence*: If you want records to persist across cold starts and scaling instances in the cloud, Vercel documentation recommends using a cloud SQLite provider like **[Turso](https://turso.tech)** (libSQL over HTTP) or **Vercel Postgres/KV**.

---

## Deployment Options

### Option 1: Deploy with Vercel CLI (Quickest)

Run the following command directly in your project terminal:

```powershell
npx vercel
```

1. Log in or create a free Vercel account when prompted in the browser.
2. Accept the default project settings:
   - *Set up and deploy?* **Y**
   - *Which scope?* (Select your account)
   - *Link to existing project?* **N**
   - *Project name?* **lagos-life** (or press Enter)
   - *In which directory is your code located?* **./** (press Enter)
3. Your live deployment URL will be generated (e.g., `https://lagos-life.vercel.app`).
4. To deploy directly to production, run:
   ```powershell
   npx vercel --prod
   ```

---

### Option 2: Deploy via GitHub (Recommended for automatic continuous deployment)

1. Initialize Git in the project (if not already done):
   ```powershell
   git init
   git add .
   git commit -m "Initial commit - Lagos Life Vercel ready"
   ```
2. Create a new repository on [GitHub](https://github.com/new).
3. Push your repository:
   ```powershell
   git remote add origin https://github.com/<your-username>/lagos-life.git
   git branch -M main
   git push -u origin main
   ```
4. Visit **[vercel.com/new](https://vercel.com/new)** and click **Import** next to your GitHub repository.
5. Click **Deploy**. Vercel will build and host your site with automatic SSL and CDN distribution!

---

## Project Structure on Vercel

| Path | Purpose | Handled By |
|------|---------|------------|
| `/` or `/index.html` | Lagos Life login page | Vercel Edge CDN |
| `/records` or `/records.html` | Database Records Dashboard | Vercel Edge CDN (rewritten via `vercel.json`) |
| `/api/records` | GET, POST, DELETE records API | Vercel Serverless Function (`api/records.js`) |
