# iFlow Deployment Guide for Render.com

This guide walks you through deploying the iFlow application to Render.com with a PostgreSQL database.

## Prerequisites

1. A Render.com account (free tier available)
2. Git repository with your iFlow code
3. GitHub/GitLab account (for connecting to Render)

## Architecture Overview

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (managed by Render)
- **Deployment**: Single web service serving both frontend and backend

## Deployment Steps

### Option 1: Using Render Blueprint (Recommended)

1. **Push your code to GitHub/GitLab**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy via Render Dashboard**
   - Go to https://dashboard.render.com
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Render will automatically detect `render.yaml` and create:
     - PostgreSQL database (`iflow-db`)
     - Web service (`iflow-web`)

3. **Wait for deployment**
   - Database creation: ~2-3 minutes
   - Web service build: ~5-7 minutes
   - Total: ~10 minutes

4. **Initialize the database**
   - Once deployed, connect to your database using the connection string from Render dashboard
   - Run the schema:
     ```bash
     psql <DATABASE_URL> < database/schema.sql
     ```

### Option 2: Manual Setup

#### Step 1: Create PostgreSQL Database

1. In Render Dashboard, click "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `iflow-db`
   - **Database**: `iflow`
   - **User**: `iflow_user`
   - **Region**: Choose closest to your users
   - **Plan**: Free (or Starter for production)
3. Click "Create Database"
4. Save the **Internal Database URL** (starts with `postgresql://`)

#### Step 2: Initialize Database Schema

1. Connect to your database:
   ```bash
   psql <INTERNAL_DATABASE_URL>
   ```

2. Run the schema file:
   ```bash
   \i database/schema.sql
   ```
   
   Or copy-paste the contents of `database/schema.sql`

3. Verify tables were created:
   ```sql
   \dt
   ```

#### Step 3: Create Web Service

1. In Render Dashboard, click "New +" → "Web Service"
2. Connect your Git repository
3. Configure:
   - **Name**: `iflow-web`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: Leave blank
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Starter for production)

4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = (paste Internal Database URL from Step 1)
   - `JWT_SECRET` = (generate a secure random string, e.g., use `openssl rand -base64 32`)
   - `PORT` = `3000` (Render auto-assigns this)

5. Click "Create Web Service"

#### Step 4: Wait for Build

- First build takes 5-10 minutes
- Watch the logs for any errors
- Once deployed, you'll get a URL like: `https://iflow-web.onrender.com`

## Post-Deployment

### Verify Deployment

1. Check health endpoint:
   ```bash
   curl https://your-app.onrender.com/api/health
   ```

2. Test registration:
   - Visit your app URL
   - Click "Sign Up"
   - Create a test account

### Database Management

**View Database**
```bash
psql <DATABASE_URL>
```

**Backup Database**
```bash
pg_dump <DATABASE_URL> > backup.sql
```

**Restore Database**
```bash
psql <DATABASE_URL> < backup.sql
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret for JWT tokens | `your-super-secret-key` |
| `CLIENT_URL` | Frontend URL (for CORS) | `https://your-app.onrender.com` |

## Troubleshooting

### Build Fails

**Issue**: `npm install` fails
- **Solution**: Check `package.json` for correct dependencies
- **Solution**: Ensure Node version compatibility (18+)

**Issue**: `npm run build` fails
- **Solution**: Check Vite config and ensure all imports are correct
- **Solution**: Review build logs for specific errors

### Database Connection Issues

**Issue**: "Connection refused"
- **Solution**: Verify `DATABASE_URL` is the **Internal** URL, not External
- **Solution**: Check database is in same region as web service

**Issue**: "Too many connections"
- **Solution**: Reduce connection pool size in `server/database/db.js`
- **Solution**: Upgrade database plan

### Runtime Errors

**Issue**: 404 on frontend routes
- **Solution**: Ensure `server/index.js` has the catch-all route for SPA

**Issue**: CORS errors
- **Solution**: Verify `CLIENT_URL` environment variable is set correctly

## Scaling Considerations

### Free Tier Limitations
- Web service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Database limited to 1GB storage

### Upgrading to Paid Plans
- **Starter Plan** ($7/month): No spin-down, better performance
- **Database Plan** ($7/month): 10GB storage, better performance

## Monitoring

### Render Dashboard
- View logs in real-time
- Monitor CPU/memory usage
- Check deployment history

### Application Logs
```bash
# View recent logs
render logs -s iflow-web

# Follow logs
render logs -s iflow-web -f
```

## Custom Domain (Optional)

1. Go to your web service settings
2. Click "Custom Domains"
3. Add your domain (e.g., `iflow.com`)
4. Update DNS records as instructed
5. SSL certificate auto-provisioned

## Continuous Deployment

Render automatically deploys when you push to your connected branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render will:
1. Detect the push
2. Run build command
3. Deploy new version
4. Zero-downtime deployment

## Security Checklist

- [ ] Change default `JWT_SECRET` to a strong random value
- [ ] Enable database backups in Render dashboard
- [ ] Set up monitoring/alerting
- [ ] Review and restrict database IP allowlist if needed
- [ ] Enable 2FA on Render account
- [ ] Regularly update dependencies

## Support

- **Render Docs**: https://render.com/docs
- **iFlow Issues**: Create an issue in your repository
- **Community**: Join the flow arts community forums

## Next Steps

1. Set up monitoring (e.g., Sentry for error tracking)
2. Configure email service for notifications
3. Set up file storage (e.g., AWS S3) for video uploads
4. Implement caching (Redis) for better performance
5. Add analytics (e.g., Google Analytics, Plausible)

---

**Congratulations!** Your iFlow application is now live on Render.com 🎉
